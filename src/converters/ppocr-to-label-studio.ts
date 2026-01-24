import { dirname, join, relative } from 'path';
import { type BaseEnhanceOptions } from '@/config';
import {
  FullOCRLabelStudioOutput,
  type HorizontalSortOrder,
  MinOCRLabelStudioOutput,
  PPOCRInput,
  type PPOCRLabelTask,
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

export type PPOCRToLabelStudioOptions = BaseEnhanceOptions & {
  baseServerUrl?: string;
  defaultLabelName?: string;
  outDir?: string;
};

export const ppocrToFullLabelStudioConverters = async (
  inputTasks: PPOCRLabelTask[],
  taskFilePath: string,
  options: PPOCRToLabelStudioOptions,
) => {
  const {
    baseServerUrl,
    defaultLabelName,
    outDir,
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

  const resolveInputImagePath = (
    taskImagePath: string,
    taskFilePath: string,
  ) => {
    // PPOCRLabel stores paths relative to the opened folder
    // e.g., opening "fixtures/" creates Label.txt with "fixtures/example.jpg"
    // If the image path starts with the task directory name, resolve from parent
    const fileDir = dirname(taskFilePath);
    const folderName = fileDir.split('/').pop() || '';

    if (taskImagePath.startsWith(folderName + '/')) {
      // Path includes folder name, resolve from parent
      const parentDir = dirname(fileDir);
      return join(parentDir, taskImagePath);
    } else {
      // Path is relative to task file location
      return join(fileDir, taskImagePath);
    }
  };

  const resolveOutputImagePath = (
    taskImagePath: string,
    taskFilePath: string,
  ) => {
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
    input: PPOCRInput,
    output: withOptions(FullOCRLabelStudioOutput, {
      defaultLabelName,
    }),
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

export const ppocrToMinLabelStudioConverters = async (
  inputTasks: PPOCRLabelTask[],
  taskFilePath: string,
  options: PPOCRToLabelStudioOptions,
) => {
  const {
    baseServerUrl,
    defaultLabelName,
    outDir,
    sortVertical,
    sortHorizontal,
    normalizeShape,
    useOrientedBox,
    widthIncrement,
    heightIncrement,
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
    withOptions(roundTransformer, {
      precision,
    }),
    withOptions(sortTransformer, {
      horizontalSort: sortHorizontal as HorizontalSortOrder,
      verticalSort: sortVertical as VerticalSortOrder,
    }),
  ];

  const resolveInputImagePath = (
    taskImagePath: string,
    taskFilePath: string,
  ) => {
    // PPOCRLabel stores paths relative to the opened folder
    const fileDir = dirname(taskFilePath);
    const folderName = fileDir.split('/').pop() || '';

    if (taskImagePath.startsWith(folderName + '/')) {
      // Path includes folder name, resolve from parent
      const parentDir = dirname(fileDir);
      return join(parentDir, taskImagePath);
    } else {
      // Path is relative to task file location
      return join(fileDir, taskImagePath);
    }
  };

  const resolveOutputImagePath = (
    taskImagePath: string,
    taskFilePath: string,
  ) => {
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
    input: PPOCRInput,
    output: withOptions(MinOCRLabelStudioOutput, {
      defaultLabelName,
      minified: true,
    }),
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
