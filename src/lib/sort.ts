import type { HorizontalSortOrder, VerticalSortOrder } from '@/constants';
import {
  SORT_HORIZONTAL_LTR,
  SORT_HORIZONTAL_NONE,
  SORT_HORIZONTAL_RTL,
  SORT_VERTICAL_NONE,
  SORT_VERTICAL_TOP_BOTTOM,
} from '@/constants';
import type { PPOCRLabel } from '@/lib/schema';

// Tolerance for grouping bounding boxes into columns/rows
// Boxes within this pixel distance are considered in the same column/row
const GROUPING_TOLERANCE = 50;

/**
 * Calculate the bounding box center point from polygon points
 */
function getBoundingBoxCenter(points: number[][]): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const [x, y] of points) {
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
 * Sort PPOCRLabel array based on bounding box positions
 * Supports both traditional reading order (top-bottom, then left-right)
 * and SinoNom reading order (right-left columns, top-bottom within each column)
 * @param annotations - Array of PPOCR annotations to sort
 * @param verticalSort - Vertical sort order: 'none', 'top-bottom', 'bottom-top'
 * @param horizontalSort - Horizontal sort order: 'none', 'ltr', 'rtl'
 * @returns Sorted array (or original array if both sorts are 'none')
 */
export function sortBoundingBoxes(
  annotations: PPOCRLabel,
  verticalSort: VerticalSortOrder,
  horizontalSort: HorizontalSortOrder,
): PPOCRLabel {
  if (
    verticalSort === SORT_VERTICAL_NONE &&
    horizontalSort === SORT_HORIZONTAL_NONE
  ) {
    return annotations;
  }

  // Create a copy to avoid mutating the original array
  const sorted = [...annotations];

  // Detect if this is vertical text (SinoNom style) or horizontal text (Arabic/Hebrew style)
  // by checking if most boxes are taller than they are wide
  const isVerticalText =
    sorted.length > 0 &&
    (() => {
      const verticalCount = sorted.filter((ann) => {
        const center = getBoundingBoxCenter(ann.points);
        return center.height > center.width * 1.5; // At least 1.5x taller than wide
      }).length;
      return verticalCount > sorted.length / 2; // More than half are vertical
    })();

  // For RTL with vertical sorting and vertical text (SinoNom):
  // Group into columns first, then sort within each column
  if (
    horizontalSort === SORT_HORIZONTAL_RTL &&
    verticalSort !== SORT_VERTICAL_NONE &&
    isVerticalText
  ) {
    // Calculate centers for all annotations
    const annotationsWithCenters = sorted.map((ann) => ({
      annotation: ann,
      center: getBoundingBoxCenter(ann.points),
    }));

    // Group annotations into columns based on x-position
    const columns: (typeof annotationsWithCenters)[] = [];

    for (const item of annotationsWithCenters) {
      let addedToColumn = false;

      for (const column of columns) {
        // Check if this annotation belongs to an existing column
        const avgX =
          column.reduce((sum, c) => sum + c.center.x, 0) / column.length;
        if (Math.abs(item.center.x - avgX) < GROUPING_TOLERANCE) {
          column.push(item);
          addedToColumn = true;
          break;
        }
      }

      if (!addedToColumn) {
        columns.push([item]);
      }
    }

    // Sort columns right-to-left
    columns.sort((colA, colB) => {
      const avgXA = colA.reduce((sum, c) => sum + c.center.x, 0) / colA.length;
      const avgXB = colB.reduce((sum, c) => sum + c.center.x, 0) / colB.length;
      return avgXB - avgXA; // Right to left
    });

    // Sort within each column top-to-bottom or bottom-to-top
    for (const column of columns) {
      column.sort((a, b) => {
        return verticalSort === SORT_VERTICAL_TOP_BOTTOM
          ? a.center.y - b.center.y
          : b.center.y - a.center.y;
      });
    }

    // Flatten back to a single array
    return columns.flat().map((item) => item.annotation);
  }

  // For all other cases, use simple sort with priority
  sorted.sort((a, b) => {
    const centerA = getBoundingBoxCenter(a.points);
    const centerB = getBoundingBoxCenter(b.points);

    // Apply vertical sorting first (if specified)
    if (verticalSort !== SORT_VERTICAL_NONE) {
      const yDiff =
        verticalSort === SORT_VERTICAL_TOP_BOTTOM
          ? centerA.y - centerB.y
          : centerB.y - centerA.y;

      // If there's a significant difference in y-position, return that
      if (Math.abs(yDiff) > GROUPING_TOLERANCE) {
        return yDiff;
      }
    }

    // Apply horizontal sorting (if specified and y-positions are similar or not sorting vertically)
    if (horizontalSort !== SORT_HORIZONTAL_NONE) {
      return horizontalSort === SORT_HORIZONTAL_LTR
        ? centerA.x - centerB.x
        : centerB.x - centerA.x;
    }

    return 0;
  });

  return sorted;
}
