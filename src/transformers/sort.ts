import {
  type HorizontalSortOrder,
  SORT_HORIZONTAL_LTR,
  SORT_HORIZONTAL_NONE,
  SORT_HORIZONTAL_RTL,
  SORT_VERTICAL_NONE,
  SORT_VERTICAL_TOP_BOTTOM,
  type VerticalSortOrder,
} from '@/constants';
import { getBoundingBoxCenter } from '@/lib/geometry';
import { type Transformer } from '@/lib/processor';

export type SortTransformerOptions = {
  verticalSort: VerticalSortOrder;
  horizontalSort: HorizontalSortOrder;
};

// Tolerance for grouping bounding boxes into columns/rows
// Boxes within this pixel distance are considered in the same column/row
export const GROUPING_TOLERANCE = 50;

export const sortTransformer = (async (
  boxes,
  imageFilePath: string,
  options,
) => {
  const { verticalSort, horizontalSort } = options;

  if (
    verticalSort === SORT_VERTICAL_NONE &&
    horizontalSort === SORT_HORIZONTAL_NONE
  ) {
    return boxes;
  }

  // Create a copy to avoid mutating the original array
  const sorted = [...boxes];

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

      // If horizontal sorting is NONE, always use vertical sort
      // Otherwise, only sort vertically if there's significant y difference
      if (
        horizontalSort === SORT_HORIZONTAL_NONE ||
        Math.abs(yDiff) >= GROUPING_TOLERANCE
      ) {
        if (yDiff !== 0) {
          return yDiff;
        }
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
}) satisfies Transformer<SortTransformerOptions>;
