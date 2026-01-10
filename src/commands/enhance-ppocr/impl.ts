import { mkdir, readFile, readdir, writeFile } from 'fs/promises';
import { join } from 'path';
import chalk from 'chalk';
import {
  DEFAULT_HEIGHT_INCREMENT,
  DEFAULT_PPOCR_PRECISION,
  DEFAULT_SHAPE_NORMALIZE,
  DEFAULT_SORT_HORIZONTAL,
  DEFAULT_SORT_VERTICAL,
  DEFAULT_WIDTH_INCREMENT,
  type HorizontalSortOrder,
  OUTPUT_BASE_DIR,
  SHAPE_NORMALIZE_NONE,
  type ShapeNormalizeOption,
  type VerticalSortOrder,
} from '@/constants';
import type { LocalContext } from '@/context';
import { enhancePPOCRLabel } from '@/lib/enhance';
import { PPOCRLabelSchema } from '@/lib/schema';

interface CommandFlags {
  outDir?: string;
  sortVertical?: string;
  sortHorizontal?: string;
  normalizeShape?: string;
  widthIncrement?: number;
  heightIncrement?: number;
  precision?: number;
}

export async function enhancePPOCR(
  this: LocalContext,
  flags: CommandFlags,
  ...inputDirs: string[]
): Promise<void> {
  const {
    outDir = OUTPUT_BASE_DIR,
    sortVertical = DEFAULT_SORT_VERTICAL,
    sortHorizontal = DEFAULT_SORT_HORIZONTAL,
    normalizeShape = DEFAULT_SHAPE_NORMALIZE,
    widthIncrement = DEFAULT_WIDTH_INCREMENT,
    heightIncrement = DEFAULT_HEIGHT_INCREMENT,
    precision = DEFAULT_PPOCR_PRECISION,
  } = flags;

  // Create output directory if it doesn't exist
  await mkdir(outDir, { recursive: true });

  for (const inputDir of inputDirs) {
    console.log(chalk.blue(`Processing input directory: ${inputDir}`));

    const files = await readdir(inputDir);

    for (const file of files) {
      if (!file.endsWith('.txt')) {
        continue;
      }

      const filePath = join(inputDir, file);
      console.log(chalk.gray(`Processing file: ${file}`));

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
        const outputFilePath = join(outDir, file);
        await writeFile(outputFilePath, enhancedLines.join('\n'), 'utf-8');
        console.log(chalk.green(`✓ Enhanced file saved: ${outputFilePath}`));
      } catch (error) {
        console.error(
          chalk.red(`Error processing file ${file}:`),
          error instanceof Error ? error.message : String(error),
        );
      }
    }
  }

  console.log(chalk.green('\n✓ Enhancement complete!'));
}
