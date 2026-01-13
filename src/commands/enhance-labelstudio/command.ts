import { buildCommand } from '@stricli/core';
import {
  DEFAULT_HEIGHT_INCREMENT,
  DEFAULT_LABEL_STUDIO_FILE_PATTERN,
  DEFAULT_LABEL_STUDIO_PRECISION,
  DEFAULT_RECURSIVE,
  DEFAULT_SHAPE_NORMALIZE,
  DEFAULT_SORT_HORIZONTAL,
  DEFAULT_SORT_VERTICAL,
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
        brief: `Output directory. Default: "${OUTPUT_BASE_DIR}"`,
        parse: String,
        optional: true,
      },
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
        brief: `Number of decimal places for coordinates. Use -1 for full precision (no rounding). Default: ${DEFAULT_LABEL_STUDIO_PRECISION}`,
        parse: Number,
        optional: true,
      },
      recursive: {
        kind: 'boolean',
        brief: `Recursively search directories for files. Default: ${DEFAULT_RECURSIVE}`,
        optional: true,
      },
      filePattern: {
        kind: 'parsed',
        brief: `Regex pattern to match Label Studio files (should match .json files). Default: "${DEFAULT_LABEL_STUDIO_FILE_PATTERN}"`,
        parse: String,
        optional: true,
      },
    },
  },
  docs: {
    brief:
      'Enhance Label Studio files with sorting, normalization, and resizing',
  },
});
