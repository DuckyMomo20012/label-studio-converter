import { createWriteStream } from 'fs';
import { get } from 'https';
import { basename, dirname, join } from 'path';
import { type BaseEnhanceOptions } from '@/config';
import {
  FullOCRLabelStudioInput,
  type HorizontalSortOrder,
  type LabelStudioTask,
  type LabelStudioTaskMin,
  MinOCRLabelStudioInput,
  PPOCROutput,
  Processor,
  type ShapeNormalizeOption,
  type VerticalSortOrder,
  adaptResizeTransformer,
  normalizeTransformer,
  resizeTransformer,
  roundTransformer,
  sortTransformer,
  withOptions,
} from '@/lib';

export type LabelStudioToPPOCRConverterOptions = BaseEnhanceOptions & {
  baseImageDir?: string;
};

export const fullLabelStudioToPPOCRConverters = async (
  inputTasks: LabelStudioTask[],
  taskFilePath: string,
  options: LabelStudioToPPOCRConverterOptions,
) => {
  const {
    baseImageDir,
    sortVertical,
    sortHorizontal,
    normalizeShape,
    useOrientedBox,
    widthIncrement,
    heightIncrement,
    adaptResize = false,
    adaptResizeThreshold,
    adaptResizeMargin,
    adaptResizeMinComponentSize,
    adaptResizeMaxComponentSize,
    adaptResizeOutlierPercentile,
    adaptResizeMorphologySize,
    adaptResizeMaxHorizontalExpansion,
    precision,
  } = options;

  const transformerParams = [
    withOptions(normalizeTransformer, {
      normalizeShape: normalizeShape as ShapeNormalizeOption,
      useOrientedBox,
    }),
    withOptions(resizeTransformer, {
      widthIncrement,
      heightIncrement,
    }),
    ...(adaptResize
      ? [
          withOptions(adaptResizeTransformer, {
            threshold: adaptResizeThreshold,
            margin: adaptResizeMargin,
            minComponentSize: adaptResizeMinComponentSize,
            maxComponentSize: adaptResizeMaxComponentSize,
            outlierPercentile: adaptResizeOutlierPercentile,
            morphologySize: adaptResizeMorphologySize,
            maxHorizontalExpansion: adaptResizeMaxHorizontalExpansion,
          }),
        ]
      : []),
    withOptions(roundTransformer, {
      precision,
    }),
    withOptions(sortTransformer, {
      horizontalSort: sortHorizontal as HorizontalSortOrder,
      verticalSort: sortVertical as VerticalSortOrder,
    }),
  ];

  const resolveInputImagePath = async (
    taskImagePath: string,
    taskFilePath: string,
  ) => {
    const fileDir = dirname(taskFilePath);

    // Check if it's a remote URL
    if (
      taskImagePath.startsWith('http://') ||
      taskImagePath.startsWith('https://')
    ) {
      // Extract filename from URL
      const urlPath = new URL(taskImagePath).pathname;
      const filename = basename(urlPath);
      const localPath = join(fileDir, filename);

      // Download the image
      await new Promise<void>((resolve, reject) => {
        get(taskImagePath, (response) => {
          const fileStream = createWriteStream(localPath);
          response.pipe(fileStream);
          fileStream.on('finish', () => {
            fileStream.close();
            resolve();
          });
          fileStream.on('error', reject);
        }).on('error', reject);
      });

      return localPath;
    }

    // Label Studio exports can have leading slash (/path)
    // Strip leading slashes to get relative path
    const normalizedImagePath = taskImagePath.replace(/^\/+/, '');
    const resolvedImagePath = join(fileDir, normalizedImagePath);
    return resolvedImagePath;
  };

  const resolveOutputImagePath = (
    taskImagePath: string,
    taskFilePath: string,
  ) => {
    const fileDir = dirname(taskFilePath);
    // taskImagePath is the full resolved path, extract just the filename
    const filename = taskImagePath.split('/').pop() || '';
    // For PPOCR output, we keep only the folder of the task file
    const resolvedPath = join(
      baseImageDir || '',
      fileDir.split('/').pop() || '',
      filename,
    );
    return resolvedPath;
  };

  const processor = new Processor({
    input: FullOCRLabelStudioInput,
    output: PPOCROutput,
    transformers: transformerParams,
  });

  return await Promise.all(
    inputTasks.map(async (task) => {
      const outputData = await processor.process({
        inputData: task,
        taskFilePath,
        resolveInputImagePath,
        resolveOutputImagePath,
      });
      return outputData;
    }),
  );
};

export const minLabelStudioToPPOCRConverters = async (
  inputTasks: LabelStudioTaskMin[],
  taskFilePath: string,
  options: LabelStudioToPPOCRConverterOptions,
) => {
  const {
    baseImageDir,
    sortVertical,
    sortHorizontal,
    normalizeShape,
    useOrientedBox,
    widthIncrement,
    heightIncrement,
    adaptResize = false,
    adaptResizeThreshold,
    adaptResizeMargin,
    adaptResizeMinComponentSize,
    adaptResizeMaxComponentSize,
    adaptResizeOutlierPercentile,
    adaptResizeMorphologySize,
    adaptResizeMaxHorizontalExpansion,
    precision,
  } = options;

  const transformerParams = [
    withOptions(normalizeTransformer, {
      normalizeShape: normalizeShape as ShapeNormalizeOption,
      useOrientedBox,
    }),
    withOptions(resizeTransformer, {
      widthIncrement,
      heightIncrement,
    }),
    ...(adaptResize
      ? [
          withOptions(adaptResizeTransformer, {
            threshold: adaptResizeThreshold,
            margin: adaptResizeMargin,
            minComponentSize: adaptResizeMinComponentSize,
            maxComponentSize: adaptResizeMaxComponentSize,
            outlierPercentile: adaptResizeOutlierPercentile,
            morphologySize: adaptResizeMorphologySize,
            maxHorizontalExpansion: adaptResizeMaxHorizontalExpansion,
          }),
        ]
      : []),
    withOptions(roundTransformer, {
      precision,
    }),
    withOptions(sortTransformer, {
      horizontalSort: sortHorizontal as HorizontalSortOrder,
      verticalSort: sortVertical as VerticalSortOrder,
    }),
  ];

  const resolveInputImagePath = async (
    taskImagePath: string,
    taskFilePath: string,
  ) => {
    const fileDir = dirname(taskFilePath);

    // Check if it's a remote URL
    if (
      taskImagePath.startsWith('http://') ||
      taskImagePath.startsWith('https://')
    ) {
      // Extract filename from URL
      const urlPath = new URL(taskImagePath).pathname;
      const filename = basename(urlPath);
      const localPath = join(fileDir, filename);

      // Download the image
      await new Promise<void>((resolve, reject) => {
        get(taskImagePath, (response) => {
          const fileStream = createWriteStream(localPath);
          response.pipe(fileStream);
          fileStream.on('finish', () => {
            fileStream.close();
            resolve();
          });
          fileStream.on('error', reject);
        }).on('error', reject);
      });

      return localPath;
    }

    // Label Studio exports can have leading slash (/path)
    // Strip leading slashes to get relative path
    const normalizedImagePath = taskImagePath.replace(/^\/+/, '');
    const resolvedImagePath = join(fileDir, normalizedImagePath);
    return resolvedImagePath;
  };

  const resolveOutputImagePath = (
    taskImagePath: string,
    taskFilePath: string,
  ) => {
    const fileDir = dirname(taskFilePath);
    // taskImagePath is the full resolved path, extract just the filename
    const filename = taskImagePath.split('/').pop() || '';
    // For PPOCR output, we keep only the folder of the task file
    const resolvedPath = join(
      baseImageDir || '',
      fileDir.split('/').pop() || '',
      filename,
    );
    return resolvedPath;
  };

  const processor = new Processor({
    input: MinOCRLabelStudioInput,
    output: PPOCROutput,
    transformers: transformerParams,
  });

  return await Promise.all(
    inputTasks.map(async (task) => {
      const outputData = await processor.process({
        inputData: task,
        taskFilePath,
        resolveInputImagePath,
        resolveOutputImagePath,
      });
      return outputData;
    }),
  );
};
