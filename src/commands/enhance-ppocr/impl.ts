import type { LocalContext } from '@/context'
import type { BaseCheckOptions, BaseEnhanceOptions, PPOCRLabelTask } from '@/lib'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { basename, dirname, join, relative } from 'node:path'
import process from 'node:process'
import chalk from 'chalk'
import {
  DEFAULT_ADAPT_RESIZE,
  DEFAULT_ADAPT_RESIZE_MARGIN,
  DEFAULT_ADAPT_RESIZE_MAX_COMPONENT_SIZE,
  DEFAULT_ADAPT_RESIZE_MAX_HORIZONTAL_EXPANSION,
  DEFAULT_ADAPT_RESIZE_MIN_COMPONENT_SIZE,
  DEFAULT_ADAPT_RESIZE_MORPHOLOGY_SIZE,
  DEFAULT_ADAPT_RESIZE_OUTLIER_PERCENTILE,
  DEFAULT_ADAPT_RESIZE_THRESHOLD,
  DEFAULT_BACKUP,
  DEFAULT_HEIGHT_INCREMENT,
  DEFAULT_IMAGE_BASE_DIR,
  DEFAULT_PPOCR_FILE_PATTERN,
  DEFAULT_PPOCR_PRECISION,
  DEFAULT_RECURSIVE,
  DEFAULT_SHAPE_NORMALIZE,
  DEFAULT_SORT_HORIZONTAL,
  DEFAULT_SORT_VERTICAL,
  DEFAULT_WIDTH_INCREMENT,
} from '@/constants'
import {
  enhancePPOCRConverters,
  PPOCRLabelSchema,
} from '@/lib'
import { backupFileIfExists } from '@/lib/backup-utils'
import { findFiles } from '@/lib/file-utils'
import { logger } from '@/logger/logger'

type CommandFlags = BaseEnhanceOptions
  & BaseCheckOptions & {
    outDir?: string
    fileName?: string
    backup?: boolean
    recursive?: boolean
    filePattern?: string
    imageBaseDir?: string
  }

export async function enhancePPOCR(
  this: LocalContext,
  flags: CommandFlags,
  ...inputDirs: string[]
): Promise<void> {
  const {
    outDir,
    fileName,
    backup = DEFAULT_BACKUP,
    imageBaseDir = DEFAULT_IMAGE_BASE_DIR,
    sortVertical = DEFAULT_SORT_VERTICAL,
    sortHorizontal = DEFAULT_SORT_HORIZONTAL,
    normalizeShape = DEFAULT_SHAPE_NORMALIZE,
    widthIncrement = DEFAULT_WIDTH_INCREMENT,
    heightIncrement = DEFAULT_HEIGHT_INCREMENT,
    adaptResize = DEFAULT_ADAPT_RESIZE,
    adaptResizeThreshold = DEFAULT_ADAPT_RESIZE_THRESHOLD,
    adaptResizeMargin = DEFAULT_ADAPT_RESIZE_MARGIN,
    adaptResizeMinComponentSize = DEFAULT_ADAPT_RESIZE_MIN_COMPONENT_SIZE,
    adaptResizeMaxComponentSize = DEFAULT_ADAPT_RESIZE_MAX_COMPONENT_SIZE,
    adaptResizeOutlierPercentile = DEFAULT_ADAPT_RESIZE_OUTLIER_PERCENTILE,
    adaptResizeMorphologySize = DEFAULT_ADAPT_RESIZE_MORPHOLOGY_SIZE,
    adaptResizeMaxHorizontalExpansion = DEFAULT_ADAPT_RESIZE_MAX_HORIZONTAL_EXPANSION,
    precision = DEFAULT_PPOCR_PRECISION,
    recursive = DEFAULT_RECURSIVE,
    filePattern = DEFAULT_PPOCR_FILE_PATTERN,
    numPointCheck,
    thresholdAreaCheck,
    noAnnoCheck,
  } = flags

  // Find all files matching the pattern
  logger.info(`Finding files matching pattern: ${filePattern} in directories: ${inputDirs.join(', ')} (recursive: ${recursive})`)
  const filePaths = await findFiles(inputDirs, filePattern, recursive)

  if (filePaths.length === 0) {
    logger.warn('No files found matching the pattern.')
    return
  }

  logger.info(`Found ${filePaths.length} files to process`)

  for (const filePath of filePaths) {
    const file = basename(filePath)
    logger.info(`Processing file: \"${filePath}\"`)

    try {
      const fileData = await readFile(filePath, 'utf-8')
      const lines = fileData.trim().split('\n')

      // Parse PPOCRLabelV2 format: <filename>\t<json_array_of_annotations>
      const inputTasks: PPOCRLabelTask[] = []

      for (const line of lines) {
        const parts = line.split('\t')

        if (parts.length !== 2) {
          logger.warn(`Skipping invalid PPOCRLabelV2 format in line: ${line}`)
          continue
        }

        const [imagePath, annotationsStr] = parts

        if (imagePath === undefined || annotationsStr === undefined) {
          logger.warn(
            `Skipping line with missing imagePath or annotations: ${line}`,
          )
          continue
        }

        try {
          // Validate annotations
          const inputTask = PPOCRLabelSchema.parse(JSON.parse(annotationsStr))

          inputTasks.push({ imagePath, data: inputTask })
        }
        catch (error) {
          logger.warn(
            `Skipping line due to parse/validation error: ${line}`,
            error,
          )
          continue
        }
      }

      // If no valid lines were found, skip this file
      if (inputTasks.length === 0) {
        logger.warn(`Skipping file with no valid data: \"${filePath}\"`)
        continue
      }

      const enhanceParams = {
        sortVertical,
        sortHorizontal,
        normalizeShape,
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
        imageBaseDir,
      }

      const checkParams = {
        numPointCheck,
        thresholdAreaCheck,
        noAnnoCheck,
      }

      const outputTasks = await enhancePPOCRConverters(inputTasks, filePath, {
        ...enhanceParams,
        ...checkParams,
      })

      const outputLines: string[] = []

      for (const task of outputTasks) {
        PPOCRLabelSchema.parse(task.data)

        // Format as: image_path<tab>[{annotations}]
        const jsonArray = JSON.stringify(task.data)
        outputLines.push(`${task.imagePath}\t${jsonArray}`)
      }

      // Write enhanced data
      // Use outDir if specified, otherwise use source file directory
      const outputSubDir = outDir !== undefined
        ? (() => {
            const relativePath = relative(process.cwd(), filePath)
            const relativeDir = dirname(relativePath)
            return join(outDir, relativeDir)
          })()
        : dirname(filePath)
      await mkdir(outputSubDir, { recursive: true })

      const outputFileName = fileName ?? file
      const outputFilePath = join(outputSubDir, outputFileName)

      // Backup existing file if requested
      if (backup) {
        const backupPath = await backupFileIfExists(outputFilePath)
        if (backupPath !== null) {
          logger.info((`Backed up to: \"${backupPath}\"`))
        }
      }

      await writeFile(outputFilePath, outputLines.join('\n'), 'utf-8')
      logger.info(`Enhanced file saved: \"${outputFilePath}\"`)
    }
    catch (error) {
      console.error(
        chalk.red(`Error processing file \"${file}\":`),
        error instanceof Error ? error.message : String(error),
      )
    }
  }

  logger.info('Enhancement complete!')
}
