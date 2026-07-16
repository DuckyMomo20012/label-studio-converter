import type { UnionToIntersection } from 'type-fest'
import type { ProcessorInput } from '@/lib/processor'
import type { UnifiedPoint } from '@/lib/unified'
import type { LabelStudioTask, PolygonResult, RectangleResult } from '@/modules/label-studio-full/schema'
import { groupBy } from 'es-toolkit'
import { DEFAULT_DETECT_IMAGE_SIZE } from '@/constants'
import { polyToPoints, rectangleToPoints } from '@/lib/geometry'
import { getImageDimensions } from '@/lib/image'
import { logger } from '@/logger/logger'

export type FullOCRLabelStudioInputOptions = {
  autoDetectImageSize?: boolean
}

export const FullOCRLabelStudioInput = (async (
  inputTask,
  resolveImagePath,
  options?: FullOCRLabelStudioInputOptions,
) => {
  const { autoDetectImageSize = DEFAULT_DETECT_IMAGE_SIZE } = options || {}

  const imageFilePath = await resolveImagePath(inputTask.data.ocr)

  const { id, annotations, predictions, ...metadata } = inputTask

  const annoData
    = annotations.length > 0
      ? annotations[0]?.result
      : predictions.length > 0
        ? predictions[0]?.result
        : []

  const imageMeta = annoData?.find(
    item =>
      item.original_height !== undefined && item.original_width !== undefined,
  )

  let { original_height: imgHeight, original_width: imgWidth }
    = imageMeta ?? {}

  if (autoDetectImageSize && (imgHeight === undefined || imgWidth === undefined)) {
    const dimensions = await getImageDimensions(imageFilePath)
    if (dimensions) {
      imgHeight = dimensions.height
      imgWidth = dimensions.width
    }
    else {
      logger.warn(
        `Failed to auto-detect image size for ${imageFilePath}, using existing or 0x0`,
      )
    }
  }

  // NOTE: By default, one bounding box per annotation will have 3 annotations
  // data: base, label, text
  const groupByAnnoId = groupBy(annoData || [], item => item.id)

  return {
    id: id.toString(),
    height: imgHeight!,
    width: imgWidth!,
    imagePath: imageFilePath,
    metadata,
    boxes: Object.entries(groupByAnnoId).map(([annoId, items]) => {
      // Merge multiple annotation items into one box
      let baseAnno = {} as UnionToIntersection<RectangleResult | PolygonResult>

      for (const item of items) {
        baseAnno = { ...baseAnno, ...item.value }
      }

      let newPoints = [] as UnifiedPoint[]

      if ('points' in baseAnno) {
        newPoints = polyToPoints(baseAnno.points, imgWidth, imgHeight)
      }

      if (
        'x' in baseAnno
        && 'y' in baseAnno
        && 'width' in baseAnno
        && 'height' in baseAnno
      ) {
        // Convert rectangle to 4 corner points
        newPoints = rectangleToPoints(
          baseAnno.x,
          baseAnno.y,
          baseAnno.width,
          baseAnno.height,
          imgWidth,
          imgHeight,
        )
      }

      return {
        id: annoId,
        points: newPoints,
        metadata: baseAnno,
        score: imageMeta?.score,
        text:
          'text' in baseAnno
            ? Array.isArray(baseAnno.text)
              ? baseAnno.text.join(' ')
              : baseAnno.text
            : undefined,
      }
    }),
  }
}) satisfies ProcessorInput<LabelStudioTask, FullOCRLabelStudioInputOptions>
