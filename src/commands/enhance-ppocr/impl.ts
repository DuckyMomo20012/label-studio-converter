import { mkdir, readFile, writeFile } from 'fs/promises';
import { basename, dirname, join } from 'path';
import chalk from 'chalk';
import {
  DEFAULT_HEIGHT_INCREMENT,
  DEFAULT_PPOCR_FILE_PATTERN,
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
import { enhancePPOCRLabel } from '@/lib/enhance';
import { findFiles, getRelativePathFromInputs } from '@/lib/file-utils';
import { PPOCRLabelSchema } from '@/lib/schema';

interface CommandFlags {
  outDir?: string;
  sortVertical?: string;
  sortHorizontal?: string;
  normalizeShape?: string;
  widthIncrement?: number;
  heightIncrement?: number;
  precision?: number;
  recursive?: boolean;
  filePattern?: string;
}

export async function enhancePPOCR(
  this: LocalContext,
  flags: CommandFlags,
  ...inputDirs: string[]
): Promise<void> {
  const {
    outDir,
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

      // Parse PPOCRLabelV2 format and enhance each line
      const enhancedLines: string[] = [];

      for (const line of lines) {
        const parts = line.split('\t');

        if (parts.length !== 2) {
          throw new Error(`Invalid PPOCRLabelV2 format in line: ${line}`);
        }

        const [imagePath, annotationsStr] = parts;
        const annotations = JSON.parse(annotationsStr!);

        // Validate annotations
        PPOCRLabelSchema.parse(annotations);

        // Apply enhancements
        const enhanced = enhancePPOCRLabel(annotations, {
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

        // Validate enhanced data
        PPOCRLabelSchema.parse(enhanced);

        // Format as: image_path<tab>[{annotations}]
        const jsonArray = JSON.stringify(enhanced);
        enhancedLines.push(`${imagePath}\t${jsonArray}`);
      }

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

      const outputFilePath = join(outputSubDir, file);
      await writeFile(outputFilePath, enhancedLines.join('\n'), 'utf-8');
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
