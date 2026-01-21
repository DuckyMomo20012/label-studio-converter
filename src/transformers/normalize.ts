import { type ShapeNormalizeOption } from '@/constants';
import { getMinimumBoundingRect } from '@/lib/geometry';
import { type Transformer } from '@/lib/processor';
import { type UnifiedPoint } from '@/lib/unified';

export type NormalizeTransformerOptions = {
  normalizeShape?: ShapeNormalizeOption;
};

/**
 * Convert diamond-like shapes to axis-aligned rectangles
 * @param points - Array of points representing the shape
 * @returns Normalized rectangle points
 */
export function normalizePoint(points: UnifiedPoint[]): UnifiedPoint[] {
  if (points.length < 3) {
    return points;
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
  const { normalizeShape } = options;

  if (!normalizeShape || normalizeShape !== 'rectangle') return boxes;

  const normalized = boxes.map((box) => {
    const normalizedPoints = normalizePoint(box.points);

    return {
      ...box,
      points: normalizedPoints,
    };
  });

  return normalized;
}) satisfies Transformer<NormalizeTransformerOptions>;
