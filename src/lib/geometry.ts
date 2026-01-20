/**
 * Geometry utility functions for shape normalization and bounding box operations
 */

import { round } from 'es-toolkit';
import type { ShapeNormalizeOption } from '@/constants';

export type Point = [number, number];

/**
 * Round a number to a specified precision
 * @param value - The number to round
 * @param precision - Number of decimal places (-1 means no rounding)
 * @returns Rounded number
 */
export function roundToPrecision(value: number, precision: number): number {
  if (precision < 0) {
    return value; // No rounding
  }
  return round(value, precision);
}

/**
 * Round points array to a specified precision
 * @param points - Array of points to round
 * @param precision - Number of decimal places (-1 means no rounding)
 * @returns Rounded points
 */
export function roundPoints(points: Point[], precision: number): Point[] {
  if (precision < 0) {
    return points; // No rounding
  }
  return points.map(
    ([x, y]) => [round(x, precision), round(y, precision)] as Point,
  );
}

/**
 * Calculate the center point of a polygon
 */
export function calculateCenter(points: Point[]): Point {
  const sum = points.reduce((acc, [x, y]) => [acc[0] + x, acc[1] + y], [
    0, 0,
  ] as Point);
  return [sum[0] / points.length, sum[1] / points.length];
}

/**
 * Calculate the minimum bounding rectangle of a polygon
 */
export function getMinimumBoundingRect(points: Point[]): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
} {
  const minX = Math.min(...points.map(([x]) => x));
  const maxX = Math.max(...points.map(([x]) => x));
  const minY = Math.min(...points.map(([, y]) => y));
  const maxY = Math.max(...points.map(([, y]) => y));

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Convert diamond-like shapes to axis-aligned rectangles
 * @param points - Array of points representing the shape
 * @returns Normalized rectangle points
 */
export function normalizeShape(points: Point[]): Point[] {
  if (points.length < 3) {
    return points;
  }

  // Convert to axis-aligned bounding rectangle
  const { minX, minY, maxX, maxY } = getMinimumBoundingRect(points);

  return [
    [minX, minY],
    [maxX, minY],
    [maxX, maxY],
    [minX, maxY],
  ];
}

/**
 * Resize bounding box by a certain amount while keeping it centered
 * @param points - Array of points representing the bounding box
 * @param widthIncrement - Amount to increase width (can be negative to decrease)
 * @param heightIncrement - Amount to increase height (can be negative to decrease)
 * @returns Resized points
 */
export function resizeBoundingBox(
  points: Point[],
  widthIncrement: number,
  heightIncrement: number,
): Point[] {
  if (points.length === 0) {
    return points;
  }

  // Calculate center
  const center = calculateCenter(points);

  // Calculate current bounding box
  const bbox = getMinimumBoundingRect(points);

  // Calculate new dimensions
  const newWidth = Math.max(1, bbox.width + widthIncrement);
  const newHeight = Math.max(1, bbox.height + heightIncrement);

  // Calculate scale factors
  const scaleX = newWidth / bbox.width;
  const scaleY = newHeight / bbox.height;

  // Transform each point: translate to origin, scale, translate back
  return points.map(([x, y]) => {
    const relX = x - center[0];
    const relY = y - center[1];

    return [center[0] + relX * scaleX, center[1] + relY * scaleY] as Point;
  });
}

/**
 * Apply geometry transformations to points
 * @param points - Original points
 * @param options - Transformation options
 * @returns Transformed points
 */
export function transformPoints(
  points: Point[],
  options: {
    normalizeShape?: ShapeNormalizeOption;
    widthIncrement?: number;
    heightIncrement?: number;
  },
): Point[] {
  let result = points;

  // Apply shape normalization first
  if (options.normalizeShape && options.normalizeShape === 'rectangle') {
    result = normalizeShape(result);
  }

  // Then apply resizing
  if (
    options.widthIncrement !== undefined ||
    options.heightIncrement !== undefined
  ) {
    result = resizeBoundingBox(
      result,
      options.widthIncrement ?? 0,
      options.heightIncrement ?? 0,
    );
  }

  return result;
}
