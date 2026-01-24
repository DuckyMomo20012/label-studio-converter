import { describe, expect, it } from 'vitest';
import {
  calculateCenter,
  getBoundingBoxCenter,
  getMinimumBoundingRect,
  roundPoints,
  roundToPrecision,
} from '../src/lib/geometry';
import { type UnifiedPoint } from '@/lib';

describe('Geometry utilities', () => {
  describe('calculateCenter', () => {
    it('should calculate the center of a polygon', () => {
      const points: UnifiedPoint[] = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 },
      ];
      const center = calculateCenter(points);
      expect(center).toEqual({ x: 5, y: 5 });
    });
  });

  describe('getMinimumBoundingRect', () => {
    it('should calculate the bounding rectangle', () => {
      const points: UnifiedPoint[] = [
        { x: 5, y: 5 },
        { x: 15, y: 10 },
        { x: 10, y: 20 },
        { x: 0, y: 15 },
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

  describe('getBoundingBoxCenter', () => {
    it('should calculate the center and dimensions', () => {
      const points: UnifiedPoint[] = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 20 },
        { x: 0, y: 20 },
      ];
      const result = getBoundingBoxCenter(points);
      expect(result).toEqual({
        x: 5,
        y: 10,
        width: 10,
        height: 20,
      });
    });
  });

  describe('roundToPrecision', () => {
    it('should round to specified precision', () => {
      expect(roundToPrecision(1.2345, 2)).toBe(1.23);
      expect(roundToPrecision(1.2345, 0)).toBe(1);
      expect(roundToPrecision(1.2345, -1)).toBe(1.2345); // No rounding
    });
  });

  describe('roundPoints', () => {
    it('should round points to specified precision', () => {
      const points: UnifiedPoint[] = [
        { x: 1.2345, y: 2.3456 },
        { x: 3.4567, y: 4.5678 },
      ];
      const rounded = roundPoints(points, 2);
      expect(rounded).toEqual([
        { x: 1.23, y: 2.35 },
        { x: 3.46, y: 4.57 },
      ]);
    });

    it('should not round when precision is -1', () => {
      const points: UnifiedPoint[] = [{ x: 1.2345, y: 2.3456 }];
      const rounded = roundPoints(points, -1);
      expect(rounded).toEqual(points);
    });
  });
});
