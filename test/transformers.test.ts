import { describe, expect, it } from 'vitest';
import {
  SHAPE_NORMALIZE_NONE,
  SHAPE_NORMALIZE_RECTANGLE,
  SORT_HORIZONTAL_LTR,
  SORT_HORIZONTAL_NONE,
  SORT_HORIZONTAL_RTL,
  SORT_VERTICAL_BOTTOM_TOP,
  SORT_VERTICAL_NONE,
  SORT_VERTICAL_TOP_BOTTOM,
  type UnifiedOCRBox,
  normalizeTransformer,
  resizeTransformer,
  roundTransformer,
  sortTransformer,
} from '../src/lib';

describe('Transformers', () => {
  describe('normalizeTransformer', () => {
    it('should normalize diamond shape to rectangle', async () => {
      const boxes: UnifiedOCRBox[] = [
        {
          points: [
            { x: 100, y: 50 },
            { x: 150, y: 100 },
            { x: 100, y: 150 },
            { x: 50, y: 100 },
          ],
          text: 'diamond',
        },
      ];

      const result = await normalizeTransformer(boxes, 'test.jpg', {
        normalizeShape: SHAPE_NORMALIZE_RECTANGLE,
      });

      expect(result).toHaveLength(1);
      const { points } = result[0]!;
      expect(points).toHaveLength(4);

      // Should be axis-aligned rectangle
      expect(points[0]!.x).toBe(points[3]!.x); // left side
      expect(points[1]!.x).toBe(points[2]!.x); // right side
      expect(points[0]!.y).toBe(points[1]!.y); // top side
      expect(points[2]!.y).toBe(points[3]!.y); // bottom side
    });

    it('should not modify shape when normalization is none', async () => {
      const boxes: UnifiedOCRBox[] = [
        {
          points: [
            { x: 100, y: 50 },
            { x: 150, y: 100 },
            { x: 100, y: 150 },
            { x: 50, y: 100 },
          ],
          text: 'diamond',
        },
      ];

      const original = [...boxes[0]!.points];
      const result = await normalizeTransformer(boxes, 'test.jpg', {
        normalizeShape: SHAPE_NORMALIZE_NONE,
      });

      expect(result[0]!.points).toEqual(original);
    });
  });

  describe('resizeTransformer', () => {
    it('should increase bounding box dimensions', async () => {
      const boxes: UnifiedOCRBox[] = [
        {
          points: [
            { x: 10, y: 10 },
            { x: 20, y: 10 },
            { x: 20, y: 20 },
            { x: 10, y: 20 },
          ],
          text: 'test',
        },
      ];

      const result = await resizeTransformer(boxes, 'test.jpg', {
        widthIncrement: 4,
        heightIncrement: 2,
      });

      const { points } = result[0]!;
      const minX = Math.min(...points.map((p) => p.x));
      const maxX = Math.max(...points.map((p) => p.x));
      const minY = Math.min(...points.map((p) => p.y));
      const maxY = Math.max(...points.map((p) => p.y));

      expect(maxX - minX).toBeCloseTo(14, 5); // 10 + 4
      expect(maxY - minY).toBeCloseTo(12, 5); // 10 + 2
    });

    it('should decrease dimensions with negative increments', async () => {
      const boxes: UnifiedOCRBox[] = [
        {
          points: [
            { x: 0, y: 0 },
            { x: 20, y: 0 },
            { x: 20, y: 20 },
            { x: 0, y: 20 },
          ],
          text: 'test',
        },
      ];

      const result = await resizeTransformer(boxes, 'test.jpg', {
        widthIncrement: -4,
        heightIncrement: -4,
      });

      const { points } = result[0]!;
      const minX = Math.min(...points.map((p) => p.x));
      const maxX = Math.max(...points.map((p) => p.x));
      const minY = Math.min(...points.map((p) => p.y));
      const maxY = Math.max(...points.map((p) => p.y));

      expect(maxX - minX).toBeCloseTo(16, 5); // 20 - 4
      expect(maxY - minY).toBeCloseTo(16, 5); // 20 - 4
    });

    it('should not resize when increments are 0', async () => {
      const boxes: UnifiedOCRBox[] = [
        {
          points: [
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 10, y: 10 },
            { x: 0, y: 10 },
          ],
          text: 'test',
        },
      ];

      const originalPoints = [...boxes[0]!.points];

      const result = await resizeTransformer(boxes, 'test.jpg', {
        widthIncrement: 0,
        heightIncrement: 0,
      });

      expect(result[0]!.points).toEqual(originalPoints);
    });
  });

  describe('roundTransformer', () => {
    it('should round coordinates to specified precision', async () => {
      const boxes: UnifiedOCRBox[] = [
        {
          points: [
            { x: 1.23456, y: 2.34567 },
            { x: 3.45678, y: 4.56789 },
          ],
          text: 'test',
        },
      ];

      const result = await roundTransformer(boxes, 'test.jpg', {
        precision: 2,
      });

      expect(result[0]!.points[0]!.x).toBe(1.23);
      expect(result[0]!.points[0]!.y).toBe(2.35);
      expect(result[0]!.points[1]!.x).toBe(3.46);
      expect(result[0]!.points[1]!.y).toBe(4.57);
    });

    it('should not round when precision is -1', async () => {
      const boxes: UnifiedOCRBox[] = [
        {
          points: [
            { x: 1.23456, y: 2.34567 },
            { x: 3.45678, y: 4.56789 },
          ],
          text: 'test',
        },
      ];

      const originalPoints = [...boxes[0]!.points];

      const result = await roundTransformer(boxes, 'test.jpg', {
        precision: -1,
      });

      expect(result[0]!.points).toEqual(originalPoints);
    });
  });

  describe('sortTransformer', () => {
    it('should not sort when both are none', async () => {
      const boxes: UnifiedOCRBox[] = [
        { points: [{ x: 50, y: 50 }], text: 'bottom-right' },
        { points: [{ x: 0, y: 0 }], text: 'top-left' },
        { points: [{ x: 0, y: 50 }], text: 'bottom-left' },
        { points: [{ x: 50, y: 0 }], text: 'top-right' },
      ];

      const result = await sortTransformer(boxes, 'test.jpg', {
        verticalSort: SORT_VERTICAL_NONE,
        horizontalSort: SORT_HORIZONTAL_NONE,
      });

      expect(result.map((b) => b.text)).toEqual([
        'bottom-right',
        'top-left',
        'bottom-left',
        'top-right',
      ]);
    });

    it('should sort top-to-bottom', async () => {
      const boxes: UnifiedOCRBox[] = [
        { points: [{ x: 0, y: 50 }], text: 'bottom' },
        { points: [{ x: 0, y: 0 }], text: 'top' },
        { points: [{ x: 0, y: 25 }], text: 'middle' },
      ];

      const result = await sortTransformer(boxes, 'test.jpg', {
        verticalSort: SORT_VERTICAL_TOP_BOTTOM,
        horizontalSort: SORT_HORIZONTAL_NONE,
      });

      expect(result.map((b) => b.text)).toEqual(['top', 'middle', 'bottom']);
    });

    it('should sort bottom-to-top', async () => {
      const boxes: UnifiedOCRBox[] = [
        { points: [{ x: 0, y: 0 }], text: 'top' },
        { points: [{ x: 0, y: 50 }], text: 'bottom' },
        { points: [{ x: 0, y: 25 }], text: 'middle' },
      ];

      const result = await sortTransformer(boxes, 'test.jpg', {
        verticalSort: SORT_VERTICAL_BOTTOM_TOP,
        horizontalSort: SORT_HORIZONTAL_NONE,
      });

      expect(result.map((b) => b.text)).toEqual(['bottom', 'middle', 'top']);
    });

    it('should sort left-to-right when horizontal', async () => {
      const boxes: UnifiedOCRBox[] = [
        { points: [{ x: 50, y: 0 }], text: 'right' },
        { points: [{ x: 0, y: 0 }], text: 'left' },
        { points: [{ x: 25, y: 0 }], text: 'middle' },
      ];

      const result = await sortTransformer(boxes, 'test.jpg', {
        verticalSort: SORT_VERTICAL_NONE,
        horizontalSort: SORT_HORIZONTAL_LTR,
      });

      expect(result.map((b) => b.text)).toEqual(['left', 'middle', 'right']);
    });

    it('should sort right-to-left when horizontal', async () => {
      const boxes: UnifiedOCRBox[] = [
        { points: [{ x: 0, y: 0 }], text: 'left' },
        { points: [{ x: 50, y: 0 }], text: 'right' },
        { points: [{ x: 25, y: 0 }], text: 'middle' },
      ];

      const result = await sortTransformer(boxes, 'test.jpg', {
        verticalSort: SORT_VERTICAL_NONE,
        horizontalSort: SORT_HORIZONTAL_RTL,
      });

      expect(result.map((b) => b.text)).toEqual(['right', 'middle', 'left']);
    });

    it('should combine vertical and horizontal sorting', async () => {
      const boxes: UnifiedOCRBox[] = [
        { points: [{ x: 50, y: 50 }], text: 'bottom-right' },
        { points: [{ x: 0, y: 0 }], text: 'top-left' },
        { points: [{ x: 0, y: 50 }], text: 'bottom-left' },
        { points: [{ x: 50, y: 0 }], text: 'top-right' },
      ];

      const result = await sortTransformer(boxes, 'test.jpg', {
        verticalSort: SORT_VERTICAL_TOP_BOTTOM,
        horizontalSort: SORT_HORIZONTAL_LTR,
      });

      expect(result.map((b) => b.text)).toEqual([
        'top-left',
        'top-right',
        'bottom-left',
        'bottom-right',
      ]);
    });
  });
});
