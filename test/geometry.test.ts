import { describe, expect, it } from 'vitest';
import {
  type Point,
  calculateCenter,
  getMinimumBoundingRect,
  normalizeShape,
  resizeBoundingBox,
  transformPoints,
} from '../src/lib/geometry';

describe('Geometry utilities', () => {
  describe('calculateCenter', () => {
    it('should calculate the center of a polygon', () => {
      const points: Point[] = [
        [0, 0],
        [10, 0],
        [10, 10],
        [0, 10],
      ];
      const center = calculateCenter(points);
      expect(center).toEqual([5, 5]);
    });
  });

  describe('getMinimumBoundingRect', () => {
    it('should calculate the bounding rectangle', () => {
      const points: Point[] = [
        [5, 5],
        [15, 10],
        [10, 20],
        [0, 15],
      ];
      const bbox = getMinimumBoundingRect(points);
      expect(bbox).toEqual({
        minX: 0,
        minY: 5,
        maxX: 15,
        maxY: 20,
        width: 15,
        height: 15,
      });
    });
  });

  describe('normalizeShape', () => {
    it('should convert diamond to rectangle', () => {
      const diamond: Point[] = [
        [1406, 767],
        [1455, 223],
        [1453, 853],
        [1404, 1396],
      ];
      const rect = normalizeShape(diamond);

      // Should be a rectangle with 4 corners
      expect(rect).toHaveLength(4);

      // Check that it's axis-aligned (x or y should match for adjacent corners)
      expect(rect[0]![0]).toBe(rect[3]![0]); // left side
      expect(rect[1]![0]).toBe(rect[2]![0]); // right side
      expect(rect[0]![1]).toBe(rect[1]![1]); // top side
      expect(rect[2]![1]).toBe(rect[3]![1]); // bottom side
    });

    it('should handle polygons with less than 3 points', () => {
      const points: Point[] = [
        [0, 0],
        [10, 10],
      ];
      const result = normalizeShape(points);
      expect(result).toEqual(points);
    });
  });

  describe('resizeBoundingBox', () => {
    it('should increase width and height while keeping center', () => {
      const points: Point[] = [
        [0, 0],
        [10, 0],
        [10, 10],
        [0, 10],
      ];

      const resized = resizeBoundingBox(points, 4, 4);
      const originalCenter = calculateCenter(points);
      const newCenter = calculateCenter(resized);

      // Center should remain the same
      expect(newCenter[0]).toBeCloseTo(originalCenter[0], 5);
      expect(newCenter[1]).toBeCloseTo(originalCenter[1], 5);

      // Check that dimensions increased
      const originalBbox = getMinimumBoundingRect(points);
      const newBbox = getMinimumBoundingRect(resized);

      expect(newBbox.width).toBeCloseTo(originalBbox.width + 4, 5);
      expect(newBbox.height).toBeCloseTo(originalBbox.height + 4, 5);
    });

    it('should decrease dimensions with negative increments', () => {
      const points: Point[] = [
        [0, 0],
        [10, 0],
        [10, 10],
        [0, 10],
      ];

      const resized = resizeBoundingBox(points, -2, -2);
      const bbox = getMinimumBoundingRect(resized);

      expect(bbox.width).toBeCloseTo(8, 5);
      expect(bbox.height).toBeCloseTo(8, 5);
    });
  });

  describe('transformPoints', () => {
    it('should apply shape normalization only', () => {
      const diamond: Point[] = [
        [1406, 767],
        [1455, 223],
        [1453, 853],
        [1404, 1396],
      ];

      const result = transformPoints(diamond, {
        normalizeShape: 'rectangle',
      });

      // Should be a rectangle
      expect(result).toHaveLength(4);
      expect(result[0]![0]).toBe(result[3]![0]);
    });

    it('should apply resize only', () => {
      const points: Point[] = [
        [0, 0],
        [10, 0],
        [10, 10],
        [0, 10],
      ];

      const result = transformPoints(points, {
        widthIncrement: 2,
        heightIncrement: 2,
      });

      const bbox = getMinimumBoundingRect(result);
      expect(bbox.width).toBeCloseTo(12, 5);
      expect(bbox.height).toBeCloseTo(12, 5);
    });

    it('should apply both transformations', () => {
      const diamond: Point[] = [
        [1406, 767],
        [1455, 223],
        [1453, 853],
        [1404, 1396],
      ];

      const result = transformPoints(diamond, {
        normalizeShape: 'rectangle',
        widthIncrement: 10,
        heightIncrement: 20,
      });

      // Should be a rectangle
      expect(result).toHaveLength(4);
      expect(result[0]![0]).toBe(result[3]![0]);

      // Original bounding box
      const normalizedBbox = getMinimumBoundingRect(normalizeShape(diamond));
      const resultBbox = getMinimumBoundingRect(result);

      // Width should be original + increment
      expect(resultBbox.width).toBeCloseTo(normalizedBbox.width + 10, 5);
      expect(resultBbox.height).toBeCloseTo(normalizedBbox.height + 20, 5);
    });

    it('should handle "none" normalization', () => {
      const points: Point[] = [
        [0, 0],
        [10, 0],
        [10, 10],
        [0, 10],
      ];

      const result = transformPoints(points, {
        normalizeShape: 'none',
        widthIncrement: 2,
      });

      // Shape should not be normalized, only resized
      expect(result).toHaveLength(4);
      const bbox = getMinimumBoundingRect(result);
      expect(bbox.width).toBeCloseTo(12, 5);
    });
  });
});
