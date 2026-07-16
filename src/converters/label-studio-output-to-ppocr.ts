import type { BaseCheckOptions, OutputLabelStudioTask } from '@/lib'
import {
  checkPointNum,
  OutputLabelStudioInput,
  PPOCROutput,
  Processor,
  withOptions,
} from '@/lib'

export type OutputLabelStudioToPPOCRConverterOptions = BaseCheckOptions

export async function outputLabelStudioToPPOCRConverters(inputTasks: OutputLabelStudioTask[], taskFilePath: string, options: OutputLabelStudioToPPOCRConverterOptions) {
  const { numPointCheck, thresholdAreaCheck, noAnnoCheck } = options

  const processor = new Processor({
    input: OutputLabelStudioInput,
    output: PPOCROutput,
    transformers: [
      withOptions(checkPointNum, { numPointCheck, thresholdAreaCheck, noAnnoCheck }),
    ],
  })

  return Promise.all(
    inputTasks.map(async (task) => {
      const outputData = await processor.process({
        inputData: task,
        taskFilePath,
        resolveOutputImagePath: taskImagePath =>
          decodeURIComponent(taskImagePath),
      })
      return outputData
    }),
  )
}
