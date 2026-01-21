import { dirname, join } from 'path';
import { type BaseEnhanceOptions } from '@/converters/config';
import {
  FullOCRLabelStudioOutput,
  type HorizontalSortOrder,
  MinOCRLabelStudioOutput,
  PPOCRInput,
  type PPOCRLabelTask,
  Processor,
  type ShapeNormalizeOption,
  type VerticalSortOrder,
  normalizeTransformer,
  resizeTransformer,
  roundTransformer,
  sortTransformer,
  withOptions,
} from '@/lib';

export type PPOCRToLabelStudioOptions = BaseEnhanceOptions & {
  baseServerUrl?: string;
  defaultLabelName?: string;
};

export const ppocrToFullLabelStudioConverters = async (
  inputTasks: PPOCRLabelTask[],
  taskFilePath: string,
  options: PPOCRToLabelStudioOptions,
) => {
  const {
    baseServerUrl,
    defaultLabelName,
    sortVertical,
    sortHorizontal,
    normalizeShape,
    widthIncrement,
    heightIncrement,
    precision,
  } = options;

  const transformerParams = [
    withOptions(normalizeTransformer, {
      normalizeShape: normalizeShape as ShapeNormalizeOption,
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

  const resolveOutputImagePath = (taskImagePath: string) => {
    // NOTE: Ensure baseServerUrl ends with a single slash, but keeps empty string
    // as is
    const newBaseServerUrl =
      baseServerUrl?.replace(/\/+$/, '') + (baseServerUrl === '' ? '' : '');

    // taskImagePath is already resolved to absolute path by resolveInputImagePath
    // Just prepend baseServerUrl if provided
    const resolvedPath = newBaseServerUrl
      ? encodeURI(`${newBaseServerUrl}${taskImagePath}`)
      : taskImagePath;

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
    sortVertical,
    sortHorizontal,
    normalizeShape,
    widthIncrement,
    heightIncrement,
    precision,
  } = options;

  const transformerParams = [
    withOptions(normalizeTransformer, {
      normalizeShape: normalizeShape as ShapeNormalizeOption,
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

  const resolveOutputImagePath = (taskImagePath: string) => {
    // NOTE: Ensure baseServerUrl ends with a single slash, but keeps empty string
    // as is
    const newBaseServerUrl =
      baseServerUrl?.replace(/\/+$/, '') + (baseServerUrl === '' ? '' : '');

    // taskImagePath is already resolved to absolute path by resolveInputImagePath
    // Just prepend baseServerUrl if provided
    const resolvedPath = newBaseServerUrl
      ? encodeURI(`${newBaseServerUrl}${taskImagePath}`)
      : taskImagePath;

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
