import type { CommandContext, TypedCommandFlagParameters } from '@stricli/core';
import {
  DEFAULT_ADAPT_RESIZE_MARGIN,
  DEFAULT_ADAPT_RESIZE_MAX_COMPONENT_SIZE,
  DEFAULT_ADAPT_RESIZE_MAX_HORIZONTAL_EXPANSION,
  DEFAULT_ADAPT_RESIZE_MIN_COMPONENT_SIZE,
  DEFAULT_ADAPT_RESIZE_MORPHOLOGY_SIZE,
  DEFAULT_ADAPT_RESIZE_OUTLIER_PERCENTILE,
  DEFAULT_ADAPT_RESIZE_THRESHOLD,
  DEFAULT_HEIGHT_INCREMENT,
  DEFAULT_PPOCR_PRECISION,
  DEFAULT_SHAPE_NORMALIZE,
  DEFAULT_SORT_HORIZONTAL,
  DEFAULT_SORT_VERTICAL,
  DEFAULT_USE_ORIENTED_BOX,
  DEFAULT_WIDTH_INCREMENT,
  SHAPE_NORMALIZE_NONE,
  SHAPE_NORMALIZE_RECTANGLE,
  SORT_HORIZONTAL_LTR,
  SORT_HORIZONTAL_NONE,
  SORT_HORIZONTAL_RTL,
  SORT_VERTICAL_BOTTOM_TOP,
  SORT_VERTICAL_NONE,
  SORT_VERTICAL_TOP_BOTTOM,
} from '@/constants';

export type BaseEnhanceOptions = {
  sortVertical?: string;
  sortHorizontal?: string;
  normalizeShape?: string;
  useOrientedBox?: boolean;
  widthIncrement?: number;
  heightIncrement?: number;
  adaptResize?: boolean;
  adaptResizeThreshold?: number;
  adaptResizeMargin?: number;
  adaptResizeMinComponentSize?: number;
  adaptResizeMaxComponentSize?: number;
  adaptResizeOutlierPercentile?: number;
  adaptResizeMorphologySize?: number;
  adaptResizeMaxHorizontalExpansion?: number;
  precision?: number;
};

export const baseEnhanceFlagOptions = {
  sortVertical: {
    kind: 'parsed',
    brief: `Sort bounding boxes vertically. Options: "${SORT_VERTICAL_NONE}", "${SORT_VERTICAL_TOP_BOTTOM}", "${SORT_VERTICAL_BOTTOM_TOP}". Default: "${DEFAULT_SORT_VERTICAL}"`,
    parse: String,
    optional: true,
  },
  sortHorizontal: {
    kind: 'parsed',
    brief: `Sort bounding boxes horizontally. Options: "${SORT_HORIZONTAL_NONE}", "${SORT_HORIZONTAL_LTR}", "${SORT_HORIZONTAL_RTL}". Default: "${DEFAULT_SORT_HORIZONTAL}"`,
    parse: String,
    optional: true,
  },
  normalizeShape: {
    kind: 'parsed',
    brief: `Normalize diamond-like shapes to axis-aligned rectangles. Options: "${SHAPE_NORMALIZE_NONE}", "${SHAPE_NORMALIZE_RECTANGLE}". Default: "${DEFAULT_SHAPE_NORMALIZE}"`,
    parse: String,
    optional: true,
  },
  useOrientedBox: {
    kind: 'boolean',
    brief: `Use oriented (rotated) bounding box when normalizing shapes. Useful for skewed text. Default: ${DEFAULT_USE_ORIENTED_BOX}`,
    optional: true,
  },
  widthIncrement: {
    kind: 'parsed',
    brief: `Increase bounding box width by this amount (in pixels). Can be negative to decrease. Default: ${DEFAULT_WIDTH_INCREMENT}`,
    parse: Number,
    optional: true,
  },
  heightIncrement: {
    kind: 'parsed',
    brief: `Increase bounding box height by this amount (in pixels). Can be negative to decrease. Default: ${DEFAULT_HEIGHT_INCREMENT}`,
    parse: Number,
    optional: true,
  },
  adaptResize: {
    kind: 'boolean',
    brief: `Apply adaptive resize to automatically adjust bounding boxes based on image content. Default: false`,
    optional: true,
  },
  adaptResizeThreshold: {
    kind: 'parsed',
    brief: `Grayscale threshold for adaptive resize (0-255). Default: ${DEFAULT_ADAPT_RESIZE_THRESHOLD}`,
    parse: Number,
    optional: true,
  },
  adaptResizeMargin: {
    kind: 'parsed',
    brief: `Margin pixels around detected content for adaptive resize. Default: ${DEFAULT_ADAPT_RESIZE_MARGIN}`,
    parse: Number,
    optional: true,
  },
  adaptResizeMinComponentSize: {
    kind: 'parsed',
    brief: `Minimum component size in pixels (filters dirt/noise). Default: ${DEFAULT_ADAPT_RESIZE_MIN_COMPONENT_SIZE}`,
    parse: Number,
    optional: true,
  },
  adaptResizeMaxComponentSize: {
    kind: 'parsed',
    brief: `Maximum component size in pixels (filters large artifacts). Default: ${DEFAULT_ADAPT_RESIZE_MAX_COMPONENT_SIZE}`,
    parse: Number,
    optional: true,
  },
  adaptResizeOutlierPercentile: {
    kind: 'parsed',
    brief: `Percentile for outlier removal (0-100). Default: ${DEFAULT_ADAPT_RESIZE_OUTLIER_PERCENTILE}`,
    parse: Number,
    optional: true,
  },
  adaptResizeMorphologySize: {
    kind: 'parsed',
    brief: `Morphological operation kernel size. Default: ${DEFAULT_ADAPT_RESIZE_MORPHOLOGY_SIZE}`,
    parse: Number,
    optional: true,
  },
  adaptResizeMaxHorizontalExpansion: {
    kind: 'parsed',
    brief: `Maximum horizontal expansion in pixels (prevents column overlap). Default: ${DEFAULT_ADAPT_RESIZE_MAX_HORIZONTAL_EXPANSION}`,
    parse: Number,
    optional: true,
  },
  precision: {
    kind: 'parsed',
    brief: `Number of decimal places for coordinates. Use -1 for full precision (no rounding). Default: ${DEFAULT_PPOCR_PRECISION} (integers)`,
    parse: Number,
    optional: true,
  },
} satisfies TypedCommandFlagParameters<
  BaseEnhanceOptions,
  CommandContext
>['flags'];
