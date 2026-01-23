import { describe, expect, it } from 'vitest';
import { type UnifiedOCRBox, adaptResizeTransformer } from '../src/lib';

describe('Adaptive Resize Transformer', () => {
  const sampleBox: UnifiedOCRBox = {
    points: [
      { x: 100, y: 100 },
      { x: 200, y: 100 },
      { x: 200, y: 150 },
      { x: 100, y: 150 },
    ],
    text: 'Test',
  };

  it('should return original points when image does not exist', async () => {
    const boxes = [sampleBox];
    const result = await adaptResizeTransformer(
      boxes,
      'test/fixtures/nonexistent.jpg',
      { threshold: 128, margin: 5 },
    );

    expect(result).toHaveLength(1);
    expect(result[0]?.points).toEqual(sampleBox.points);
  });

  it('should process box with real image', async () => {
    const boxes = [sampleBox];
    const result = await adaptResizeTransformer(
      boxes,
      'test/fixtures/example.jpg',
      { threshold: 128, margin: 5 },
    );

    expect(result).toHaveLength(1);
    expect(result[0]?.points).toHaveLength(4);
    expect(result[0]?.text).toBe('Test');
  });

  it('should handle empty boxes array', async () => {
    const boxes: UnifiedOCRBox[] = [];
    const result = await adaptResizeTransformer(
      boxes,
      'test/fixtures/example.jpg',
      { threshold: 128, margin: 5 },
    );

    expect(result).toHaveLength(0);
  });

  it('should use default options when not provided', async () => {
    const boxes = [sampleBox];
    const result = await adaptResizeTransformer(
      boxes,
      'test/fixtures/example.jpg',
      {},
    );

    expect(result).toHaveLength(1);
    expect(result[0]?.points).toHaveLength(4);
  });

  it('should process multiple boxes', async () => {
    const boxes: UnifiedOCRBox[] = [
      {
        points: [
          { x: 50, y: 50 },
          { x: 150, y: 50 },
          { x: 150, y: 100 },
          { x: 50, y: 100 },
        ],
        text: 'First',
      },
      {
        points: [
          { x: 200, y: 200 },
          { x: 300, y: 200 },
          { x: 300, y: 250 },
          { x: 200, y: 250 },
        ],
        text: 'Second',
      },
    ];

    const result = await adaptResizeTransformer(
      boxes,
      'test/fixtures/example.jpg',
      { threshold: 128, margin: 5 },
    );

    expect(result).toHaveLength(2);
    expect(result[0]?.text).toBe('First');
    expect(result[1]?.text).toBe('Second');
  });

  it('should handle different threshold values', async () => {
    const boxes = [sampleBox];
    const result = await adaptResizeTransformer(
      boxes,
      'test/fixtures/example.jpg',
      { threshold: 100, margin: 5 },
    );

    expect(result).toHaveLength(1);
    expect(result[0]?.points).toHaveLength(4);
  });

  it('should handle different margin values', async () => {
    const boxes = [sampleBox];
    const result = await adaptResizeTransformer(
      boxes,
      'test/fixtures/example.jpg',
      { threshold: 128, margin: 10 },
    );

    expect(result).toHaveLength(1);
    expect(result[0]?.points).toHaveLength(4);
  });
});
