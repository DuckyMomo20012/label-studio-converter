import { basename, dirname, join, relative, resolve } from 'path';
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
  copyImages?: boolean;
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
    copyImages = false,
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
    let resolvedPath: string;

    // Compute relative path from output JSON location to image
    if (outDir) {
      // Output JSON will be in outDir (already includes full path with subdirectories)
      const outputJsonDir = resolve(outDir);

      if (copyImages) {
        // Images were copied to the same directory as the JSON
        // So just use the filename
        const fileName = basename(taskImagePath);
        resolvedPath = fileName;
      } else {
        // Images are in their original location
        // Compute relative path from JSON location to image
        const absoluteImagePath = resolve(process.cwd(), taskImagePath);
        resolvedPath = relative(outputJsonDir, absoluteImagePath);
      }
    } else {
      // Output JSON will be in same directory as task file
      const taskDir = dirname(taskFilePath);
      resolvedPath = relative(taskDir, taskImagePath);
    }

    // Handle baseServerUrl:
    // - If baseServerUrl is provided and non-empty: prepend it (e.g., "http://localhost:8081/path/to/image.jpg")
    // - If baseServerUrl is empty string: output absolute path with leading slash (e.g., "/path/to/image.jpg") for Docker mount
    // - If baseServerUrl is undefined: use relative path as-is
    if (baseServerUrl !== undefined) {
      if (baseServerUrl === '') {
        // Empty baseServerUrl means Docker mount - output absolute path with leading slash
        return encodeURI(`/${resolvedPath}`);
      } else {
        // Non-empty baseServerUrl - prepend it
        const normalizedBaseUrl = baseServerUrl.replace(/\/+$/, '');
        return encodeURI(`${normalizedBaseUrl}/${resolvedPath}`);
      }
    }

    // No baseServerUrl provided - return relative path
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
    copyImages = false,
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
    let resolvedPath: string;

    // Compute relative path from output JSON location to image
    if (outDir) {
      // Output JSON will be in outDir (already includes full path with subdirectories)
      const outputJsonDir = resolve(outDir);

      if (copyImages) {
        // Images were copied to the same directory as the JSON
        // So just use the filename
        const fileName = basename(taskImagePath);
        resolvedPath = fileName;
      } else {
        // Images are in their original location
        // Compute relative path from JSON location to image
        const absoluteImagePath = resolve(process.cwd(), taskImagePath);
        resolvedPath = relative(outputJsonDir, absoluteImagePath);
      }
    } else {
      // Output JSON will be in same directory as task file
      const taskDir = dirname(taskFilePath);
      resolvedPath = relative(taskDir, taskImagePath);
    }

    // Handle baseServerUrl:
    // - If baseServerUrl is provided and non-empty: prepend it (e.g., "http://localhost:8081/path/to/image.jpg")
    // - If baseServerUrl is empty string: output absolute path with leading slash (e.g., "/path/to/image.jpg") for Docker mount
    // - If baseServerUrl is undefined: use relative path as-is
    if (baseServerUrl !== undefined) {
      if (baseServerUrl === '') {
        // Empty baseServerUrl means Docker mount - output absolute path with leading slash
        return encodeURI(`/${resolvedPath}`);
      } else {
        // Non-empty baseServerUrl - prepend it
        const normalizedBaseUrl = baseServerUrl.replace(/\/+$/, '');
        return encodeURI(`${normalizedBaseUrl}/${resolvedPath}`);
      }
    }

    // No baseServerUrl provided - return relative path
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
