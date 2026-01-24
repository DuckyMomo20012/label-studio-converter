import { existsSync } from 'node:fs';
import sharp from 'sharp';
import {
  DEFAULT_ADAPT_RESIZE_MARGIN,
  DEFAULT_ADAPT_RESIZE_MAX_BOX_SIZE,
  DEFAULT_ADAPT_RESIZE_MAX_COMPONENT_SIZE,
  DEFAULT_ADAPT_RESIZE_MAX_HORIZONTAL_EXPANSION,
  DEFAULT_ADAPT_RESIZE_MIN_COMPONENT_SIZE,
  DEFAULT_ADAPT_RESIZE_MORPHOLOGY_SIZE,
  DEFAULT_ADAPT_RESIZE_OUTLIER_PERCENTILE,
  DEFAULT_ADAPT_RESIZE_THRESHOLD,
  DEFAULT_ADAPT_RESIZE_TIMEOUT_MS,
} from '@/constants';
import {
  calculateCenter,
  getBoxRotation,
  getMinimumBoundingRect,
} from '@/lib/geometry';
import { type Transformer } from '@/lib/processor';
import { type UnifiedPoint } from '@/lib/unified';
import { findConnectedComponents } from '@/transformers/adapt-resize/connected-components';
import { morphologicalClosing } from '@/transformers/adapt-resize/morphology';
import {
  createSeparatorDetector,
  findSeparatorBoundaries,
} from '@/transformers/adapt-resize/separator-detection';

// Timeout wrapper to prevent hanging
function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutValue: T,
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) =>
      setTimeout(() => resolve(timeoutValue), timeoutMs),
    ),
  ]);
}

export type AdaptResizeTransformerOptions = {
  threshold?: number;
  margin?: number;
  minComponentSize?: number;
  maxComponentSize?: number;
  outlierPercentile?: number;
  morphologySize?: number;
  maxHorizontalExpansion?: number;
};

/**
 * Adaptive resize for Sino-Nom OCR bounding boxes
 * Expands tight bounding boxes to properly wrap around characters while:
 * - Filtering out dirt/noise (small outliers)
 * - Applying morphological operations to connect character strokes
 * - Using percentile-based boundaries to ignore outliers
 * - Limiting horizontal expansion to avoid adjacent columns
 */
export async function adaptiveResizeBoundingBox(
  points: UnifiedPoint[],
  imagePath: string,
  options: AdaptResizeTransformerOptions,
): Promise<UnifiedPoint[]> {
  if (points.length === 0 || !existsSync(imagePath)) {
    return points;
  }

  const {
    threshold = DEFAULT_ADAPT_RESIZE_THRESHOLD,
    margin = DEFAULT_ADAPT_RESIZE_MARGIN,
    minComponentSize = DEFAULT_ADAPT_RESIZE_MIN_COMPONENT_SIZE,
    maxComponentSize = DEFAULT_ADAPT_RESIZE_MAX_COMPONENT_SIZE,
    outlierPercentile = DEFAULT_ADAPT_RESIZE_OUTLIER_PERCENTILE,
    morphologySize = DEFAULT_ADAPT_RESIZE_MORPHOLOGY_SIZE,
    maxHorizontalExpansion = DEFAULT_ADAPT_RESIZE_MAX_HORIZONTAL_EXPANSION,
  } = options;

  try {
    // Check if box is rotated
    const rotation = getBoxRotation(points);
    const isRotated = Math.abs(rotation) > 0.01; // > 0.5 degrees

    // Get current bounding box (axis-aligned for rotated, actual for aligned)
    const bbox = getMinimumBoundingRect(points);
    const x = Math.max(0, Math.floor(bbox.minX));
    const y = Math.max(0, Math.floor(bbox.minY));
    const w = Math.max(1, Math.ceil(bbox.width));
    const h = Math.max(1, Math.ceil(bbox.height));

    // Skip extremely large boxes - increased to 3000 for skewed text
    if (
      w > DEFAULT_ADAPT_RESIZE_MAX_BOX_SIZE ||
      h > DEFAULT_ADAPT_RESIZE_MAX_BOX_SIZE
    ) {
      console.warn(
        `Skipping adaptive resize for large box (${w}x${h}) in ${imagePath}`,
      );
      return points;
    }

    // Reduce padding for analysis - shrink first, expand later
    const padding = margin;
    const analysisX = Math.max(0, x - padding);
    const analysisY = Math.max(0, y - padding);

    // Load image metadata
    const image = sharp(imagePath);
    let metadata;
    try {
      metadata = await image.metadata();
    } catch (metadataError) {
      const errorMessage =
        metadataError instanceof Error
          ? metadataError.message
          : String(metadataError);
      console.warn(
        `Skipping adaptive resize for ${imagePath}: ${errorMessage}`,
      );
      return points;
    }

    if (!metadata.width || !metadata.height) {
      return points;
    }

    // Skip very large images
    const MAX_IMAGE_SIZE = 10000;
    if (metadata.width > MAX_IMAGE_SIZE || metadata.height > MAX_IMAGE_SIZE) {
      console.warn(
        `Skipping adaptive resize for large image (${metadata.width}x${metadata.height}): ${imagePath}`,
      );
      return points;
    }

    const analysisW = Math.min(w + padding * 2, metadata.width - analysisX);
    const analysisH = Math.min(h + padding * 2, metadata.height - analysisY);

    if (analysisW <= 0 || analysisH <= 0) {
      return points;
    }

    // Extract ROI, grayscale, threshold
    const { data, info } = await image
      .extract({
        left: analysisX,
        top: analysisY,
        width: analysisW,
        height: analysisH,
      })
      .grayscale()
      .threshold(threshold)
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Apply morphological closing to connect character strokes
    const morphed = morphologicalClosing(
      data,
      info.width,
      info.height,
      morphologySize,
    );

    // Find connected components and filter by size
    const components = findConnectedComponents(
      morphed,
      info.width,
      info.height,
      threshold,
    );
    const validComponents = components.filter(
      (comp) => comp.size >= minComponentSize && comp.size <= maxComponentSize,
    );

    if (validComponents.length === 0) {
      return points;
    }

    // Collect all valid pixel coordinates
    const validPixels: Array<{ x: number; y: number }> = [];
    validComponents.forEach((comp) => {
      comp.pixels.forEach((pixelIdx) => {
        const px = pixelIdx % info.width;
        const py = Math.floor(pixelIdx / info.width);
        validPixels.push({ x: px, y: py });
      });
    });

    // Use percentile-based boundaries for HORIZONTAL only
    // Keep FULL VERTICAL extent to avoid cutting off text
    const sortedX = validPixels.map((p) => p.x).sort((a, b) => a - b);
    const sortedY = validPixels.map((p) => p.y).sort((a, b) => a - b);

    const percentileIndex = Math.floor(
      (validPixels.length * outlierPercentile) / 100,
    );
    const reversePercentileIndex = validPixels.length - 1 - percentileIndex;

    const minX = sortedX[percentileIndex] || 0;
    const maxX = sortedX[reversePercentileIndex] || info.width - 1;
    const minY = sortedY[0] || 0;
    const maxY = sortedY[sortedY.length - 1] || info.height - 1;

    // Create separator detector
    const detectSeparator = createSeparatorDetector({
      data,
      width: info.width,
      height: info.height,
      threshold,
    });

    // Find separator boundaries
    const originalBoxMinX = x - analysisX;
    const originalBoxMaxX = x - analysisX + w;

    const { left: leftBoundary, right: rightBoundary } =
      findSeparatorBoundaries(
        minX,
        maxX,
        originalBoxMinX,
        originalBoxMaxX,
        maxHorizontalExpansion,
        detectSeparator,
        info.width,
      );

    // SHRINK FIRST: Use separator-aware boundaries
    // Ensure we don't expand beyond limits
    const limitedMinX = Math.max(
      leftBoundary,
      originalBoxMinX - maxHorizontalExpansion,
    );
    const limitedMaxX = Math.min(
      rightBoundary,
      originalBoxMaxX + maxHorizontalExpansion,
    );

    // EXPAND LATER: Add margin
    const newMinX = Math.max(0, analysisX + limitedMinX - margin);
    const newMinY = Math.max(0, analysisY + minY - margin);
    const newMaxX = Math.min(
      metadata.width,
      analysisX + limitedMaxX + 1 + margin,
    );
    const newMaxY = Math.min(metadata.height, analysisY + maxY + 1 + margin);

    // If original box was rotated, rotate the result to match
    if (isRotated) {
      const center = calculateCenter(points);
      const cos = Math.cos(rotation);
      const sin = Math.sin(rotation);

      // Create axis-aligned corners
      const corners = [
        { x: newMinX, y: newMinY },
        { x: newMaxX, y: newMinY },
        { x: newMaxX, y: newMaxY },
        { x: newMinX, y: newMaxY },
      ];

      // Rotate corners around original center to match input rotation
      const rotatedCorners = corners.map(({ x: px, y: py }) => {
        const dx = px - center.x;
        const dy = py - center.y;
        return {
          x: center.x + dx * cos - dy * sin,
          y: center.y + dx * sin + dy * cos,
        } as UnifiedPoint;
      });

      return rotatedCorners;
    }

    return [
      { x: newMinX, y: newMinY },
      { x: newMaxX, y: newMinY },
      { x: newMaxX, y: newMaxY },
      { x: newMinX, y: newMaxY },
    ];
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(`Skipping adaptive resize for ${imagePath}: ${errorMessage}`);
    return points;
  }
}

export const adaptResizeTransformer = (async (
  boxes,
  imageFilePath: string,
  options,
) => {
  const {
    threshold = 128,
    margin = 5,
    minComponentSize = 10,
    maxComponentSize = 100000,
    outlierPercentile = 2,
    morphologySize = 2,
    maxHorizontalExpansion = 50,
  } = options || {};

  if (boxes.length === 0) {
    return boxes;
  }

  console.log(
    `Processing ${boxes.length} boxes with adaptive resize for: ${imageFilePath}`,
  );

  // Process each box with timeout protection (30 seconds per box)
  const resized = await Promise.all(
    boxes.map(async (box, index) => {
      const newPoints = await withTimeout(
        adaptiveResizeBoundingBox(box.points, imageFilePath, {
          threshold,
          margin,
          minComponentSize,
          maxComponentSize,
          outlierPercentile,
          morphologySize,
          maxHorizontalExpansion,
        }),
        DEFAULT_ADAPT_RESIZE_TIMEOUT_MS,
        box.points,
      );

      // Log progress for large batch
      if (boxes.length > 10 && (index + 1) % 10 === 0) {
        console.log(`  Processed ${index + 1}/${boxes.length} boxes`);
      }

      // Check if timed out
      if (newPoints === box.points) {
        const isTimeout = Date.now() % 2 === 0;
        if (isTimeout) {
          console.warn(
            `  Box ${index + 1} timed out after ${DEFAULT_ADAPT_RESIZE_TIMEOUT_MS}ms, using original points`,
          );
        }
      }

      return {
        ...box,
        points: newPoints,
      };
    }),
  );

  console.log(`✓ Completed adaptive resize for ${boxes.length} boxes`);
  return resized;
}) satisfies Transformer<AdaptResizeTransformerOptions>;
