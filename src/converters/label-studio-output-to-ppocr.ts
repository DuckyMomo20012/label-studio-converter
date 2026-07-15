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
  const { numPointCheck, thresholdAreaCheck } = options;

  const processor = new Processor({
    input: OutputLabelStudioInput,
    output: PPOCROutput,
    transformers: [
      withOptions(checkPointNum, { numPointCheck, thresholdAreaCheck }),
    ],
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
