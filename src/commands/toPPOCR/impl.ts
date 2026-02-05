import { copyFile, mkdir, readFile, writeFile } from 'fs/promises';
import { basename, dirname, join, relative, resolve } from 'path';
import chalk from 'chalk';
import {
  DEFAULT_ADAPT_RESIZE_MARGIN,
  DEFAULT_ADAPT_RESIZE_MAX_COMPONENT_SIZE,
  DEFAULT_ADAPT_RESIZE_MAX_HORIZONTAL_EXPANSION,
  DEFAULT_ADAPT_RESIZE_MIN_COMPONENT_SIZE,
  DEFAULT_ADAPT_RESIZE_MORPHOLOGY_SIZE,
  DEFAULT_ADAPT_RESIZE_OUTLIER_PERCENTILE,
  DEFAULT_ADAPT_RESIZE_THRESHOLD,
  DEFAULT_BACKUP,
  DEFAULT_COPY_IMAGES,
  DEFAULT_HEIGHT_INCREMENT,
  DEFAULT_IMAGE_BASE_DIR,
  DEFAULT_LABEL_STUDIO_FILE_PATTERN,
  DEFAULT_PPOCR_FILE_NAME,
  DEFAULT_PPOCR_PRECISION,
  DEFAULT_RECURSIVE,
  DEFAULT_SHAPE_NORMALIZE,
  DEFAULT_SORT_HORIZONTAL,
  DEFAULT_SORT_VERTICAL,
  DEFAULT_WIDTH_INCREMENT,
  IMAGE_BASE_DIR_INPUT_DIR,
} from '@/constants';
import type { LocalContext } from '@/context';
import {
  type BaseEnhanceOptions,
  PPOCRLabelSchema,
  type PPOCRLabelTask,
  fullLabelStudioToPPOCRConverters,
  minLabelStudioToPPOCRConverters,
} from '@/lib';
import { backupFileIfExists } from '@/lib/backup-utils';
import { findFiles } from '@/lib/file-utils';
import {
  FullOCRLabelStudioSchema,
  type LabelStudioTask,
} from '@/modules/label-studio-full/schema';
import {
  type LabelStudioTaskMin,
  MinOCRLabelStudioSchema,
} from '@/modules/label-studio-min/schema';

type CommandFlags = {
  outDir?: string;
  fileName?: string;
  backup?: boolean;
  copyImages?: boolean;
  baseImageDir?: string;
  recursive?: boolean;
  filePattern?: string;
  imageBaseDir?: string;
} & BaseEnhanceOptions;

export const isLabelStudioFullJSON = (
  data: unknown,
):
  | {
      isFull: true;
      tasks: LabelStudioTask[];
    }
  | {
      isFull: false;
      tasks: LabelStudioTaskMin[];
    } => {
  const newData = Array.isArray(data) ? data : [data];

  // Try parsing as full format array
  const parsedFull = FullOCRLabelStudioSchema.array().safeParse(newData);
  if (parsedFull.success) {
    return { isFull: true as const, tasks: parsedFull.data };
  }

  // Try parsing as min format
  const parsedMin = MinOCRLabelStudioSchema.array().safeParse(newData);
  if (parsedMin.success) {
    return { isFull: false, tasks: parsedMin.data };
  }

  throw new Error(
    `Input data is not valid Label Studio JSON format. ${[parsedFull.error.message, parsedMin.error.message].filter(Boolean)}`,
  );
};

export async function convertToPPOCR(
  this: LocalContext,
  flags: CommandFlags,
  ...inputDirs: string[]
): Promise<void> {
  const {
    outDir,
    fileName = DEFAULT_PPOCR_FILE_NAME,
    backup = DEFAULT_BACKUP,
    copyImages = DEFAULT_COPY_IMAGES,
    baseImageDir,
    imageBaseDir = DEFAULT_IMAGE_BASE_DIR,
    sortVertical = DEFAULT_SORT_VERTICAL,
    sortHorizontal = DEFAULT_SORT_HORIZONTAL,
    normalizeShape = DEFAULT_SHAPE_NORMALIZE,
    widthIncrement = DEFAULT_WIDTH_INCREMENT,
    heightIncrement = DEFAULT_HEIGHT_INCREMENT,
    adaptResize = false,
    adaptResizeThreshold = DEFAULT_ADAPT_RESIZE_THRESHOLD,
    adaptResizeMargin = DEFAULT_ADAPT_RESIZE_MARGIN,
    adaptResizeMinComponentSize = DEFAULT_ADAPT_RESIZE_MIN_COMPONENT_SIZE,
    adaptResizeMaxComponentSize = DEFAULT_ADAPT_RESIZE_MAX_COMPONENT_SIZE,
    adaptResizeOutlierPercentile = DEFAULT_ADAPT_RESIZE_OUTLIER_PERCENTILE,
    adaptResizeMorphologySize = DEFAULT_ADAPT_RESIZE_MORPHOLOGY_SIZE,
    adaptResizeMaxHorizontalExpansion = DEFAULT_ADAPT_RESIZE_MAX_HORIZONTAL_EXPANSION,
    precision = DEFAULT_PPOCR_PRECISION,
    recursive = DEFAULT_RECURSIVE,
    filePattern = DEFAULT_LABEL_STUDIO_FILE_PATTERN,
  } = flags;

  // Find all files matching the pattern
  console.log(chalk.blue('Finding files...'));
  const filePaths = await findFiles(inputDirs, filePattern, recursive);

  if (filePaths.length === 0) {
    console.log(chalk.yellow('No files found matching the pattern.'));
    return;
  }

  console.log(chalk.blue(`Found ${filePaths.length} files to process\n`));

  // Use first input directory as base for relative paths (resolve to absolute)
  // If no input dirs, use current working directory
  const baseDir = inputDirs.length > 0 ? resolve(inputDirs[0]!) : process.cwd();

  for (const filePath of filePaths) {
    const file = basename(filePath);
    // Get relative path to preserve directory structure
    const relativePath = relative(process.cwd(), filePath);
    const relativeDir = dirname(relativePath);

    console.log(chalk.gray(`Processing file: \"${filePath}\"`));

    try {
      const fileData = await readFile(filePath, 'utf-8');
      const labelStudioData = JSON.parse(fileData);

      const { tasks: inputTasks, isFull } =
        isLabelStudioFullJSON(labelStudioData);

      let outputTasks: PPOCRLabelTask[] = [];

      const convertParams = {
        baseImageDir,
      };

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
      };

      // Determine output directory before calling converters
      const outputSubDir = outDir
        ? join(outDir, relativeDir)
        : dirname(filePath);

      if (isFull) {
        outputTasks = await fullLabelStudioToPPOCRConverters(
          inputTasks,
          filePath,
          outputSubDir,
          {
            ...convertParams,
            ...enhanceParams,
          },
        );
      } else {
        outputTasks = await minLabelStudioToPPOCRConverters(
          inputTasks,
          filePath,
          outputSubDir,
          {
            ...convertParams,
            ...enhanceParams,
          },
        );
      }

      // Copy images to output directory if requested
      if (outDir && copyImages) {
        const taskFileDir = dirname(filePath);

        for (const task of inputTasks) {
          try {
            // Extract image path from Label Studio task
            const imageUrl = isFull
              ? (task as LabelStudioTask).data.ocr
              : (task as LabelStudioTaskMin).ocr;

            // Handle URLs vs local paths
            let sourceImagePath: string;
            if (
              imageUrl.startsWith('http://') ||
              imageUrl.startsWith('https://')
            ) {
              // For URLs, the image should have been downloaded to task directory
              // Extract filename from URL
              const urlFileName = basename(new URL(imageUrl).pathname);
              sourceImagePath = join(taskFileDir, urlFileName);
            } else {
              // Local path - strip leading slash and resolve from task directory
              const cleanPath = imageUrl.startsWith('/')
                ? imageUrl.slice(1)
                : imageUrl;
              sourceImagePath = join(taskFileDir, cleanPath);
            }

            // Calculate destination path based on imageBaseDir flag
            let destImagePath: string;
            if (imageBaseDir === IMAGE_BASE_DIR_INPUT_DIR) {
              // Keep full path structure from input directory
              const relativeFromInput = relative(baseDir, sourceImagePath);
              destImagePath = join(outDir, relativeFromInput);
            } else {
              // Default: task-file - relative to task file location
              const relativeFromTask = relative(taskFileDir, sourceImagePath);
              destImagePath = join(outputSubDir, relativeFromTask);
            }

            await mkdir(dirname(destImagePath), { recursive: true });
            await copyFile(sourceImagePath, destImagePath);
            console.log(
              chalk.gray(`  ✓ Copied image: \"${basename(sourceImagePath)}\"`),
            );
          } catch (error) {
            console.warn(
              chalk.yellow(
                `  ⚠ Failed to copy image: ${error instanceof Error ? error.message : error}`,
              ),
            );
          }
        }
      }

      // Format output as PPOCR label format: image_path<tab>[{JSON array}]
      const outputLines: string[] = [];

      for (const task of outputTasks) {
        PPOCRLabelSchema.parse(task.data);

        // Format as: image_path<tab>[{annotations}]
        const jsonArray = JSON.stringify(task.data);
        outputLines.push(`${task.imagePath}\t${jsonArray}`);
      }

      // Write to output file
      const baseName = file.replace('.json', '');

      // Ensure output directory exists
      await mkdir(outputSubDir, { recursive: true });

      const outputPath = join(outputSubDir, `${baseName}_${fileName}`);

      // Backup existing file if requested
      if (backup) {
        const backupPath = await backupFileIfExists(outputPath);
        if (backupPath) {
          console.log(chalk.gray(`  Backed up to: \"${backupPath}\"`));
        }
      }

      await writeFile(outputPath, outputLines.join('\n'), 'utf-8');

      console.log(chalk.green(`✓ Converted \"${file}\" -> \"${outputPath}\"`));
    } catch (error) {
      console.error(
        chalk.red(`✗ Failed to process \"${file}\":`),
        error instanceof Error ? error.message : error,
      );
    }
  }

  console.log(chalk.green('\n✓ Conversion completed!'));
}
