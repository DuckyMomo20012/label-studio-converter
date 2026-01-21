import { dirname, join } from 'path';
import { type BaseEnhanceOptions } from '@/converters/config';
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
