/**
 * Vertical separator detection for column boundaries
 * Detects white vertical lines that separate text columns
 */

type SeparatorDetectorConfig = {
  data: Buffer;
  width: number;
  height: number;
  threshold: number;
  whiteRatio?: number; // Default 0.8 (80% white)
  sampleSize?: number; // Default 20 pixels
  earlyExitSamples?: number; // Default 5 pixels before early exit
  earlyExitThreshold?: number; // Default 0.5 (50% white)
};

/**
 * Create a separator detector function with the given configuration
 */
export function createSeparatorDetector(
  config: SeparatorDetectorConfig,
): (colX: number) => boolean {
  const {
    data,
    width,
    height,
    threshold,
    whiteRatio = 0.8,
    sampleSize = 20,
    earlyExitSamples = 5,
    earlyExitThreshold = 0.5,
  } = config;

  return (colX: number): boolean => {
    if (colX < 0 || colX >= width) return false;

    let whiteCount = 0;
    const maxSamples = Math.min(height, sampleSize);

    for (let py = 0; py < maxSamples; py++) {
      const idx = py * width + colX;
      if (
        idx < data.length &&
        data[idx] !== undefined &&
        data[idx] > threshold
      ) {
        whiteCount++;
      }

      // Early exit: if we've seen enough non-white pixels, it's not a separator
      if (py >= earlyExitSamples - 1) {
        const currentRatio = whiteCount / (py + 1);
        if (currentRatio < earlyExitThreshold) {
          return false;
        }
      }
    }

    // Check final ratio against white threshold
    return whiteCount / maxSamples > whiteRatio;
  };
}

/**
 * Scan for separator boundaries from a starting position
 */
export function findSeparatorBoundaries(
  minX: number,
  maxX: number,
  originalBoxMinX: number,
  originalBoxMaxX: number,
  maxExpansion: number,
  detectSeparator: (x: number) => boolean,
  roiWidth: number,
): { left: number; right: number } {
  const maxScanDistance = Math.min(maxExpansion, 100);

  // Scan left from minX
  let left = minX;
  for (
    let scanX = minX - 1;
    scanX >= Math.max(0, originalBoxMinX - maxScanDistance);
    scanX--
  ) {
    if (detectSeparator(scanX)) {
      left = scanX + 1; // Stop at separator
      break;
    }
  }

  // Scan right from maxX
  let right = maxX;
  for (
    let scanX = maxX + 1;
    scanX <= Math.min(roiWidth - 1, originalBoxMaxX + maxScanDistance);
    scanX++
  ) {
    if (detectSeparator(scanX)) {
      right = scanX - 1; // Stop at separator
      break;
    }
  }

  return { left, right };
}
