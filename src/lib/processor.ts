import { type UnifiedOCRBox, type UnifiedOCRTask } from '@/lib/unified';

export type Transformer<TOptions = undefined> = (
  boxes: UnifiedOCRBox[],
  imageFilePath: string,
  options: TOptions,
) => Promise<UnifiedOCRBox[]>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TransformerEntry = Transformer<any> | [Transformer<any>, any];

export type ResolveImagePathFn = (
  taskImagePath: string,
  taskFilePath: string,
) => string;

export type ProcessorInput<TInput, TOptions = undefined> = (
  inputTask: TInput,
  resolveImagePath: (taskImagePath: string) => string,
  options: TOptions,
) => Promise<UnifiedOCRTask>;

export type ProcessorInputEntry<TInput> =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ProcessorInput<TInput, any> | [ProcessorInput<TInput, any>, any];

export type ProcessorOutput<TOutput, TOptions = undefined> = (
  outputTask: UnifiedOCRTask,
  resolveImagePath: (taskImagePath: string) => string,
  options: TOptions,
) => Promise<TOutput>;

export type ProcessorOutputEntry<TOutput> =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ProcessorOutput<TOutput, any> | [ProcessorOutput<TOutput, any>, any];

export type ProcessorOptions<TInput, TOutput> = {
  input: ProcessorInputEntry<TInput>;
  output: ProcessorOutputEntry<TOutput>;
  transformers?: TransformerEntry[];
};

export function withOptions<
  TOptions,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TFn extends (...args: any[]) => any,
>(fn: TFn, options: TOptions): [TFn, TOptions] {
  return [fn, options];
}

class Processor<TInput, TOutput> {
  input: ProcessorInputEntry<TInput>;
  output: ProcessorOutputEntry<TOutput>;
  transformers: TransformerEntry[];

  constructor({
    input,
    output,
    transformers = [],
  }: ProcessorOptions<TInput, TOutput>) {
    this.input = input;
    this.output = output;
    this.transformers = transformers;
  }

  async process({
    inputData,
    taskFilePath,
    resolveInputImagePath,
    resolveOutputImagePath,
  }: {
    inputData: TInput;
    taskFilePath: string;
    resolveInputImagePath: ResolveImagePathFn;
    resolveOutputImagePath: ResolveImagePathFn;
  }): Promise<TOutput> {
    const [inputFn, inputOptions] = Array.isArray(this.input)
      ? this.input
      : [this.input, undefined];

    const [outputFn, outputOptions] = Array.isArray(this.output)
      ? this.output
      : [this.output, undefined];

    // Step 1: Read input data and convert to UnifiedOCRTask
    let ocrTask = await inputFn(
      inputData,
      (taskImagePath) => {
        return resolveInputImagePath(taskImagePath, taskFilePath);
      },
      inputOptions,
    );

    // Step 2: Apply transformers sequentially
    for await (const entry of this.transformers) {
      let transformedBoxes: UnifiedOCRBox[];

      const [transformer, options] = Array.isArray(entry)
        ? entry
        : [entry, undefined];
      transformedBoxes = await transformer(
        ocrTask.boxes,
        ocrTask.imagePath,
        options,
      );

      ocrTask = { ...ocrTask, boxes: transformedBoxes };
    }

    // Step 3: Convert UnifiedOCRTask to output format
    const outputData = await outputFn(
      ocrTask,
      (taskImagePath) => {
        return resolveOutputImagePath(taskImagePath, taskFilePath);
      },
      outputOptions,
    );
    return outputData;
  }
}

export { Processor };
