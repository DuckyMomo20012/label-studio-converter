/**
 * Geometry utility functions for shape normalization and bounding box operations
 */

import { round } from 'es-toolkit';
import { type UnifiedPoint } from '@/lib/unified';

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
export function roundPoints(
  points: UnifiedPoint[],
  precision: number,
): UnifiedPoint[] {
  if (precision < 0) {
    return points; // No rounding
  }
  return points.map(
    ({ x, y }) =>
      ({ x: round(x, precision), y: round(y, precision) }) as UnifiedPoint,
  );
}

/**
 * Calculate the center point of a polygon
 */
export function calculateCenter(points: UnifiedPoint[]): UnifiedPoint {
  const sum = points.reduce(
    (acc, { x, y }) => ({ x: acc.x + x, y: acc.y + y }),
    {
      x: 0,
      y: 0,
    } as UnifiedPoint,
  );
  return {
    x: sum.x / points.length,
    y: sum.y / points.length,
  };
}

/**
 * Calculate the bounding box center point from polygon points
 */
export function getBoundingBoxCenter(points: UnifiedPoint[]): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const { x, y } of points) {
    if (x !== undefined && y !== undefined) {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  return {
    x: (minX + maxX) / 2,
    y: (minY + maxY) / 2,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Calculate the minimum bounding rectangle of a polygon
 */
export function getMinimumBoundingRect(points: UnifiedPoint[]): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
} {
  const minX = Math.min(...points.map(({ x }) => x));
  const maxX = Math.max(...points.map(({ x }) => x));
  const minY = Math.min(...points.map(({ y }) => y));
  const maxY = Math.max(...points.map(({ y }) => y));

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

export function tupleToPoints(tuples: number[][]): UnifiedPoint[] {
  return tuples
    .filter(
      (tuple): tuple is [number, number] =>
        tuple.length === 2 &&
        typeof tuple[0] === 'number' &&
        typeof tuple[1] === 'number',
    )
    .map(([x, y]) => ({ x, y }));
}

export function pointsToTuple(points: UnifiedPoint[]): number[][] {
  return points.map(({ x, y }) => [x, y]);
}

export function rectangleToPoints(
  x: number,
  y: number,
  width: number,
  height: number,
  original_width?: number,
  original_height?: number,
): UnifiedPoint[] {
  // If original dimensions are provided, convert from percentages to absolute
  if (original_width && original_height) {
    x = (x / 100) * original_width;
    y = (y / 100) * original_height;
    width = (width / 100) * original_width;
    height = (height / 100) * original_height;
  }

  return [
    { x, y },
    { x: x + width, y },
    { x: x + width, y: y + height },
    { x: x, y: y + height },
  ];
}

// Convert absolute pixel coordinates to percentage (0-100)
export function pixelToPercentage(
  points: number[][],
  imgWidth: number,
  imgHeight: number,
): number[][] {
  return points.map(([x, y]) => [
    ((x ?? 0) / imgWidth) * 100,
    ((y ?? 0) / imgHeight) * 100,
  ]);
}

/**
 * Calculate the rotation angle of a shape
 * Uses PCA (Principal Component Analysis) to find the dominant axis
 */
export function calculateRotationAngle(points: UnifiedPoint[]): number {
  if (points.length < 2) return 0;

  // Calculate centroid
  const center = calculateCenter(points);

  // Calculate covariance matrix elements
  let cxx = 0;
  let cxy = 0;
  let cyy = 0;

  for (const { x, y } of points) {
    const dx = x - center.x;
    const dy = y - center.y;
    cxx += dx * dx;
    cxy += dx * dy;
    cyy += dy * dy;
  }

  cxx /= points.length;
  cxy /= points.length;
  cyy /= points.length;

  // Calculate angle using eigenvector of covariance matrix
  // Angle = 0.5 * atan2(2*cxy, cxx - cyy)
  return 0.5 * Math.atan2(2 * cxy, cxx - cyy);
}

/**
 * Calculate oriented (rotated) bounding box
 * Returns 4 corner points of the minimum area rectangle
 */
export function getOrientedBoundingBox(points: UnifiedPoint[]): {
  points: UnifiedPoint[];
  angle: number;
  center: UnifiedPoint;
  width: number;
  height: number;
} {
  if (points.length < 3) {
    const bbox = getMinimumBoundingRect(points);
    return {
      points: rectangleToPoints(bbox.minX, bbox.minY, bbox.width, bbox.height),
      angle: 0,
      center: { x: bbox.minX + bbox.width / 2, y: bbox.minY + bbox.height / 2 },
      width: bbox.width,
      height: bbox.height,
    };
  }

  const angle = calculateRotationAngle(points);
  const center = calculateCenter(points);
  const cos = Math.cos(-angle);
  const sin = Math.sin(-angle);

  // Rotate points to align with axes
  const rotated = points.map(({ x, y }) => ({
    x: (x - center.x) * cos - (y - center.y) * sin,
    y: (x - center.x) * sin + (y - center.y) * cos,
  }));

  // Get axis-aligned bounds of rotated points
  const minX = Math.min(...rotated.map((p) => p.x));
  const maxX = Math.max(...rotated.map((p) => p.x));
  const minY = Math.min(...rotated.map((p) => p.y));
  const maxY = Math.max(...rotated.map((p) => p.y));

  const width = maxX - minX;
  const height = maxY - minY;

  // Rotate corners back to original orientation
  const cosInv = Math.cos(angle);
  const sinInv = Math.sin(angle);

  const corners = [
    { x: minX, y: minY },
    { x: maxX, y: minY },
    { x: maxX, y: maxY },
    { x: minX, y: maxY },
  ].map(({ x, y }) => ({
    x: x * cosInv - y * sinInv + center.x,
    y: x * sinInv + y * cosInv + center.y,
  }));

  return {
    points: corners,
    angle,
    center,
    width,
    height,
  };
}

/**
 * Check if points form an oriented (rotated) rectangle
 * Returns angle if rotated, 0 if axis-aligned
 */
export function getBoxRotation(points: UnifiedPoint[]): number {
  if (points.length !== 4) return 0;

  // Calculate angle from first edge
  const dx = points[1]!.x - points[0]!.x;
  const dy = points[1]!.y - points[0]!.y;
  const angle = Math.atan2(dy, dx);

  // If nearly horizontal (< 5 degrees), treat as axis-aligned
  const threshold = (5 * Math.PI) / 180;
  if (
    Math.abs(angle) < threshold ||
    Math.abs(Math.abs(angle) - Math.PI) < threshold
  ) {
    return 0;
  }

  return angle;
}
