/**
 * Morphological image processing operations
 * Used for connecting character strokes and cleaning noise
 */

/**
 * Dilation operation - expand white pixels
 */
export function dilate(
  data: Buffer,
  width: number,
  height: number,
  kernelSize: number,
): Buffer {
  const result = Buffer.alloc(data.length);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      let maxVal = data[idx] || 0;

      // Check neighborhood
      for (let ky = -kernelSize; ky <= kernelSize; ky++) {
        for (let kx = -kernelSize; kx <= kernelSize; kx++) {
          const ny = y + ky;
          const nx = x + kx;
          if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
            const nIdx = ny * width + nx;
            const neighborValue = data[nIdx] || 0;
            if (neighborValue > maxVal) {
              maxVal = neighborValue;
            }
          }
        }
      }
      result[idx] = maxVal;
    }
  }

  return result;
}

/**
 * Erosion operation - shrink white pixels
 */
export function erode(
  data: Buffer,
  width: number,
  height: number,
  kernelSize: number,
): Buffer {
  const result = Buffer.alloc(data.length);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      let minVal = data[idx] || 255;

      // Check neighborhood
      for (let ky = -kernelSize; ky <= kernelSize; ky++) {
        for (let kx = -kernelSize; kx <= kernelSize; kx++) {
          const ny = y + ky;
          const nx = x + kx;
          if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
            const nIdx = ny * width + nx;
            const neighborValue = data[nIdx] || 255;
            if (neighborValue < minVal) {
              minVal = neighborValue;
            }
          }
        }
      }
      result[idx] = minVal;
    }
  }

  return result;
}

/**
 * Morphological closing: dilation followed by erosion
 * Connects nearby character strokes and removes small holes
 */
export function morphologicalClosing(
  data: Buffer,
  width: number,
  height: number,
  kernelSize: number,
): Buffer {
  const dilated = dilate(data, width, height, kernelSize);
  const eroded = erode(dilated, width, height, kernelSize);
  return eroded;
}
