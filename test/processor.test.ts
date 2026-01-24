import { describe, expect, it } from 'vitest';
import {
  Processor,
  type UnifiedOCRBox,
  type UnifiedOCRTask,
  roundTransformer,
  withOptions,
} from '../src/lib';

describe('Processor', () => {
  // Simple mock input processor
  const mockInput = async (
    data: { text: string; x: number; y: number },
    resolvePath: (path: string) => string | Promise<string>,
  ): Promise<UnifiedOCRTask> => {
    return {
      id: 'test-1',
      imagePath: await resolvePath('test.jpg'),
      width: 100,
      height: 100,
      boxes: [
        {
          points: [
            { x: data.x, y: data.y },
            { x: data.x + 10.123, y: data.y },
            { x: data.x + 10.123, y: data.y + 10.456 },
            { x: data.x, y: data.y + 10.456 },
          ],
          text: data.text,
        },
      ],
    };
  };

  // Simple mock output processor
  const mockOutput = async (
    task: UnifiedOCRTask,
    resolvePath: (path: string) => string | Promise<string>,
  ) => {
    return {
      image: await resolvePath(task.imagePath),
      annotations: task.boxes.map((b) => ({
        text: b.text,
        points: b.points,
      })),
    };
  };

  it('should process data through input, transformers, and output', async () => {
    const processor = new Processor({
      input: mockInput,
      output: mockOutput,
      transformers: [
        withOptions(roundTransformer, {
          precision: 1,
        }),
      ],
    });

    const result = await processor.process({
      inputData: { text: 'Hello', x: 5.678, y: 10.234 },
      taskFilePath: '/path/to/task.json',
      resolveInputImagePath: (imagePath) => `/input/${imagePath}`,
      resolveOutputImagePath: (imagePath) => `/output/${imagePath}`,
    });

    expect(result).toEqual({
      image: '/output//input/test.jpg',
      annotations: [
        {
          text: 'Hello',
          points: [
            { x: 5.7, y: 10.2 },
            { x: 15.8, y: 10.2 },
            { x: 15.8, y: 20.7 },
            { x: 5.7, y: 20.7 },
          ],
        },
      ],
    });
  });

  it('should work without transformers', async () => {
    const processor = new Processor({
      input: mockInput,
      output: mockOutput,
    });

    const result = await processor.process({
      inputData: { text: 'Test', x: 0, y: 0 },
      taskFilePath: '/task.json',
      resolveInputImagePath: (imagePath) => `/input/${imagePath}`,
      resolveOutputImagePath: (imagePath) => `/output/${imagePath}`,
    });

    expect(result.annotations[0]!.text).toBe('Test');
    expect(result.annotations[0]!.points[0]).toEqual({ x: 0, y: 0 });
  });

  it('should apply multiple transformers in sequence', async () => {
    // Mock transformer that doubles coordinates
    const doubleTransformer = async (
      boxes: UnifiedOCRBox[],
    ): Promise<UnifiedOCRBox[]> => {
      return boxes.map((box) => ({
        ...box,
        points: box.points.map((p) => ({ x: p.x * 2, y: p.y * 2 })),
      }));
    };

    // Mock transformer that adds 10 to coordinates
    const addTenTransformer = async (
      boxes: UnifiedOCRBox[],
    ): Promise<UnifiedOCRBox[]> => {
      return boxes.map((box) => ({
        ...box,
        points: box.points.map((p) => ({ x: p.x + 10, y: p.y + 10 })),
      }));
    };

    const processor = new Processor({
      input: mockInput,
      output: mockOutput,
      transformers: [
        doubleTransformer,
        addTenTransformer,
        withOptions(roundTransformer, { precision: 0 }),
      ],
    });

    const result = await processor.process({
      inputData: { text: 'Transform', x: 5, y: 5 },
      taskFilePath: '/task.json',
      resolveInputImagePath: (imagePath) => imagePath,
      resolveOutputImagePath: (imagePath) => imagePath,
    });

    // Original: (5, 5)
    // After double: (10, 10)
    // After add 10: (20, 20)
    // After round(0): (20, 20)
    expect(result.annotations[0]!.points[0]).toEqual({ x: 20, y: 20 });
  });

  it('should handle empty boxes array', async () => {
    const emptyInput = async (): Promise<UnifiedOCRTask> => {
      return {
        id: 'empty',
        imagePath: 'empty.jpg',
        width: 100,
        height: 100,
        boxes: [],
      };
    };

    const processor = new Processor({
      input: emptyInput,
      output: mockOutput,
    });

    const result = await processor.process({
      inputData: {},
      taskFilePath: '/task.json',
      resolveInputImagePath: (imagePath) => imagePath,
      resolveOutputImagePath: (imagePath) => imagePath,
    });

    expect(result.annotations).toHaveLength(0);
  });
});
