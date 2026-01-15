import type {
  HorizontalSortOrder,
  OutputMode,
  ShapeNormalizeOption,
  VerticalSortOrder,
} from '@/constants';
import { type Point, roundPoints, transformPoints } from '@/lib/geometry';
import type { PPOCRLabel } from '@/lib/schema';
import { sortBoundingBoxes } from '@/lib/sort';

/**
 * Common enhancement options shared across formats
 */
export interface EnhancementOptions {
  sortVertical?: VerticalSortOrder;
  sortHorizontal?: HorizontalSortOrder;
  normalizeShape?: ShapeNormalizeOption;
  widthIncrement?: number;
  heightIncrement?: number;
  precision?: number;
  outputMode?: OutputMode;
}

/**
 * Apply all enhancement transformations to PPOCRLabel data
 */
export function enhancePPOCRLabel(
  data: PPOCRLabel,
  options: EnhancementOptions,
): PPOCRLabel {
  const {
    sortVertical,
    sortHorizontal,
    normalizeShape,
    widthIncrement = 0,
    heightIncrement = 0,
    precision = 0,
  } = options;

  // Apply sorting first
  let enhanced = data;
  if (sortVertical && sortHorizontal) {
    enhanced = sortBoundingBoxes(enhanced, sortVertical, sortHorizontal);
  }

  // Apply shape transformations
  if (normalizeShape || widthIncrement !== 0 || heightIncrement !== 0) {
    enhanced = enhanced.map((annotation) => {
      let points = transformPoints(annotation.points as Point[], {
        normalizeShape,
        widthIncrement,
        heightIncrement,
      });

      // Apply precision rounding
      points = roundPoints(points, precision);

      return {
        ...annotation,
        points,
      };
    });
  }

  return enhanced;
}

/**
 * Type guard to check if enhancement options are provided
 */
export function hasEnhancementOptions(options: EnhancementOptions): boolean {
  return !!(
    options.sortVertical ||
    options.sortHorizontal ||
    options.normalizeShape ||
    options.widthIncrement !== 0 ||
    options.heightIncrement !== 0
  );
}
