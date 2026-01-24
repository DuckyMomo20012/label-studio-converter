import {
  DEFAULT_USE_ORIENTED_BOX,
  SHAPE_NORMALIZE_RECTANGLE,
  type ShapeNormalizeOption,
} from '@/constants';
import { getMinimumBoundingRect, getOrientedBoundingBox } from '@/lib/geometry';
import { type Transformer } from '@/lib/processor';
import { type UnifiedPoint } from '@/lib/unified';

export type NormalizeTransformerOptions = {
  normalizeShape?: ShapeNormalizeOption;
  useOrientedBox?: boolean; // New option for skewed rectangles
};

/**
 * Convert diamond-like shapes to rectangles
 * @param points - Array of points representing the shape
 * @param useOrientedBox - If true, calculate oriented (rotated) bounding box
 * @returns Normalized rectangle points
 */
export function normalizePoint(
  points: UnifiedPoint[],
  useOrientedBox = false,
): UnifiedPoint[] {
  if (points.length < 3) {
    return points;
  }

  if (useOrientedBox) {
    // Calculate oriented bounding box (handles skewed text)
    const obb = getOrientedBoundingBox(points);
    return obb.points;
  }

  // Convert to axis-aligned bounding rectangle
  const { minX, minY, maxX, maxY } = getMinimumBoundingRect(points);

  return [
    { x: minX, y: minY },
    { x: maxX, y: minY },
    { x: maxX, y: maxY },
    { x: minX, y: maxY },
  ];
}

export const normalizeTransformer = (async (
  boxes,
  imageFilePath: string,
  options,
) => {
  const { normalizeShape, useOrientedBox = DEFAULT_USE_ORIENTED_BOX } = options;

  if (!normalizeShape || normalizeShape !== SHAPE_NORMALIZE_RECTANGLE)
    return boxes;

  const normalized = boxes.map((box) => {
    const normalizedPoints = normalizePoint(box.points, useOrientedBox);

    return {
      ...box,
      points: normalizedPoints,
    };
  });

  return normalized;
}) satisfies Transformer<NormalizeTransformerOptions>;
