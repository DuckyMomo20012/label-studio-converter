import { CommandContext, TypedCommandFlagParameters } from '@stricli/core';
import {
  DEFAULT_HEIGHT_INCREMENT,
  DEFAULT_PPOCR_PRECISION,
  DEFAULT_SHAPE_NORMALIZE,
  DEFAULT_SORT_HORIZONTAL,
  DEFAULT_SORT_VERTICAL,
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
  widthIncrement?: number;
  heightIncrement?: number;
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
