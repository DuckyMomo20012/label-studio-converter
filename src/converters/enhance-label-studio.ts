import { createWriteStream } from 'fs';
import { get } from 'https';
import { basename, dirname, join, relative } from 'path';
import { BaseEnhanceOptions } from '@/config';
import {
  FullOCRLabelStudioInput,
  FullOCRLabelStudioOutput,
  type HorizontalSortOrder,
  type LabelStudioTask,
  type LabelStudioTaskMin,
  MinOCRLabelStudioInput,
  MinOCRLabelStudioOutput,
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

export type EnhanceLabelStudioOptions = BaseEnhanceOptions & {
  baseServerUrl?: string;
  outDir?: string;
  imageBaseDir?: string;
};

export const enhanceFullLabelStudioConverters = async (
  inputTasks: LabelStudioTask[],
  taskFilePath: string,
  options: EnhanceLabelStudioOptions,
) => {
  const {
    baseServerUrl,
    outDir,
    imageBaseDir: _imageBaseDir,
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
    const cleanPath = taskImagePath.replace(/^\/+/, '');
    return join(fileDir, cleanPath);
  };

  const resolveOutputImagePath = (
    taskImagePath: string,
    taskFilePath: string,
  ) => {
    // taskImagePath is absolute path to image file
    let resolvedPath = taskImagePath;

    // If outDir is specified, compute relative path from output location to image
    if (outDir) {
      const relativePath = relative(process.cwd(), taskFilePath);
      const relativeDir = dirname(relativePath);
      const outputSubDir = join(outDir, relativeDir);
      resolvedPath = relative(outputSubDir, taskImagePath);
    }

    // Then prepend baseServerUrl if provided
    const newBaseServerUrl =
      baseServerUrl?.replace(/\/+$/, '') + (baseServerUrl === '' ? '' : '');
    if (newBaseServerUrl) {
      return encodeURI(`${newBaseServerUrl}/${resolvedPath}`);
    }

    return resolvedPath;
  };

  const processor = new Processor({
    input: FullOCRLabelStudioInput,
    output: FullOCRLabelStudioOutput,
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

export const enhanceMinLabelStudioConverters = async (
  inputTasks: LabelStudioTaskMin[],
  taskFilePath: string,
  options: EnhanceLabelStudioOptions,
) => {
  const {
    baseServerUrl,
    outDir,
    imageBaseDir: _imageBaseDir,
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
    const cleanPath = taskImagePath.replace(/^\/+/, '');
    return join(fileDir, cleanPath);
  };

  const resolveOutputImagePath = (
    taskImagePath: string,
    taskFilePath: string,
  ) => {
    // taskImagePath is absolute path to image file
    let resolvedPath = taskImagePath;

    // If outDir is specified, compute relative path from output location to image
    if (outDir) {
      const relativePath = relative(process.cwd(), taskFilePath);
      const relativeDir = dirname(relativePath);
      const outputSubDir = join(outDir, relativeDir);
      resolvedPath = relative(outputSubDir, taskImagePath);
    }

    // Then prepend baseServerUrl if provided
    const newBaseServerUrl =
      baseServerUrl?.replace(/\/+$/, '') + (baseServerUrl === '' ? '' : '');
    if (newBaseServerUrl) {
      return encodeURI(`${newBaseServerUrl}/${resolvedPath}`);
    }

    return resolvedPath;
  };

  const processor = new Processor({
    input: MinOCRLabelStudioInput,
    output: MinOCRLabelStudioOutput,
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
