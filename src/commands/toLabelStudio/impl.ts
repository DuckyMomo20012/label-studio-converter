import { mkdir, readFile, readdir, writeFile } from 'fs/promises';
import { join } from 'path';
import chalk from 'chalk';
import {
  DEFAULT_BASE_SERVER_URL,
  DEFAULT_CREATE_FILE_LIST_FOR_SERVING,
  DEFAULT_CREATE_FILE_PER_IMAGE,
  DEFAULT_FILE_LIST_NAME,
  DEFAULT_HEIGHT_INCREMENT,
  DEFAULT_LABEL_NAME,
  DEFAULT_LABEL_STUDIO_FULL_JSON,
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
import { ppocrToLabelStudio } from '@/lib/ppocr-label';
import { type PPOCRLabel, PPOCRLabelSchema } from '@/lib/schema';
import { sortBoundingBoxes } from '@/lib/sort';

interface CommandFlags {
  outDir?: string;
  defaultLabelName?: string;
  toFullJson?: boolean;
  createFilePerImage?: boolean;
  createFileListForServing?: boolean;
  fileListName?: string;
  baseServerUrl?: string;
  sortVertical?: string;
  sortHorizontal?: string;
  normalizeShape?: string;
  widthIncrement?: number;
  heightIncrement?: number;
}

export async function convertToLabelStudio(
  this: LocalContext,
  flags: CommandFlags,
  ...inputDirs: string[]
): Promise<void> {
  const {
    outDir = OUTPUT_BASE_DIR,
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
  } = flags;

  // NOTE: Ensure baseServerUrl ends with a single slash, but keeps empty string
  // as is
  const newBaseServerUrl =
    baseServerUrl.replace(/\/+$/, '') + (baseServerUrl === '' ? '' : '/');

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

        // Parse PPOCRLabelV2 format: <filename>\t<json_array_of_annotations>
        // Group by filename since each line represents one image file with its annotations
        const imageDataMap = new Map<string, PPOCRLabel>();

        for (const line of lines) {
          const parts = line.split('\t');

          if (parts.length !== 2) {
            throw new Error(`Invalid PPOCRLabelV2 format in line: ${line}`);
          }
          const [imagePath, annotationsStr] = parts;
          const annotations = JSON.parse(annotationsStr!);

          // Each annotation already has the structure: {transcription, points, dt_score}
          // Validate each annotation
          PPOCRLabelSchema.parse(annotations);

          imageDataMap.set(imagePath!, annotations);
        }

        // Convert each image's annotations to Label Studio format
        const allLabelStudioData = [];
        const fileList: string[] = [];
        let taskId = 1;

        for (const [imagePath, ppocrData] of imageDataMap.entries()) {
          // Sort annotations if requested
          const sortedPpocrData = sortBoundingBoxes(
            ppocrData,
            sortVertical as VerticalSortOrder,
            sortHorizontal as HorizontalSortOrder,
          );

          // Update imagePath to use baseServerUrl if createFileListForServing is enabled
          const finalImagePath = createFileListForServing
            ? encodeURI(`${newBaseServerUrl}${imagePath}`)
            : imagePath;

          const labelStudioData = await ppocrToLabelStudio(sortedPpocrData, {
            toFullJson,
            imagePath,
            baseServerUrl: newBaseServerUrl,
            inputDir,
            taskId,
            labelName: defaultLabelName,
            normalizeShape:
              normalizeShape !== SHAPE_NORMALIZE_NONE
                ? (normalizeShape as ShapeNormalizeOption)
                : undefined,
            widthIncrement,
            heightIncrement,
          });

          if (toFullJson) {
            allLabelStudioData.push(labelStudioData[0]);
          } else {
            allLabelStudioData.push(...labelStudioData);
          }

          // Create individual file per image if requested
          if (createFilePerImage) {
            const imageBaseName = imagePath
              .replace(/\//g, '_')
              .replace(/\.[^.]+$/, '');
            const individualOutputPath = join(
              outDir,
              `${imageBaseName}_${toFullJson ? 'full' : 'min'}.json`,
            );
            await writeFile(
              individualOutputPath,
              JSON.stringify(
                toFullJson ? labelStudioData[0] : labelStudioData,
                null,
                2,
              ),
              'utf-8',
            );
            console.log(
              chalk.gray(
                `  ✓ Created individual file: ${individualOutputPath}`,
              ),
            );
          }

          // Add to file list for serving
          if (createFileListForServing) {
            fileList.push(finalImagePath);
          }

          taskId++;
        }

        // Write combined output file
        const baseName = file.replace('.txt', '');
        const outputPath = join(
          outDir,
          `${baseName}_${toFullJson ? 'full' : 'min'}.json`,
        );
        await writeFile(
          outputPath,
          JSON.stringify(allLabelStudioData, null, 2),
          'utf-8',
        );

        console.log(chalk.green(`✓ Converted ${file} -> ${outputPath}`));

        // Create file list for serving if requested
        if (createFileListForServing && fileList.length > 0) {
          const fileListPath = join(outDir, fileListName);
          await writeFile(fileListPath, fileList.join('\n'), 'utf-8');
          console.log(
            chalk.green(
              `✓ Created file list: ${fileListPath} (${fileList.length} files)`,
            ),
          );
        }
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
