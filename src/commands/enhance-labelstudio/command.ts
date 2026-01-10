import { buildCommand } from '@stricli/core';
import {
  DEFAULT_HEIGHT_INCREMENT,
  DEFAULT_LABEL_STUDIO_PRECISION,
  DEFAULT_WIDTH_INCREMENT,
  OUTPUT_BASE_DIR,
  SHAPE_NORMALIZE_NONE,
  SHAPE_NORMALIZE_RECTANGLE,
  SORT_HORIZONTAL_LTR,
  SORT_HORIZONTAL_NONE,
  SORT_HORIZONTAL_RTL,
  SORT_VERTICAL_BOTTOM_TOP,
  SORT_VERTICAL_NONE,
  SORT_VERTICAL_TOP_BOTTOM,
} from '@/constants';

export const enhanceLabelStudioCommand = buildCommand({
  loader: async () => {
    const { enhanceLabelStudio } = await import('./impl');
    return enhanceLabelStudio;
  },
  parameters: {
    positional: {
      kind: 'array',
      parameter: {
        brief: 'Input directories containing Label Studio JSON files',
        parse: String,
      },
      minimum: 1,
    },
    flags: {
      outDir: {
        kind: 'parsed',
        brief: `Output directory. Default to "${OUTPUT_BASE_DIR}"`,
        parse: String,
        optional: true,
      },
      sortVertical: {
        kind: 'parsed',
        brief: `Sort bounding boxes vertically. Options: "${SORT_VERTICAL_NONE}" (default), "${SORT_VERTICAL_TOP_BOTTOM}", "${SORT_VERTICAL_BOTTOM_TOP}"`,
        parse: String,
        optional: true,
      },
      sortHorizontal: {
        kind: 'parsed',
        brief: `Sort bounding boxes horizontally. Options: "${SORT_HORIZONTAL_NONE}" (default), "${SORT_HORIZONTAL_LTR}", "${SORT_HORIZONTAL_RTL}"`,
        parse: String,
        optional: true,
      },
      normalizeShape: {
        kind: 'parsed',
        brief: `Normalize diamond-like shapes to axis-aligned rectangles. Options: "${SHAPE_NORMALIZE_NONE}" (default), "${SHAPE_NORMALIZE_RECTANGLE}"`,
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
        brief: `Number of decimal places for coordinates. Use -1 for full precision (no rounding). Default: ${DEFAULT_LABEL_STUDIO_PRECISION}`,
        parse: Number,
        optional: true,
      },
    },
  },
  docs: {
    brief:
      'Enhance Label Studio files with sorting, normalization, and resizing',
  },
});
