/**
 * Vertical Separator Line Detection for Sino Nom Text
 *
 * Detects vertical separator lines between text columns using adaptive thresholding.
 * Chinese/Sino Nom text is written vertically in columns from right to left,
 * with clear vertical separators between columns.
 */

type SeparatorDetectionOptions = {
  threshold: number;
  minLineLength: number;
  lineDetectionMargin: number;
};

/**
 * Detect vertical separator lines in an image
 *
 * @param imageData - Raw grayscale image data (Uint8Array)
 * @param width - Image width in pixels
 * @param height - Image height in pixels
 * @param options - Detection options
 * @returns Array of x-coordinates where vertical separators are detected
 */
export async function detectVerticalSeparators(
  imageData: Uint8Array,
  width: number,
  height: number,
  options: SeparatorDetectionOptions,
): Promise<number[]> {
  const { threshold, minLineLength, lineDetectionMargin } = options;

  // Apply adaptive thresholding
  const binaryData = applyAdaptiveThreshold(
    imageData,
    width,
    height,
    threshold,
  );

  // Calculate vertical projection (sum of white pixels in each column)
  const verticalProjection = new Array(width).fill(0);
  for (let x = 0; x < width; x++) {
    let columnSum = 0;
    for (let y = 0; y < height; y++) {
      const idx = y * width + x;
      if (binaryData[idx] === 255) {
        columnSum++;
      }
    }
    verticalProjection[x] = columnSum;
  }

  // Find valleys in the projection (potential separator lines)
  const separators: number[] = [];
  const windowSize = Math.max(5, Math.floor(width * 0.01)); // 1% of width or min 5px

  for (let x = windowSize; x < width - windowSize; x++) {
    const windowValues = verticalProjection.slice(
      x - windowSize,
      x + windowSize + 1,
    );
    const currentValue = verticalProjection[x];
    const avgWindow =
      windowValues.reduce((a, b) => a + b, 0) / windowValues.length;

    // Detect valleys (low text density areas = separators)
    // A valley is where current value is significantly lower than surrounding average
    if (
      currentValue < avgWindow * 0.3 && // Much lower than average
      currentValue < height * 0.05 // Less than 5% of height has content
    ) {
      // Check if this is part of a continuous separator region
      const isContinuousSeparator = checkContinuousSeparator(
        binaryData,
        width,
        height,
        x,
        minLineLength,
        lineDetectionMargin,
      );

      if (isContinuousSeparator) {
        // Avoid adding duplicate separators too close to each other
        const tooClose = separators.some(
          (s) => Math.abs(s - x) < windowSize * 2,
        );
        if (!tooClose) {
          separators.push(x);
        }
      }
    }
  }

  console.log(`Detected ${separators.length} vertical separators`);
  return separators;
}

/**
 * Apply adaptive thresholding to create binary image
 * Uses Otsu's method approximation
 */
function applyAdaptiveThreshold(
  imageData: Uint8Array,
  width: number,
  height: number,
  threshold: number,
): Uint8Array {
  const binaryData = new Uint8Array(imageData.length);

  // Simple global thresholding (can be enhanced with local adaptive later)
  for (let i = 0; i < imageData.length; i++) {
    binaryData[i] = (imageData[i] ?? 0) < threshold ? 0 : 255;
  }

  return binaryData;
}

/**
 * Check if a vertical line is a continuous separator
 * A continuous separator has mostly empty pixels along the line
 */
function checkContinuousSeparator(
  binaryData: Uint8Array,
  width: number,
  height: number,
  x: number,
  minLineLength: number,
  margin: number,
): boolean {
  let emptyPixelCount = 0;
  const requiredEmptyPixels = Math.max(minLineLength, Math.floor(height * 0.7)); // At least 70% of height

  // Check pixels along the vertical line with some margin
  for (let y = 0; y < height; y++) {
    // Check a small horizontal range around x to account for slight variations
    let isEmptyInRange = true;
    for (let dx = -margin; dx <= margin; dx++) {
      const checkX = x + dx;
      if (checkX >= 0 && checkX < width) {
        const idx = y * width + checkX;
        if (binaryData[idx] === 255) {
          // Found white pixel (text)
          isEmptyInRange = false;
          break;
        }
      }
    }

    if (isEmptyInRange) {
      emptyPixelCount++;
    }
  }

  return emptyPixelCount >= requiredEmptyPixels;
}
