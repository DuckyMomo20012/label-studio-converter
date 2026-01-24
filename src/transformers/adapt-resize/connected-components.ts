/**
 * Connected component analysis using flood fill
 * Identifies contiguous regions of pixels (text regions)
 */

export type ConnectedComponent = {
  pixels: number[];
  size: number;
};

/**
 * Flood fill starting from a seed pixel
 */
function floodFill(
  data: Buffer,
  width: number,
  height: number,
  startX: number,
  startY: number,
  threshold: number,
  visited: Set<number>,
): ConnectedComponent {
  const pixels: number[] = [];
  const queue: Array<{ x: number; y: number }> = [{ x: startX, y: startY }];
  const startIdx = startY * width + startX;
  visited.add(startIdx);

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;

    const { x, y } = current;
    const idx = y * width + x;
    pixels.push(idx);

    // Check 4-connected neighbors
    const neighbors = [
      { x: x + 1, y },
      { x: x - 1, y },
      { x, y: y + 1 },
      { x, y: y - 1 },
    ];

    for (const { x: nx, y: ny } of neighbors) {
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;

      const nIdx = ny * width + nx;
      const pixelValue = data[nIdx];

      if (
        pixelValue !== undefined &&
        pixelValue > threshold &&
        !visited.has(nIdx)
      ) {
        visited.add(nIdx);
        queue.push({ x: nx, y: ny });
      }
    }
  }

  return {
    pixels,
    size: pixels.length,
  };
}

/**
 * Find all connected components in the image
 */
export function findConnectedComponents(
  data: Buffer,
  width: number,
  height: number,
  threshold: number,
): ConnectedComponent[] {
  const components: ConnectedComponent[] = [];
  const visited = new Set<number>();

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;

      if (visited.has(idx)) continue;

      const pixelValue = data[idx];
      if (pixelValue !== undefined && pixelValue > threshold) {
        const component = floodFill(
          data,
          width,
          height,
          x,
          y,
          threshold,
          visited,
        );
        components.push(component);
      }
    }
  }

  return components;
}
