import { calculateCenter, getMinimumBoundingRect } from '@/lib/geometry';
import { type Transformer } from '@/lib/processor';
import { type UnifiedPoint } from '@/lib/unified';

export type ResizeTransformerOptions = {
  widthIncrement?: number;
  heightIncrement?: number;
};

/**
 * Resize bounding box by a certain amount while keeping it centered
 * @param points - Array of points representing the bounding box
 * @param widthIncrement - Amount to increase width (can be negative to decrease)
 * @param heightIncrement - Amount to increase height (can be negative to decrease)
 * @returns Resized points
 */
export function resizeBoundingBox(
  points: UnifiedPoint[],
  widthIncrement: number,
  heightIncrement: number,
): UnifiedPoint[] {
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
  return points.map(({ x, y }) => {
    const relX = x - center.x;
    const relY = y - center.y;

    return {
      x: center.x + relX * scaleX,
      y: center.y + relY * scaleY,
    } as UnifiedPoint;
  });
}

export const resizeTransformer = (async (
  boxes,
  imageFilePath: string,
  options,
) => {
  const { widthIncrement, heightIncrement } = options;

  if (widthIncrement === undefined && heightIncrement === undefined) {
    return boxes;
  }

  const resized = boxes.map((box) => {
    const resizedPoints = resizeBoundingBox(
      box.points,
      widthIncrement ?? 0,
      heightIncrement ?? 0,
    );

    return {
      ...box,
      points: resizedPoints,
    };
  });

  return resized;
}) satisfies Transformer<ResizeTransformerOptions>;
