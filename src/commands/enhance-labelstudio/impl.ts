import { mkdir, readFile, writeFile } from 'fs/promises';
import { basename, dirname, join } from 'path';
import chalk from 'chalk';
import {
  DEFAULT_HEIGHT_INCREMENT,
  DEFAULT_LABEL_STUDIO_FILE_PATTERN,
  DEFAULT_LABEL_STUDIO_PRECISION,
  DEFAULT_RECURSIVE,
  DEFAULT_SHAPE_NORMALIZE,
  DEFAULT_SORT_HORIZONTAL,
  DEFAULT_SORT_VERTICAL,
  DEFAULT_WIDTH_INCREMENT,
  type HorizontalSortOrder,
  SHAPE_NORMALIZE_NONE,
  type ShapeNormalizeOption,
  type VerticalSortOrder,
} from '@/constants';
import type { LocalContext } from '@/context';
import { backupFileIfExists } from '@/lib/backup-utils';
import { findFiles, getRelativePathFromInputs } from '@/lib/file-utils';
import { enhanceLabelStudioData } from '@/lib/label-studio';
import {
  type FullOCRLabelStudio,
  FullOCRLabelStudioSchema,
  type MinOCRLabelStudio,
  MinOCRLabelStudioSchema,
} from '@/lib/schema';

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
}

const isLabelStudioFullJSON = (
  data: unknown,
): {
  isFull: boolean;
  data: FullOCRLabelStudio | MinOCRLabelStudio;
} => {
  // Try parsing as full format array
  const parsedFull = FullOCRLabelStudioSchema.safeParse(data);
  if (parsedFull.success) {
    return { isFull: true, data: parsedFull.data };
  }

  // Try parsing as single full format object (wrap in array)
  if (!Array.isArray(data) && typeof data === 'object' && data !== null) {
    const parsedSingleFull = FullOCRLabelStudioSchema.safeParse([data]);
    if (parsedSingleFull.success) {
      return { isFull: true, data: parsedSingleFull.data };
    }
  }

  // Try parsing as min format
  const parsedMin = MinOCRLabelStudioSchema.safeParse(data);
  if (parsedMin.success) {
    return { isFull: false, data: parsedMin.data };
  }

  throw new Error('Input data is not valid Label Studio JSON format.');
};

export async function enhanceLabelStudio(
  this: LocalContext,
  flags: CommandFlags,
  ...inputDirs: string[]
): Promise<void> {
  const {
    outDir,
    fileName,
    backup = false,
    sortVertical = DEFAULT_SORT_VERTICAL,
    sortHorizontal = DEFAULT_SORT_HORIZONTAL,
    normalizeShape = DEFAULT_SHAPE_NORMALIZE,
    widthIncrement = DEFAULT_WIDTH_INCREMENT,
    heightIncrement = DEFAULT_HEIGHT_INCREMENT,
    precision = DEFAULT_LABEL_STUDIO_PRECISION,
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
    console.log(chalk.gray(`Processing file: ${filePath}`));

    try {
      const fileData = await readFile(filePath, 'utf-8');
      const labelStudioData = JSON.parse(fileData);

      const { data, isFull } = isLabelStudioFullJSON(labelStudioData);

      // Apply enhancements
      const enhanced = await enhanceLabelStudioData(data, isFull, {
        sortVertical: sortVertical as VerticalSortOrder,
        sortHorizontal: sortHorizontal as HorizontalSortOrder,
        normalizeShape:
          normalizeShape !== SHAPE_NORMALIZE_NONE
            ? (normalizeShape as ShapeNormalizeOption)
            : undefined,
        widthIncrement,
        heightIncrement,
        precision,
      });

      // Write enhanced data
      // Use outDir if specified, otherwise use source file directory
      const outputSubDir = outDir
        ? (() => {
            const relativePath = getRelativePathFromInputs(filePath, inputDirs);
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
        JSON.stringify(enhanced, null, 2),
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
