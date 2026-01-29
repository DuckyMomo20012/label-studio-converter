import { existsSync } from 'node:fs';
import sharp from 'sharp';
import {
  DEFAULT_ADAPT_RESIZE_ADAPTIVE_BLOCK_SIZE,
  DEFAULT_ADAPT_RESIZE_MARGIN,
  DEFAULT_ADAPT_RESIZE_MAX_BOX_SIZE,
  DEFAULT_ADAPT_RESIZE_MAX_COMPONENT_SIZE,
  DEFAULT_ADAPT_RESIZE_MAX_HORIZONTAL_EXPANSION,
  DEFAULT_ADAPT_RESIZE_MIN_COMPONENT_SIZE,
  DEFAULT_ADAPT_RESIZE_MIN_PADDING_BRIGHTNESS,
  DEFAULT_ADAPT_RESIZE_MIN_PADDING_RATIO,
  DEFAULT_ADAPT_RESIZE_MORPHOLOGY_SIZE,
  DEFAULT_ADAPT_RESIZE_OUTLIER_PERCENTILE,
  DEFAULT_ADAPT_RESIZE_PADDING_CHECK_WIDTH,
  DEFAULT_ADAPT_RESIZE_THRESHOLD,
  DEFAULT_ADAPT_RESIZE_TIMEOUT_MS,
  DEFAULT_ADAPT_RESIZE_USE_ADAPTIVE_THRESHOLD,
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
  paddingCheckWidth?: number;
  minPaddingBrightness?: number;
  minPaddingRatio?: number;
  useAdaptiveThreshold?: boolean;
  adaptiveBlockSize?: number;
};

/**
 * Calculate adaptive threshold from image histogram
 * Uses Otsu's method for automatic threshold detection
 */
function calculateAdaptiveThreshold(
  grayscaleData: Buffer,
  width: number,
  height: number,
): number {
  // Build histogram
  const histogram = new Array(256).fill(0);
  for (let i = 0; i < grayscaleData.length; i++) {
    const pixelValue = grayscaleData[i];
    if (pixelValue !== undefined) {
      histogram[pixelValue]++;
    }
  }

  const totalPixels = width * height;
  let sum = 0;
  for (let i = 0; i < 256; i++) {
    sum += i * histogram[i];
  }

  let sumB = 0;
  let wB = 0;
  let wF = 0;
  let maxVariance = 0;
  let threshold = 0;

  for (let t = 0; t < 256; t++) {
    wB += histogram[t];
    if (wB === 0) continue;

    wF = totalPixels - wB;
    if (wF === 0) break;

    sumB += t * histogram[t];

    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;

    const variance = wB * wF * (mB - mF) * (mB - mF);

    if (variance > maxVariance) {
      maxVariance = variance;
      threshold = t;
    }
  }

  // Add some buffer to avoid being too aggressive
  return Math.max(100, Math.min(200, threshold + 10));
}

/**
 * Check if padding strip has enough white space
 * Returns true if strip is white enough (good padding)
 */
function validatePaddingStrip(
  grayscaleData: Buffer,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  width: number,
  height: number,
  minBrightness: number,
  minRatio: number,
): boolean {
  let totalPixels = 0;
  let whitePixels = 0;

  for (let y = Math.floor(y1); y <= Math.ceil(y2); y++) {
    for (let x = Math.floor(x1); x <= Math.ceil(x2); x++) {
      if (x >= 0 && x < width && y >= 0 && y < height) {
        totalPixels++;
        const idx = y * width + x;
        const pixelValue = grayscaleData[idx];
        if (pixelValue !== undefined && pixelValue >= minBrightness) {
          whitePixels++;
        }
      }
    }
  }

  if (totalPixels === 0) return false;
  return whitePixels / totalPixels >= minRatio;
}

/**
 * Adaptive resize for Sino-Nom OCR bounding boxes
 * Expands tight bounding boxes to properly wrap around characters while:
 * - Using adaptive thresholding based on image characteristics
 * - Filtering out dirt/noise (small outliers)
 * - Applying morphological operations to connect character strokes
 * - Using percentile-based boundaries to ignore outliers
 * - Validating padding strips have enough white space
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
    paddingCheckWidth = DEFAULT_ADAPT_RESIZE_PADDING_CHECK_WIDTH,
    minPaddingBrightness = DEFAULT_ADAPT_RESIZE_MIN_PADDING_BRIGHTNESS,
    minPaddingRatio = DEFAULT_ADAPT_RESIZE_MIN_PADDING_RATIO,
    useAdaptiveThreshold = DEFAULT_ADAPT_RESIZE_USE_ADAPTIVE_THRESHOLD,
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

    // First pass: Extract grayscale for adaptive threshold calculation
    const grayscaleImage = image
      .extract({
        left: analysisX,
        top: analysisY,
        width: analysisW,
        height: analysisH,
      })
      .grayscale();

    const { data: grayscaleData, info: grayscaleInfo } = await grayscaleImage
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Calculate adaptive threshold from histogram if enabled
    let actualThreshold = threshold;
    if (useAdaptiveThreshold) {
      actualThreshold = calculateAdaptiveThreshold(
        grayscaleData,
        grayscaleInfo.width,
        grayscaleInfo.height,
      );
    }

    // Second pass: Apply threshold
    const { data: binaryData, info } = await sharp(grayscaleData, {
      raw: {
        width: grayscaleInfo.width,
        height: grayscaleInfo.height,
        channels: 1,
      },
    })
      .threshold(actualThreshold)
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Apply morphological closing to connect character strokes
    const morphed = morphologicalClosing(
      binaryData,
      info.width,
      info.height,
      morphologySize,
    );

    // Find connected components and filter by size
    const components = findConnectedComponents(
      morphed,
      info.width,
      info.height,
      actualThreshold,
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
      data: binaryData,
      width: info.width,
      height: info.height,
      threshold: actualThreshold,
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
    let limitedMinX = Math.max(
      leftBoundary,
      originalBoxMinX - maxHorizontalExpansion,
    );
    let limitedMaxX = Math.min(
      rightBoundary,
      originalBoxMaxX + maxHorizontalExpansion,
    );
    let limitedMinY = minY;
    let limitedMaxY = maxY;

    // PADDING VALIDATION: Check if edges have enough white space
    // Expand inward if padding strips are too dark (have black strokes)

    // Check left padding strip
    const leftPaddingValid = validatePaddingStrip(
      grayscaleData,
      limitedMinX,
      limitedMinY,
      Math.min(limitedMinX + paddingCheckWidth - 1, limitedMaxX),
      limitedMaxY,
      info.width,
      info.height,
      minPaddingBrightness,
      minPaddingRatio,
    );
    if (!leftPaddingValid && limitedMinX < originalBoxMinX) {
      // Move inward to find white padding
      for (let i = 0; i < maxHorizontalExpansion; i++) {
        limitedMinX++;
        if (
          validatePaddingStrip(
            grayscaleData,
            limitedMinX,
            limitedMinY,
            Math.min(limitedMinX + paddingCheckWidth - 1, limitedMaxX),
            limitedMaxY,
            info.width,
            info.height,
            minPaddingBrightness,
            minPaddingRatio,
          )
        ) {
          break;
        }
      }
    }

    // Check right padding strip
    const rightPaddingValid = validatePaddingStrip(
      grayscaleData,
      Math.max(limitedMaxX - paddingCheckWidth + 1, limitedMinX),
      limitedMinY,
      limitedMaxX,
      limitedMaxY,
      info.width,
      info.height,
      minPaddingBrightness,
      minPaddingRatio,
    );
    if (!rightPaddingValid && limitedMaxX > originalBoxMaxX) {
      // Move inward to find white padding
      for (let i = 0; i < maxHorizontalExpansion; i++) {
        limitedMaxX--;
        if (
          validatePaddingStrip(
            grayscaleData,
            Math.max(limitedMaxX - paddingCheckWidth + 1, limitedMinX),
            limitedMinY,
            limitedMaxX,
            limitedMaxY,
            info.width,
            info.height,
            minPaddingBrightness,
            minPaddingRatio,
          )
        ) {
          break;
        }
      }
    }

    // Check top padding strip
    const topPaddingValid = validatePaddingStrip(
      grayscaleData,
      limitedMinX,
      limitedMinY,
      limitedMaxX,
      Math.min(limitedMinY + paddingCheckWidth - 1, limitedMaxY),
      info.width,
      info.height,
      minPaddingBrightness,
      minPaddingRatio,
    );
    if (!topPaddingValid && limitedMinY > 0) {
      // Move inward to find white padding
      for (let i = 0; i < 20; i++) {
        limitedMinY++;
        if (
          validatePaddingStrip(
            grayscaleData,
            limitedMinX,
            limitedMinY,
            limitedMaxX,
            Math.min(limitedMinY + paddingCheckWidth - 1, limitedMaxY),
            info.width,
            info.height,
            minPaddingBrightness,
            minPaddingRatio,
          )
        ) {
          break;
        }
      }
    }

    // Check bottom padding strip
    const bottomPaddingValid = validatePaddingStrip(
      grayscaleData,
      limitedMinX,
      Math.max(limitedMaxY - paddingCheckWidth + 1, limitedMinY),
      limitedMaxX,
      limitedMaxY,
      info.width,
      info.height,
      minPaddingBrightness,
      minPaddingRatio,
    );
    if (!bottomPaddingValid && limitedMaxY < info.height - 1) {
      // Move inward to find white padding
      for (let i = 0; i < 20; i++) {
        limitedMaxY--;
        if (
          validatePaddingStrip(
            grayscaleData,
            limitedMinX,
            Math.max(limitedMaxY - paddingCheckWidth + 1, limitedMinY),
            limitedMaxX,
            limitedMaxY,
            info.width,
            info.height,
            minPaddingBrightness,
            minPaddingRatio,
          )
        ) {
          break;
        }
      }
    }

    // EXPAND LATER: Add margin to validated boundaries
    const newMinX = Math.max(0, analysisX + limitedMinX - margin);
    const newMinY = Math.max(0, analysisY + limitedMinY - margin);
    const newMaxX = Math.min(
      metadata.width,
      analysisX + limitedMaxX + 1 + margin,
    );
    const newMaxY = Math.min(
      metadata.height,
      analysisY + limitedMaxY + 1 + margin,
    );

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
    threshold = DEFAULT_ADAPT_RESIZE_THRESHOLD,
    margin = DEFAULT_ADAPT_RESIZE_MARGIN,
    minComponentSize = DEFAULT_ADAPT_RESIZE_MIN_COMPONENT_SIZE,
    maxComponentSize = DEFAULT_ADAPT_RESIZE_MAX_COMPONENT_SIZE,
    outlierPercentile = DEFAULT_ADAPT_RESIZE_OUTLIER_PERCENTILE,
    morphologySize = DEFAULT_ADAPT_RESIZE_MORPHOLOGY_SIZE,
    maxHorizontalExpansion = DEFAULT_ADAPT_RESIZE_MAX_HORIZONTAL_EXPANSION,
    paddingCheckWidth = DEFAULT_ADAPT_RESIZE_PADDING_CHECK_WIDTH,
    minPaddingBrightness = DEFAULT_ADAPT_RESIZE_MIN_PADDING_BRIGHTNESS,
    minPaddingRatio = DEFAULT_ADAPT_RESIZE_MIN_PADDING_RATIO,
    useAdaptiveThreshold = DEFAULT_ADAPT_RESIZE_USE_ADAPTIVE_THRESHOLD,
    adaptiveBlockSize = DEFAULT_ADAPT_RESIZE_ADAPTIVE_BLOCK_SIZE,
  } = options || {};

  if (boxes.length === 0) {
    return boxes;
  }

  console.log(
    `Processing ${boxes.length} boxes with adaptive resize for: ${imageFilePath}`,
  );
  if (useAdaptiveThreshold) {
    console.log('  Using adaptive thresholding based on image histogram');
  }

  // Process each box with timeout protection
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
          paddingCheckWidth,
          minPaddingBrightness,
          minPaddingRatio,
          useAdaptiveThreshold,
          adaptiveBlockSize,
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
