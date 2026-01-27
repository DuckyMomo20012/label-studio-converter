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
  DEFAULT_BASE_SERVER_URL,
  DEFAULT_COPY_IMAGES,
  DEFAULT_CREATE_FILE_LIST_FOR_SERVING,
  DEFAULT_CREATE_FILE_PER_IMAGE,
  DEFAULT_FILE_LIST_NAME,
  DEFAULT_HEIGHT_INCREMENT,
  DEFAULT_IMAGE_BASE_DIR,
  DEFAULT_LABEL_NAME,
  DEFAULT_LABEL_STUDIO_FULL_JSON,
  DEFAULT_LABEL_STUDIO_PRECISION,
  DEFAULT_OUTPUT_MODE,
  DEFAULT_PPOCR_FILE_PATTERN,
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
  type LabelStudioTask,
  type LabelStudioTaskMin,
  PPOCRLabelSchema,
  type PPOCRLabelTask,
  ppocrToFullLabelStudioConverters,
  ppocrToMinLabelStudioConverters,
} from '@/lib';
import { backupFileIfExists } from '@/lib/backup-utils';
import { findFiles } from '@/lib/file-utils';

type CommandFlags = {
  outDir?: string;
  fileName?: string;
  backup?: boolean;
  copyImages?: boolean;
  defaultLabelName?: string;
  toFullJson?: boolean;
  createFilePerImage?: boolean;
  createFileListForServing?: boolean;
  fileListName?: string;
  baseServerUrl?: string;
  recursive?: boolean;
  filePattern?: string;
  outputMode?: string;
  imageBaseDir?: string;
} & BaseEnhanceOptions;

export async function convertToLabelStudio(
  this: LocalContext,
  flags: CommandFlags,
  ...inputDirs: string[]
): Promise<void> {
  const {
    outDir,
    fileName,
    backup = DEFAULT_BACKUP,
    copyImages = DEFAULT_COPY_IMAGES,
    imageBaseDir = DEFAULT_IMAGE_BASE_DIR,
    defaultLabelName = DEFAULT_LABEL_NAME,
    toFullJson = DEFAULT_LABEL_STUDIO_FULL_JSON,
    createFilePerImage = DEFAULT_CREATE_FILE_PER_IMAGE,
    createFileListForServing = DEFAULT_CREATE_FILE_LIST_FOR_SERVING,
    fileListName = DEFAULT_FILE_LIST_NAME,
    baseServerUrl = DEFAULT_BASE_SERVER_URL,
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
    precision = DEFAULT_LABEL_STUDIO_PRECISION,
    recursive = DEFAULT_RECURSIVE,
    filePattern = DEFAULT_PPOCR_FILE_PATTERN,
    outputMode = DEFAULT_OUTPUT_MODE,
  } = flags;

  // Validate outputMode is only used with Full JSON format
  if (outputMode !== DEFAULT_OUTPUT_MODE && !toFullJson) {
    console.log(
      chalk.red(
        'Error: --outputMode can only be used with --toFullJson (Full JSON format). Min JSON format does not support annotations/predictions distinction.',
      ),
    );
    return;
  }

  // Find all files matching the pattern
  console.log(chalk.blue('Finding files...'));
  const filePaths = await findFiles(inputDirs, filePattern, recursive);

  if (filePaths.length === 0) {
    console.log(chalk.yellow('No files found matching the pattern.'));
    return;
  }

  console.log(chalk.blue(`Found ${filePaths.length} files to process\n`));

  // Resolve outDir to absolute path if provided
  const resolvedOutDir = outDir ? resolve(outDir) : undefined;

  // Prepare file list for serving if needed
  let fileListPath: string | null = null;
  if (createFileListForServing && resolvedOutDir) {
    fileListPath = join(resolvedOutDir, fileListName);
    // Create output directory and file list file
    await mkdir(resolvedOutDir, { recursive: true });
    await writeFile(fileListPath, '', 'utf-8');
  }

  // Use first input directory as base for relative paths (resolve to absolute)
  // If no input dirs, use current working directory
  const baseDir = inputDirs.length > 0 ? resolve(inputDirs[0]!) : process.cwd();

  for (const filePath of filePaths) {
    const file = basename(filePath);

    // Get relative path to preserve directory structure
    const relativePath = relative(baseDir, filePath);
    const relativeDir = dirname(relativePath);

    console.log(chalk.gray(`Processing file: ${filePath}`));

    try {
      const fileData = await readFile(filePath, 'utf-8');
      const trimmedData = fileData.trim();

      // Handle empty files
      if (trimmedData === '') {
        console.log(chalk.yellow(`  Skipping empty file: ${filePath}`));
        continue;
      }

      const lines = trimmedData.split('\n');

      // Parse PPOCRLabelV2 format: <filename>\t<json_array_of_annotations>
      const inputTasks: PPOCRLabelTask[] = [];

      for (const line of lines) {
        // Skip empty lines
        if (line.trim() === '') {
          continue;
        }

        const parts = line.split('\t');

        if (parts.length !== 2) {
          console.warn(`Skipping invalid PPOCRLabelV2 format in line: ${line}`);
          continue;
        }
        const [imagePath, annotationsStr] = parts;

        if (!imagePath || !annotationsStr) {
          console.warn(
            `Skipping line with missing imagePath or annotations: ${line}`,
          );
          continue;
        }

        try {
          const inputTask = JSON.parse(annotationsStr);

          // Each annotation already has the structure: {transcription, points, dt_score}
          // Validate each annotation
          PPOCRLabelSchema.parse(inputTask);

          inputTasks.push({ imagePath, data: inputTask });
        } catch (error) {
          console.warn(
            `Skipping line due to parse/validation error: ${line}`,
            error,
          );
          continue;
        }
      }

      // If no valid lines were found, skip this file
      if (inputTasks.length === 0) {
        console.log(
          chalk.yellow(`  Skipping file with no valid data: ${filePath}`),
        );
        continue;
      }

      // Convert each image's annotations to Label Studio format
      let outputTasks: (LabelStudioTask | LabelStudioTaskMin)[] = [];

      // Determine output directory for converter (where JSON will be written)
      const converterOutputDir = resolvedOutDir
        ? join(resolvedOutDir, relativeDir)
        : dirname(filePath);

      const convertParams = {
        defaultLabelName,
        baseServerUrl,
        outDir: converterOutputDir,
        copyImages: resolvedOutDir ? copyImages : false,
        inputBaseDir: baseDir,
        outputRootDir: resolvedOutDir,
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

      if (toFullJson) {
        outputTasks = await ppocrToFullLabelStudioConverters(
          inputTasks,
          filePath,
          {
            ...convertParams,
            ...enhanceParams,
          },
        );
      } else {
        outputTasks = await ppocrToMinLabelStudioConverters(
          inputTasks,
          filePath,
          {
            ...convertParams,
            ...enhanceParams,
          },
        );
      }

      // Copy images to output directory if requested
      if (resolvedOutDir && copyImages) {
        const taskFileDir = dirname(filePath);
        const outputSubDir = join(resolvedOutDir, relativeDir);

        for (const task of inputTasks) {
          try {
            // Resolve imagePath from PPOCR Label.txt
            // The path is like "folder/file.jpg" where folder is the opened directory name
            const parts = task.imagePath.split('/');
            const folderName = parts.length > 1 ? parts[0] : '';
            const fileName =
              parts.length > 1 ? parts.slice(1).join('/') : task.imagePath;

            // Resolve from parent directory of task file
            const sourceImagePath = folderName
              ? resolve(dirname(taskFileDir), folderName, fileName)
              : resolve(taskFileDir, fileName);

            // Calculate destination path based on imageBaseDir flag
            let destImagePath: string;
            if (imageBaseDir === IMAGE_BASE_DIR_INPUT_DIR) {
              // Keep full path structure from input directory
              const relativeFromInput = relative(baseDir, sourceImagePath);
              destImagePath = join(resolvedOutDir, relativeFromInput);
            } else {
              // Default: task-file - relative to task file location
              const relativeFromTask = relative(taskFileDir, sourceImagePath);
              destImagePath = join(outputSubDir, relativeFromTask);
            }

            await mkdir(dirname(destImagePath), { recursive: true });
            await copyFile(sourceImagePath, destImagePath);
            console.log(
              chalk.gray(`  ✓ Copied image: ${basename(sourceImagePath)}`),
            );
          } catch (error) {
            console.warn(
              chalk.yellow(
                `  ⚠ Failed to copy image ${task.imagePath}: ${error instanceof Error ? error.message : error}`,
              ),
            );
          }
        }
      }

      // Create individual file per image if requested
      if (createFilePerImage) {
        for await (const taskOutput of outputTasks) {
          const imageFilePath = toFullJson
            ? (taskOutput as LabelStudioTask).data.ocr
            : (taskOutput as LabelStudioTaskMin).ocr;

          const imageBaseName = imageFilePath
            .split('/')
            .pop()!
            .replace(/\//g, '_')
            .replace(/\.[^.]+$/, '');

          // Use resolvedOutDir if specified, otherwise use source file directory
          const outputSubDir = resolvedOutDir
            ? join(resolvedOutDir, relativeDir)
            : dirname(filePath);
          await mkdir(outputSubDir, { recursive: true });

          const individualOutputPath = join(
            outputSubDir,
            `${imageBaseName}_${toFullJson ? 'full' : 'min'}.json`,
          );
          await writeFile(
            individualOutputPath,
            JSON.stringify(taskOutput, null, 2),
            'utf-8',
          );
          console.log(
            chalk.gray(`  ✓ Created individual file: ${individualOutputPath}`),
          );

          // Add to file list for serving (write incrementally)
          if (fileListPath) {
            await writeFile(fileListPath, `${imageFilePath}\n`, {
              encoding: 'utf-8',
              flag: 'a',
            });
          }
        }
      }

      // Write combined output file
      const baseName = fileName || file.replace('.txt', '');

      // Use resolvedOutDir if specified, otherwise use source file directory
      const outputSubDir = resolvedOutDir
        ? join(resolvedOutDir, relativeDir)
        : dirname(filePath);
      await mkdir(outputSubDir, { recursive: true });

      const outputPath = join(
        outputSubDir,
        fileName
          ? `${fileName}.json`
          : `${baseName}_${toFullJson ? 'full' : 'min'}.json`,
      );

      // Backup existing file if requested
      if (backup) {
        const backupPath = await backupFileIfExists(outputPath);
        if (backupPath) {
          console.log(chalk.gray(`  ✓ Created backup: ${backupPath}`));
        }
      }
      await writeFile(
        outputPath,
        JSON.stringify(outputTasks, null, 2),
        'utf-8',
      );

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
