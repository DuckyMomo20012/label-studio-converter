import { basename, dirname, join } from 'path';
import { BaseCheckOptions, BaseEnhanceOptions } from '@/config';
import {
  type HorizontalSortOrder,
  PPOCRInput,
  type PPOCRLabelTask,
  PPOCROutput,
  Processor,
  type ShapeNormalizeOption,
  type VerticalSortOrder,
  adaptResizeTransformer,
  checkPointNum,
  normalizeTransformer,
  resizeTransformer,
  roundTransformer,
  sortTransformer,
  withOptions,
} from '@/lib';

export type EnhancePPOCROptions = BaseEnhanceOptions &
  BaseCheckOptions & {
    imageBaseDir?: string;
  };

export const enhancePPOCRConverters = async (
  inputTasks: PPOCRLabelTask[],
  taskFilePath: string,
  options: EnhancePPOCROptions,
) => {
  const {
    imageBaseDir: _imageBaseDir,
    sortVertical,
    sortHorizontal,
    normalizeShape,
    useOrientedBox,
    widthIncrement,
    heightIncrement,
    adaptResize,
    adaptResizeThreshold,
    adaptResizeMargin,
    adaptResizeMinComponentSize,
    adaptResizeMaxComponentSize,
    adaptResizeOutlierPercentile,
    adaptResizeMorphologySize,
    adaptResizeMaxHorizontalExpansion,
    adaptResizePaddingCheckWidth,
    adaptResizeMinPaddingBrightness,
    adaptResizeMinPaddingRatio,
    adaptResizeUseAdaptiveThreshold,
    adaptResizeAdaptiveBlockSize,
    precision,
    numPointCheck,
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
            paddingCheckWidth: adaptResizePaddingCheckWidth,
            minPaddingBrightness: adaptResizeMinPaddingBrightness,
            minPaddingRatio: adaptResizeMinPaddingRatio,
            useAdaptiveThreshold: adaptResizeUseAdaptiveThreshold,
            adaptiveBlockSize: adaptResizeAdaptiveBlockSize,
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
    withOptions(checkPointNum, { numPointCheck }),
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
    const fileDir = dirname(taskFilePath);
    // NOTE: For PPOCR output, we keep only the folder of the task file
    const resolvedPath = join(
      fileDir.split('/').pop() || '',
      basename(taskImagePath),
    );
    return resolvedPath;
  };

  const processor = new Processor({
    input: PPOCRInput,
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
