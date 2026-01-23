import { mkdir, readFile, writeFile } from 'fs/promises';
import { basename, dirname, join, relative } from 'path';
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
  DEFAULT_HEIGHT_INCREMENT,
  DEFAULT_LABEL_STUDIO_FILE_PATTERN,
  DEFAULT_PPOCR_FILE_NAME,
  DEFAULT_PPOCR_PRECISION,
  DEFAULT_RECURSIVE,
  DEFAULT_SHAPE_NORMALIZE,
  DEFAULT_SORT_HORIZONTAL,
  DEFAULT_SORT_VERTICAL,
  DEFAULT_WIDTH_INCREMENT,
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
  baseImageDir?: string;
  recursive?: boolean;
  filePattern?: string;
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
    baseImageDir,
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

  for (const filePath of filePaths) {
    const file = basename(filePath);
    // Get relative path to preserve directory structure
    const relativePath = relative(process.cwd(), filePath);
    const relativeDir = dirname(relativePath);

    console.log(chalk.gray(`Processing file: ${filePath}`));

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
      };

      if (isFull) {
        outputTasks = await fullLabelStudioToPPOCRConverters(
          inputTasks,
          filePath,
          {
            ...convertParams,
            ...enhanceParams,
          },
        );
      } else {
        outputTasks = await minLabelStudioToPPOCRConverters(
          inputTasks,
          filePath,
          {
            ...convertParams,
            ...enhanceParams,
          },
        );
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

      // Use outDir if specified, otherwise use source file directory
      const outputSubDir = outDir
        ? join(outDir, relativeDir)
        : dirname(filePath);
      await mkdir(outputSubDir, { recursive: true });

      const outputPath = join(outputSubDir, `${baseName}_${fileName}`);

      // Backup existing file if requested
      if (backup) {
        const backupPath = await backupFileIfExists(outputPath);
        if (backupPath) {
          console.log(chalk.gray(`  Backed up to: ${backupPath}`));
        }
      }

      await writeFile(outputPath, outputLines.join('\n'), 'utf-8');

      console.log(chalk.green(`✓ Converted ${file} -> ${outputPath}`));
    } catch (error) {
      console.error(
        chalk.red(`✗ Failed to process ${file}:`),
        error instanceof Error ? error.message : error,
      );
    }
  }

  console.log(chalk.green('\n✓ Conversion completed!'));
}
