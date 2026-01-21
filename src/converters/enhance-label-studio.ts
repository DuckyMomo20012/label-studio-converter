import { dirname, join } from 'path';
import { BaseEnhanceOptions } from '@/converters/config';
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
  normalizeTransformer,
  resizeTransformer,
  roundTransformer,
  sortTransformer,
  withOptions,
} from '@/lib';

export const enhanceFullLabelStudioConverters = async (
  inputTasks: LabelStudioTask[],
  taskFilePath: string,
  options: BaseEnhanceOptions,
) => {
  const {
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
    const fileDir = dirname(taskFilePath);
    // Remove leading slash to ensure relative path resolution
    const normalizedImagePath = taskImagePath.replace(/^\/+/, '');
    const resolvedImagePath = join(fileDir, normalizedImagePath);
    return resolvedImagePath;
  };

  const resolveOutputImagePath = (
    taskImagePath: string,
    taskFilePath: string,
  ) => {
    const fileDir = dirname(taskFilePath);
    const resolvedPath = join(fileDir, taskImagePath);
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
  options: BaseEnhanceOptions,
) => {
  const {
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
    const fileDir = dirname(taskFilePath);
    const resolvedPath = join(fileDir, taskImagePath);
    return resolvedPath;
  };

  const resolveOutputImagePath = (
    taskImagePath: string,
    taskFilePath: string,
  ) => {
    const fileDir = dirname(taskFilePath);
    const resolvedPath = join(fileDir, taskImagePath);
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
