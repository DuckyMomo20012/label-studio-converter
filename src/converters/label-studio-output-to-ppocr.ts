import {
  OutputLabelStudioInput,
  type OutputLabelStudioTask,
  PPOCROutput,
  Processor,
} from '@/lib';

export const outputLabelStudioToPPOCRConverters = async (
  inputTasks: OutputLabelStudioTask[],
  taskFilePath: string,
) => {
  const processor = new Processor({
    input: OutputLabelStudioInput,
    output: PPOCROutput,
  });

  return await Promise.all(
    inputTasks.map(async (task) => {
      const outputData = await processor.process({
        inputData: task,
        taskFilePath,
        resolveOutputImagePath: (taskImagePath) => decodeURI(taskImagePath),
      });
      return outputData;
    }),
  );
};
