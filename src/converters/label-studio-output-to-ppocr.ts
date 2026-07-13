import {
  type BaseCheckOptions,
  OutputLabelStudioInput,
  type OutputLabelStudioTask,
  PPOCROutput,
  Processor,
  checkPointNum,
  withOptions,
} from '@/lib';

export type OutputLabelStudioToPPOCRConverterOptions = BaseCheckOptions;

export const outputLabelStudioToPPOCRConverters = async (
  inputTasks: OutputLabelStudioTask[],
  taskFilePath: string,
  options: OutputLabelStudioToPPOCRConverterOptions,
) => {
  const { numPointCheck } = options;

  const processor = new Processor({
    input: OutputLabelStudioInput,
    output: PPOCROutput,
    transformers: [withOptions(checkPointNum, { numPointCheck })],
  });

  return await Promise.all(
    inputTasks.map(async (task) => {
      const outputData = await processor.process({
        inputData: task,
        taskFilePath,
        resolveOutputImagePath: (taskImagePath) =>
          decodeURIComponent(taskImagePath),
      });
      return outputData;
    }),
  );
};
