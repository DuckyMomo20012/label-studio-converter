import { existsSync } from 'node:fs';
import sharp from 'sharp';
import { detectVerticalSeparators } from './separator-detector';
import {
  DEFAULT_SINO_NOM_BOX_PADDING,
  DEFAULT_SINO_NOM_LINE_DETECTION_MARGIN,
  DEFAULT_SINO_NOM_MIN_LINE_LENGTH,
  DEFAULT_SINO_NOM_THRESHOLD,
  DEFAULT_SINO_NOM_TIMEOUT_MS,
} from '@/constants';
import { type Transformer } from '@/lib/processor';
import { type UnifiedPoint } from '@/lib/unified';

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

export type SinoNomAdjustOptions = {
  threshold?: number;
  minLineLength?: number;
  lineDetectionMargin?: number;
  boxPadding?: number;
  timeoutMs?: number;
};

/**
 * Sino Nom Box Adjustment Transformer
 *
 * Adjusts tight bounding boxes for Chinese/Sino Nom text by detecting
 * vertical separator lines and expanding boxes to align with them.
 *
 * The transformer:
 * 1. Uses adaptive thresholding to detect text and separators
 * 2. Finds vertical separator lines between text columns
 * 3. Adjusts box boundaries to align with nearest separators
 * 4. Processes boxes from top to bottom, left to right
 *
 * @param boxes - Array of bounding boxes to adjust
 * @param imageFilePath - Path to the image file
 * @param options - Configuration options
 * @returns Adjusted bounding boxes
 */
export const sinoNomAdjustTransformer: Transformer<
  SinoNomAdjustOptions
> = async (boxes, imageFilePath, options = {}) => {
  const {
    threshold = DEFAULT_SINO_NOM_THRESHOLD,
    minLineLength = DEFAULT_SINO_NOM_MIN_LINE_LENGTH,
    lineDetectionMargin = DEFAULT_SINO_NOM_LINE_DETECTION_MARGIN,
    boxPadding = DEFAULT_SINO_NOM_BOX_PADDING,
    timeoutMs = DEFAULT_SINO_NOM_TIMEOUT_MS,
  } = options;

  // Skip if no boxes or image doesn't exist
  if (boxes.length === 0 || !existsSync(imageFilePath)) {
    return boxes;
  }

  console.log(
    `Processing ${boxes.length} boxes with Sino Nom adjustment for: ${imageFilePath}`,
  );

  try {
    // Load image and get metadata
    const image = sharp(imageFilePath);
    const metadata = await image.metadata();
    const { width: imgWidth, height: imgHeight } = metadata;

    if (!imgWidth || !imgHeight) {
      console.warn(`Could not read image dimensions: ${imageFilePath}`);
      return boxes;
    }

    // Get image buffer for processing
    const imageBuffer = await image
      .greyscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Detect vertical separator lines
    const separators = await detectVerticalSeparators(
      imageBuffer.data,
      imgWidth,
      imgHeight,
      { threshold, minLineLength, lineDetectionMargin },
    );

    // Sort boxes from top to bottom, left to right
    const sortedBoxes = [...boxes].sort((a, b) => {
      const centerA = a.points.reduce(
        (sum, p) => ({ x: sum.x + p.x, y: sum.y + p.y }),
        { x: 0, y: 0 },
      );
      centerA.x /= a.points.length;
      centerA.y /= a.points.length;

      const centerB = b.points.reduce(
        (sum, p) => ({ x: sum.x + p.x, y: sum.y + p.y }),
        { x: 0, y: 0 },
      );
      centerB.x /= b.points.length;
      centerB.y /= b.points.length;

      // Sort by column (x) first, then by row (y)
      if (Math.abs(centerA.x - centerB.x) > imgWidth * 0.1) {
        return centerA.x - centerB.x;
      }
      return centerA.y - centerB.y;
    });

    // Adjust each box based on nearest separators
    const adjustedBoxes = await Promise.all(
      sortedBoxes.map(async (box, index) => {
        try {
          const adjustedBox = await withTimeout(
            adjustBoxToSeparators(
              box,
              separators,
              imgWidth,
              imgHeight,
              boxPadding,
            ),
            timeoutMs,
            box, // Return original box on timeout
          );

          return adjustedBox;
        } catch (error) {
          console.warn(
            `Box ${index + 1} adjustment failed, using original points:`,
            error,
          );
          return box;
        }
      }),
    );

    console.log(`✓ Completed Sino Nom adjustment for ${boxes.length} boxes`);

    return adjustedBoxes;
  } catch (error) {
    console.error(
      `Failed to process Sino Nom adjustment for ${imageFilePath}:`,
      error,
    );
    return boxes;
  }
};

/**
 * Adjust a single box to align with nearest separator lines
 */
async function adjustBoxToSeparators(
  box: { points: UnifiedPoint[]; text?: string; score?: number; id?: string },
  separators: number[],
  imgWidth: number,
  imgHeight: number,
  padding: number,
): Promise<{
  points: UnifiedPoint[];
  text?: string;
  score?: number;
  id?: string;
}> {
  // Find bounding box of current points
  const xs = box.points.map((p) => p.x);
  const ys = box.points.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const centerX = (minX + maxX) / 2;

  // Find nearest separator lines on left and right
  const leftSeparators = separators.filter((s) => s < centerX);
  const rightSeparators = separators.filter((s) => s > centerX);

  let newMinX = minX;
  let newMaxX = maxX;

  // Expand to nearest left separator (or add padding)
  if (leftSeparators.length > 0) {
    const nearestLeft = Math.max(...leftSeparators);
    newMinX = Math.max(0, nearestLeft + padding);
  } else {
    newMinX = Math.max(0, minX - padding);
  }

  // Expand to nearest right separator (or add padding)
  if (rightSeparators.length > 0) {
    const nearestRight = Math.min(...rightSeparators);
    newMaxX = Math.min(imgWidth, nearestRight - padding);
  } else {
    newMaxX = Math.min(imgWidth, maxX + padding);
  }

  // Create adjusted rectangular box
  const adjustedPoints: UnifiedPoint[] = [
    { x: newMinX, y: minY },
    { x: newMaxX, y: minY },
    { x: newMaxX, y: maxY },
    { x: newMinX, y: maxY },
  ];

  return {
    ...box,
    points: adjustedPoints,
  };
}
