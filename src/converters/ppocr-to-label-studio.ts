import { basename, dirname, join, relative } from 'path';
import { type BaseEnhanceOptions } from '@/config';
import { IMAGE_BASE_DIR_INPUT_DIR } from '@/constants';
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
  outputMode?: string;
  outDir?: string;
  copyImages?: boolean;
  imageBaseDir?: string;
  inputBaseDir?: string;
  outputRootDir?: string;
};

export const ppocrToFullLabelStudioConverters = async (
  inputTasks: PPOCRLabelTask[],
  taskFilePath: string,
  options: PPOCRToLabelStudioOptions,
) => {
  const {
    baseServerUrl,
    defaultLabelName,
    outputMode,
    outDir: _outDir, // Keep for potential future use
    copyImages: _copyImages = false, // Keep for potential future use
    imageBaseDir,
    inputBaseDir,
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
    adaptResizePaddingCheckWidth,
    adaptResizeMinPaddingBrightness,
    adaptResizeMinPaddingRatio,
    adaptResizeUseAdaptiveThreshold,
    adaptResizeAdaptiveBlockSize,
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
    _taskFilePath: string,
  ) => {
    // Determine the relative path based on imageBaseDir mode
    // This is the path that will be written in the JSON file
    const relativePath =
      imageBaseDir === IMAGE_BASE_DIR_INPUT_DIR && inputBaseDir
        ? relative(inputBaseDir, taskImagePath) // input-dir: path from inputBaseDir
        : basename(taskImagePath); // task-file: filename only

    // The path in JSON is always just relativePath (not prepended with outDir)
    // because outDir affects where the JSON+images are written, not the path IN the JSON
    const resolvedPath = relativePath;

    // Handle baseServerUrl:
    // - Empty string: absolute path with leading slash for Docker mount
    // - Non-empty: prepend base URL
    // - Undefined: return path as-is
    if (baseServerUrl !== undefined) {
      if (baseServerUrl === '') {
        return encodeURI(`/${resolvedPath}`);
      }
      const normalizedBaseUrl = baseServerUrl.replace(/\/+$/, '');
      return encodeURI(`${normalizedBaseUrl}/${resolvedPath}`);
    }

    return resolvedPath;
  };

  const processor = new Processor({
    input: PPOCRInput,
    output: withOptions(FullOCRLabelStudioOutput, {
      defaultLabelName,
      outputMode,
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
    outDir: _outDir, // Keep for potential future use
    copyImages: _copyImages = false, // Keep for potential future use
    imageBaseDir,
    inputBaseDir,
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
    _taskFilePath: string,
  ) => {
    // Determine the relative path based on imageBaseDir mode
    // This is the path that will be written in the JSON file
    const relativePath =
      imageBaseDir === IMAGE_BASE_DIR_INPUT_DIR && inputBaseDir
        ? relative(inputBaseDir, taskImagePath) // input-dir: path from inputBaseDir
        : basename(taskImagePath); // task-file: filename only

    // The path in JSON is always just relativePath (not prepended with outDir)
    // because outDir affects where the JSON+images are written, not the path IN the JSON
    const resolvedPath = relativePath;

    // Handle baseServerUrl:
    // - Empty string: absolute path with leading slash for Docker mount
    // - Non-empty: prepend base URL
    // - Undefined: return path as-is
    if (baseServerUrl !== undefined) {
      if (baseServerUrl === '') {
        return encodeURI(`/${resolvedPath}`);
      }
      const normalizedBaseUrl = baseServerUrl.replace(/\/+$/, '');
      return encodeURI(`${normalizedBaseUrl}/${resolvedPath}`);
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
