import type { LocalContext } from '@/context'
import type { BaseCheckOptions, PPOCRLabelTask } from '@/lib'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { basename, dirname, join, resolve } from 'node:path'
import { groupBy } from 'es-toolkit'
import {
  DEFAULT_BACKUP,
  DEFAULT_GENERATE_FILE_STATE,
  DEFAULT_LABEL_STUDIO_OUTPUT_IMAGE_BASE_DIR,
  DEFAULT_PPOCR_FILE_NAME,
  DEFAULT_RECURSIVE,
} from '@/constants'
import {
  OutputLabelStudioSchema,
  outputLabelStudioToPPOCRConverters,
  PPOCRLabelSchema,
} from '@/lib'
import { backupFileIfExists } from '@/lib/backup-utils'
import { findFiles } from '@/lib/file-utils'
import { logger } from '@/logger/logger'

type CommandFlags = BaseCheckOptions & {
  outDir: string
  fileName?: string
  backup?: boolean
  recursive?: boolean
  filePattern?: string
  removeBaseImageDir?: string
  generateFileState?: boolean
}

export async function labelStudioOutputToPPOCR(
  this: LocalContext,
  flags: CommandFlags,
  ...inputDirs: string[]
): Promise<void> {
  const {
    outDir,
    fileName = DEFAULT_PPOCR_FILE_NAME,
    backup = DEFAULT_BACKUP,
    recursive = DEFAULT_RECURSIVE,
    filePattern = undefined,
    removeBaseImageDir = DEFAULT_LABEL_STUDIO_OUTPUT_IMAGE_BASE_DIR,
    generateFileState = DEFAULT_GENERATE_FILE_STATE,
    numPointCheck,
    thresholdAreaCheck,
    noAnnoCheck,
  } = flags

  // Find all files matching the pattern
  logger.info(`Finding files matching pattern: ${filePattern} in directories: ${inputDirs.join(', ')} (recursive: ${recursive})`)
  // NOTE: Label Studio output files have no file extension, like: "1", "2", etc. So we cannot filter by extension
  const filePaths = await findFiles(inputDirs, filePattern, recursive)

  if (filePaths.length === 0) {
    logger.warn('No files found matching the pattern.')
    return
  }

  logger.info(`Found ${filePaths.length} files to process`)

  let masterOutputTasks: PPOCRLabelTask[] = []

  for (const filePath of filePaths) {
    logger.info(`Processing file: \"${filePath}\"`)

    const fileData = await readFile(filePath, 'utf-8')
    const labelStudioData = OutputLabelStudioSchema.parse(JSON.parse(fileData))

    const checkParams = {
      numPointCheck,
      thresholdAreaCheck,
      noAnnoCheck,
    }

    const [outputTask] = await outputLabelStudioToPPOCRConverters(
      [labelStudioData],
      filePath,
      {
        ...checkParams,
      },
    )

    masterOutputTasks = masterOutputTasks.concat([
      {
        ...outputTask!,
        imagePath: outputTask!.imagePath.replace(removeBaseImageDir, ''),
      },
    ])
  }

  const groupTaskByImagePath = groupBy(masterOutputTasks, task =>
    dirname(task.imagePath))

  for (const [baseOutputImageDir, tasks] of Object.entries(
    groupTaskByImagePath,
  )) {
    // NOTE: PPOCR image path is only the folder + filename (no absolute paths),
    // like "ch/1.jpg", when 1.jpg is located in "outDir/ch/1.jpg". So we need to resolve the actual image path to copy the image later if needed, but use the relative path for the output txt file
    const subImageDir = baseOutputImageDir.split('/').slice(-1)[0]! // Get the last folder name as subImageDir

    const outputImageDir = resolve(outDir, baseOutputImageDir)

    // Ensure output directory exists
    await mkdir(outputImageDir, { recursive: true })

    // Write to output file
    const outputPath = join(outputImageDir, `${fileName}`)

    // Format output as PPOCR label format: image_path<tab>[{JSON array}]
    const outputLines: string[] = []

    for (const task of tasks) {
      const imagePath = removeBaseImageDir
        ? task.imagePath.replace(removeBaseImageDir, '')
        : task.imagePath
      const imageFileName = basename(imagePath)

      PPOCRLabelSchema.parse(task.data)

      // Format as: image_path<tab>[{annotations}]
      const jsonArray = JSON.stringify(task.data)
      outputLines.push(`${subImageDir}\/${imageFileName}\t${jsonArray}`)

      logger.info(
        `Saved image group: \"${imagePath}\" to \"${outputPath}\"`,
      )
    }

    // Backup existing file if requested
    if (backup) {
      const backupPath = await backupFileIfExists(outputPath)
      if (backupPath !== null) {
        logger.info(`Backed up to: \"${backupPath}\"`)
      }
    }

    await writeFile(outputPath, outputLines.join('\n'), 'utf-8')

    if (generateFileState) {
      const fileStateLines: string[] = []

      for (const task of tasks) {
        fileStateLines.push(`${task.imagePath}\t1`)
      }

      const fileStatePath = join(outputImageDir, `fileState.txt`)

      await writeFile(fileStatePath, fileStateLines.join('\n'), 'utf-8')

      logger.info(`Generated file state: \"${fileStatePath}\"`)
    }
  }

  logger.info('Conversion completed!')
}
