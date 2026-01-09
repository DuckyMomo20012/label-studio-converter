import { mkdir, readFile, readdir, writeFile } from 'fs/promises';
import { join } from 'path';
import chalk from 'chalk';
import {
  DEFAULT_HEIGHT_INCREMENT,
  DEFAULT_PPOCR_FILE_NAME,
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
  baseImageDir?: string;
  sortVertical?: string;
  sortHorizontal?: string;
  normalizeShape?: string;
  widthIncrement?: number;
  heightIncrement?: number;
  precision?: number;
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
    outDir = `${OUTPUT_BASE_DIR}`,
    fileName = DEFAULT_PPOCR_FILE_NAME,
    baseImageDir,
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
      if (!file.endsWith('.json')) {
        continue;
      }

      const filePath = join(inputDir, file);
      console.log(chalk.gray(`Processing file: ${file}`));

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
        const outputPath = join(outDir, `${baseName}_${fileName}`);
        await writeFile(outputPath, outputLines.join('\n'), 'utf-8');

        console.log(chalk.green(`✓ Converted ${file} -> ${outputPath}`));
      } catch (error) {
        console.error(
          chalk.red(`✗ Failed to process ${file}:`),
          error instanceof Error ? error.message : error,
        );
      }
    }
  }

  console.log(chalk.green('\n✓ Conversion completed!'));
}
