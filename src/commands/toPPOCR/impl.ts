import { mkdir, readFile, writeFile } from 'fs/promises';
import { basename, dirname, join } from 'path';
import chalk from 'chalk';
import {
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
  type HorizontalSortOrder,
  SHAPE_NORMALIZE_NONE,
  type ShapeNormalizeOption,
  type VerticalSortOrder,
} from '@/constants';
import type { LocalContext } from '@/context';
import { backupFileIfExists } from '@/lib/backup-utils';
import { findFiles, getRelativePathFromInputs } from '@/lib/file-utils';
import { labelStudioToPPOCR, minLabelStudioToPPOCR } from '@/lib/label-studio';
import {
  type FullOCRLabelStudio,
  FullOCRLabelStudioSchema,
  type MinOCRLabelStudio,
  MinOCRLabelStudioSchema,
  PPOCRLabelSchema,
} from '@/lib/schema';
import { sortBoundingBoxes } from '@/lib/sort';

interface CommandFlags {
  outDir?: string;
  fileName?: string;
  backup?: boolean;
  baseImageDir?: string;
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
    const relativePath = getRelativePathFromInputs(filePath, inputDirs);
    const relativeDir = dirname(relativePath);

    console.log(chalk.gray(`Processing file: ${filePath}`));

    try {
      const fileData = await readFile(filePath, 'utf-8');
      const labelStudioData = JSON.parse(fileData);

      const { data, isFull } = isLabelStudioFullJSON(labelStudioData);

      // Convert based on format type
      const ppocrDataMap = isFull
        ? await labelStudioToPPOCR(data as FullOCRLabelStudio, {
            baseImageDir,
            normalizeShape:
              normalizeShape !== SHAPE_NORMALIZE_NONE
                ? (normalizeShape as ShapeNormalizeOption)
                : undefined,
            widthIncrement,
            heightIncrement,
            precision,
          })
        : await minLabelStudioToPPOCR(data as MinOCRLabelStudio, {
            baseImageDir,
            normalizeShape:
              normalizeShape !== SHAPE_NORMALIZE_NONE
                ? (normalizeShape as ShapeNormalizeOption)
                : undefined,
            widthIncrement,
            heightIncrement,
            precision,
          });

      // Format output as PPOCR label format: image_path<tab>[{JSON array}]
      const outputLines: string[] = [];
      for (const [imagePath, annotations] of ppocrDataMap.entries()) {
        // Sort annotations if requested
        const sortedAnnotations = sortBoundingBoxes(
          annotations,
          sortVertical as VerticalSortOrder,
          sortHorizontal as HorizontalSortOrder,
        );

        // Validate each annotation group
        PPOCRLabelSchema.parse(sortedAnnotations);

        // Format as: image_path<tab>[{annotations}]
        const jsonArray = JSON.stringify(sortedAnnotations);
        outputLines.push(`${imagePath}\t${jsonArray}`);
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
