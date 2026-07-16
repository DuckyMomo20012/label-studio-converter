import type { Transformer } from '@/lib/processor'
import { roundPoints } from '@/lib/geometry'

export type RoundTransformerOptions = {
  precision?: number
}

export const roundTransformer = (async (
  boxes,
  imageFilePath: string,
  options,
) => {
  const { precision } = options

  if (precision === undefined || precision < 0) {
    return boxes
  }

  const rounded = boxes.map((box) => {
    const roundedPoints = roundPoints(box.points, precision)

    return {
      ...box,
      points: roundedPoints,
    }
  })

  return rounded
}) satisfies Transformer<RoundTransformerOptions>
