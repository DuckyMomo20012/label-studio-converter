import { mkdir, readFile, writeFile } from 'fs/promises';
import { basename, dirname, join, relative } from 'path';
import chalk from 'chalk';
import {
  DEFAULT_BACKUP,
  DEFAULT_HEIGHT_INCREMENT,
  DEFAULT_PPOCR_FILE_PATTERN,
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
  enhancePPOCRConverters,
} from '@/lib';
import { backupFileIfExists } from '@/lib/backup-utils';
import { findFiles } from '@/lib/file-utils';

type CommandFlags = {
  outDir?: string;
  fileName?: string;
  backup?: boolean;
  recursive?: boolean;
  filePattern?: string;
} & BaseEnhanceOptions;

export async function enhancePPOCR(
  this: LocalContext,
  flags: CommandFlags,
  ...inputDirs: string[]
): Promise<void> {
  const {
    outDir,
    fileName,
    backup = DEFAULT_BACKUP,
    sortVertical = DEFAULT_SORT_VERTICAL,
    sortHorizontal = DEFAULT_SORT_HORIZONTAL,
    normalizeShape = DEFAULT_SHAPE_NORMALIZE,
    widthIncrement = DEFAULT_WIDTH_INCREMENT,
    heightIncrement = DEFAULT_HEIGHT_INCREMENT,
    precision = DEFAULT_PPOCR_PRECISION,
    recursive = DEFAULT_RECURSIVE,
    filePattern = DEFAULT_PPOCR_FILE_PATTERN,
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
    console.log(chalk.gray(`Processing file: ${filePath}`));

    try {
      const fileData = await readFile(filePath, 'utf-8');
      const lines = fileData.trim().split('\n');

      // Parse PPOCRLabelV2 format: <filename>\t<json_array_of_annotations>
      const inputTasks: PPOCRLabelTask[] = [];

      for (const line of lines) {
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
          const inputTask = JSON.parse(annotationsStr!);

          // Validate annotations
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

      const optionParams = {
        sortVertical,
        sortHorizontal,
        normalizeShape,
        widthIncrement,
        heightIncrement,
        precision,
      };

      const outputTasks = await enhancePPOCRConverters(
        inputTasks,
        filePath,
        optionParams,
      );

      // Write enhanced data
      // Use outDir if specified, otherwise use source file directory
      const outputSubDir = outDir
        ? (() => {
            const relativePath = relative(process.cwd(), filePath);
            const relativeDir = dirname(relativePath);
            return join(outDir, relativeDir);
          })()
        : dirname(filePath);
      await mkdir(outputSubDir, { recursive: true });

      const outputFileName = fileName || file;
      const outputFilePath = join(outputSubDir, outputFileName);

      // Backup existing file if requested
      if (backup) {
        const backupPath = await backupFileIfExists(outputFilePath);
        if (backupPath) {
          console.log(chalk.gray(`  Backed up to: ${backupPath}`));
        }
      }

      await writeFile(outputFilePath, outputTasks.join('\n'), 'utf-8');
      console.log(chalk.green(`✓ Enhanced file saved: ${outputFilePath}`));
    } catch (error) {
      console.error(
        chalk.red(`Error processing file ${file}:`),
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  console.log(chalk.green('\n✓ Enhancement complete!'));
}
