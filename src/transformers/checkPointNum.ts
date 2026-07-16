import type { Transformer } from '@/lib/processor'
import { logger } from '@/logger/logger'

export type CheckPointNumOptions = {
  numPointCheck?: number
  thresholdAreaCheck?: number
}

function calculatePixelArea(points: [number, number][]): number {
  let area = 0
  const n = points.length

  for (let i = 0; i < n; i++) {
    // @ts-expect-error: TypeScript may not infer the tuple type correctly here
    const [x1, y1] = points[i]
    const [x2, y2] = points[(i + 1) % n] // Wraps around to the first point at the end
    area += x1 * y2 - x2 * y1
  }

  return Math.abs(area) / 2
}

export const checkPointNum = (async (boxes, imageFilePath: string, options) => {
  const { numPointCheck, thresholdAreaCheck } = options

  boxes.forEach((box, index) => {
    if (numPointCheck !== undefined && box.points.length !== numPointCheck) {
      logger.warn(
        `Box ${index + 1} in image: ${imageFilePath} has ${box.points.length} points, expected ${numPointCheck}`,
      )
    }
    if (thresholdAreaCheck !== undefined) {
      const area = calculatePixelArea(
        box.points.map(point => [point.x, point.y]),
      )

      if (area < thresholdAreaCheck) {
        logger.warn(
          `Box ${index + 1} in image: ${imageFilePath} has area ${area}, below threshold ${thresholdAreaCheck}`,
        )
      }
    }
  })

  return boxes
}) satisfies Transformer<CheckPointNumOptions>
