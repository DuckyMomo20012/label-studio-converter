import { mkdir, readFile, writeFile } from 'fs/promises';
import { basename, dirname, join, relative } from 'path';
import chalk from 'chalk';
import { isLabelStudioFullJSON } from '@/commands/toPPOCR/impl';
import {
  DEFAULT_BACKUP,
  DEFAULT_HEIGHT_INCREMENT,
  DEFAULT_LABEL_STUDIO_FILE_PATTERN,
  DEFAULT_LABEL_STUDIO_PRECISION,
  DEFAULT_OUTPUT_MODE,
  DEFAULT_RECURSIVE,
  DEFAULT_SHAPE_NORMALIZE,
  DEFAULT_SORT_HORIZONTAL,
  DEFAULT_SORT_VERTICAL,
  DEFAULT_WIDTH_INCREMENT,
} from '@/constants';
import type { LocalContext } from '@/context';
import {
  type LabelStudioTask,
  type LabelStudioTaskMin,
  enhanceFullLabelStudioConverters,
  enhanceMinLabelStudioConverters,
} from '@/lib';
import { backupFileIfExists } from '@/lib/backup-utils';
import { findFiles } from '@/lib/file-utils';

interface CommandFlags {
  outDir?: string;
  fileName?: string;
  backup?: boolean;
  sortVertical?: string;
  sortHorizontal?: string;
  normalizeShape?: string;
  widthIncrement?: number;
  heightIncrement?: number;
  precision?: number;
  recursive?: boolean;
  filePattern?: string;
  outputMode?: string;
}

export async function enhanceLabelStudio(
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
    precision = DEFAULT_LABEL_STUDIO_PRECISION,
    recursive = DEFAULT_RECURSIVE,
    filePattern = DEFAULT_LABEL_STUDIO_FILE_PATTERN,
    outputMode = DEFAULT_OUTPUT_MODE,
  } = flags;

  // Find all files matching the pattern
  console.log(chalk.blue('Finding files...'));
  const filePaths = await findFiles(inputDirs, filePattern, recursive);

  if (filePaths.length === 0) {
    console.log(chalk.yellow('No files found matching the pattern.'));
    return;
  }

  console.log(chalk.blue(`Found ${filePaths.length} files to process\n`));

  for await (const filePath of filePaths) {
    const file = basename(filePath);
    console.log(chalk.gray(`Processing file: ${filePath}`));

    try {
      const fileData = await readFile(filePath, 'utf-8');
      const labelStudioData = JSON.parse(fileData);

      const { tasks: inputTasks, isFull } =
        isLabelStudioFullJSON(labelStudioData);

      // Validate outputMode is only used with Full JSON format
      if (outputMode !== DEFAULT_OUTPUT_MODE && !isFull) {
        console.log(
          chalk.red(
            `  Skipping file: ${filePath}\n  Error: --outputMode can only be used with Full JSON format. This file is in Min JSON format which does not support annotations/predictions distinction.`,
          ),
        );
        continue;
      }

      let outputTasks: LabelStudioTask[] | LabelStudioTaskMin[];

      const optionParams = {
        sortVertical,
        sortHorizontal,
        normalizeShape,
        widthIncrement,
        heightIncrement,
        precision,
      };

      if (isFull) {
        outputTasks = await enhanceFullLabelStudioConverters(
          inputTasks,
          filePath,
          optionParams,
        );
      } else {
        outputTasks = await enhanceMinLabelStudioConverters(
          inputTasks,
          filePath,
          optionParams,
        );
      }

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

      await writeFile(
        outputFilePath,
        JSON.stringify(outputTasks, null, 2),
        'utf-8',
      );
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
