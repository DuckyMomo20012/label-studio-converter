import type { BaseCheckOptions, BaseEnhanceOptions } from '@/config'
import type { HorizontalSortOrder, LabelStudioTask, LabelStudioTaskMin, ShapeNormalizeOption, VerticalSortOrder } from '@/lib'
import { createWriteStream } from 'node:fs'
import { get } from 'node:https'
import { basename, dirname, join } from 'node:path'
import {
  adaptResizeTransformer,
  checkPointNum,
  FullOCRLabelStudioInput,
  MinOCRLabelStudioInput,
  normalizeTransformer,
  PPOCROutput,
  Processor,
  resizeTransformer,
  roundTransformer,
  sortTransformer,
  withOptions,
} from '@/lib'

export type LabelStudioToPPOCRConverterOptions = BaseEnhanceOptions
  & BaseCheckOptions & {
    baseImageDir?: string
    imageBaseDir?: string
  }

export async function fullLabelStudioToPPOCRConverters(inputTasks: LabelStudioTask[], taskFilePath: string, outputDir: string, options: LabelStudioToPPOCRConverterOptions) {
  const {
    baseImageDir,
    imageBaseDir: _imageBaseDir,
    sortVertical,
    sortHorizontal,
    normalizeShape,
    useOrientedBox,
    widthIncrement,
    heightIncrement,
    adaptResize,
    adaptResizeThreshold,
    adaptResizeMargin,
    adaptResizeMinComponentSize,
    adaptResizeMaxComponentSize,
    adaptResizeOutlierPercentile,
    adaptResizeMorphologySize,
    adaptResizeMaxHorizontalExpansion,
    precision,
    numPointCheck,
    thresholdAreaCheck,
    noAnnoCheck,
  } = options

  const transformerParams = [
    withOptions(normalizeTransformer, {
      normalizeShape: normalizeShape as ShapeNormalizeOption,
      useOrientedBox,
    }),
    withOptions(resizeTransformer, {
      widthIncrement,
      heightIncrement,
    }),
    ...(adaptResize
      ? [
          withOptions(adaptResizeTransformer, {
            threshold: adaptResizeThreshold,
            margin: adaptResizeMargin,
            minComponentSize: adaptResizeMinComponentSize,
            maxComponentSize: adaptResizeMaxComponentSize,
            outlierPercentile: adaptResizeOutlierPercentile,
            morphologySize: adaptResizeMorphologySize,
            maxHorizontalExpansion: adaptResizeMaxHorizontalExpansion,
          }),
        ]
      : []),
    withOptions(roundTransformer, {
      precision,
    }),
    withOptions(sortTransformer, {
      horizontalSort: sortHorizontal as HorizontalSortOrder,
      verticalSort: sortVertical as VerticalSortOrder,
    }),
    withOptions(checkPointNum, { numPointCheck, thresholdAreaCheck, noAnnoCheck }),
  ]

  const resolveInputImagePath = async (
    taskImagePath: string,
    taskFilePath: string,
  ) => {
    // Check if it's a remote URL
    if (
      taskImagePath.startsWith('http://')
      || taskImagePath.startsWith('https://')
    ) {
      // Extract just the filename from URL (ignore URL path structure)
      const urlPath = new URL(taskImagePath).pathname
      const filename = basename(urlPath)
      // Download to task file location (where the JSON is)
      const fileDir = dirname(taskFilePath)
      const localPath = join(fileDir, filename)

      // Download the image
      await new Promise<void>((resolve, reject) => {
        get(taskImagePath, (response) => {
          const fileStream = createWriteStream(localPath)
          response.pipe(fileStream)
          fileStream.on('finish', () => {
            fileStream.close()
            resolve()
          })
          fileStream.on('error', reject)
        }).on('error', reject)
      })

      return localPath
    }

    // Label Studio exports can have leading slash (/path)
    // Strip leading slashes to get relative path
    const fileDir = dirname(taskFilePath)
    const normalizedImagePath = taskImagePath.replace(/^\/+/, '')
    const resolvedImagePath = join(fileDir, normalizedImagePath)
    return resolvedImagePath
  }

  const resolveOutputImagePath = (resolvedImagePath: string) => {
    // resolvedImagePath is the absolute path to the actual image file
    // Extract just the filename for PPOCR format
    const filename = basename(resolvedImagePath)

    // Construct output path for PPOCR Label.txt
    if (baseImageDir !== undefined) {
      // Use specified baseImageDir prefix (like "images/ch")
      return join(baseImageDir, filename)
    }
    else {
      // Use output folder name (PPOCRLabel expects "folder/filename.jpg" format)
      const outputFolderName = basename(outputDir)
      return join(outputFolderName, filename)
    }
  }

  const processor = new Processor({
    input: FullOCRLabelStudioInput,
    output: PPOCROutput,
    transformers: transformerParams,
  })

  return Promise.all(
    inputTasks.map(async (task) => {
      const outputData = await processor.process({
        inputData: task,
        taskFilePath,
        resolveInputImagePath,
        resolveOutputImagePath,
      })
      return outputData
    }),
  )
}

export async function minLabelStudioToPPOCRConverters(inputTasks: LabelStudioTaskMin[], taskFilePath: string, outputDir: string, options: LabelStudioToPPOCRConverterOptions) {
  const {
    baseImageDir,
    imageBaseDir: _imageBaseDir,
    sortVertical,
    sortHorizontal,
    normalizeShape,
    useOrientedBox,
    widthIncrement,
    heightIncrement,
    adaptResize,
    adaptResizeThreshold,
    adaptResizeMargin,
    adaptResizeMinComponentSize,
    adaptResizeMaxComponentSize,
    adaptResizeOutlierPercentile,
    adaptResizeMorphologySize,
    adaptResizeMaxHorizontalExpansion,
    precision,
    numPointCheck,
    thresholdAreaCheck,
    noAnnoCheck,
  } = options

  const transformerParams = [
    withOptions(normalizeTransformer, {
      normalizeShape: normalizeShape as ShapeNormalizeOption,
      useOrientedBox,
    }),
    withOptions(resizeTransformer, {
      widthIncrement,
      heightIncrement,
    }),
    ...(adaptResize
      ? [
          withOptions(adaptResizeTransformer, {
            threshold: adaptResizeThreshold,
            margin: adaptResizeMargin,
            minComponentSize: adaptResizeMinComponentSize,
            maxComponentSize: adaptResizeMaxComponentSize,
            outlierPercentile: adaptResizeOutlierPercentile,
            morphologySize: adaptResizeMorphologySize,
            maxHorizontalExpansion: adaptResizeMaxHorizontalExpansion,
          }),
        ]
      : []),
    withOptions(roundTransformer, {
      precision,
    }),
    withOptions(sortTransformer, {
      horizontalSort: sortHorizontal as HorizontalSortOrder,
      verticalSort: sortVertical as VerticalSortOrder,
    }),
    withOptions(checkPointNum, { numPointCheck, thresholdAreaCheck, noAnnoCheck }),
  ]

  const resolveInputImagePath = async (
    taskImagePath: string,
    taskFilePath: string,
  ) => {
    // Check if it's a remote URL
    if (
      taskImagePath.startsWith('http://')
      || taskImagePath.startsWith('https://')
    ) {
      // Extract just the filename from URL (ignore URL path structure)
      const urlPath = new URL(taskImagePath).pathname
      const filename = basename(urlPath)
      // Download to task file location (where the JSON is)
      const fileDir = dirname(taskFilePath)
      const localPath = join(fileDir, filename)

      // Download the image
      await new Promise<void>((resolve, reject) => {
        get(taskImagePath, (response) => {
          const fileStream = createWriteStream(localPath)
          response.pipe(fileStream)
          fileStream.on('finish', () => {
            fileStream.close()
            resolve()
          })
          fileStream.on('error', reject)
        }).on('error', reject)
      })

      return localPath
    }

    // Label Studio exports can have leading slash (/path)
    // Strip leading slashes to get relative path
    const fileDir = dirname(taskFilePath)
    const normalizedImagePath = taskImagePath.replace(/^\/+/, '')
    const resolvedImagePath = join(fileDir, normalizedImagePath)
    return resolvedImagePath
  }

  const resolveOutputImagePath = (resolvedImagePath: string) => {
    // resolvedImagePath is the absolute path to the actual image file
    // Extract just the filename for PPOCR format
    const filename = basename(resolvedImagePath)

    // Construct output path for PPOCR Label.txt
    if (baseImageDir !== undefined) {
      // Use specified baseImageDir prefix (like "images/ch")
      return join(baseImageDir, filename)
    }
    else {
      // Use output folder name (PPOCRLabel expects "folder/filename.jpg" format)
      const outputFolderName = basename(outputDir)
      return join(outputFolderName, filename)
    }
  }

  const processor = new Processor({
    input: MinOCRLabelStudioInput,
    output: PPOCROutput,
    transformers: transformerParams,
  })

  return Promise.all(
    inputTasks.map(async (task) => {
      const outputData = await processor.process({
        inputData: task,
        taskFilePath,
        resolveInputImagePath,
        resolveOutputImagePath,
      })
      return outputData
    }),
  )
}
