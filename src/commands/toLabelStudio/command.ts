import { buildCommand } from '@stricli/core';
import {
  DEFAULT_BASE_SERVER_URL,
  DEFAULT_CREATE_FILE_LIST_FOR_SERVING,
  DEFAULT_CREATE_FILE_PER_IMAGE,
  DEFAULT_FILE_LIST_NAME,
  DEFAULT_HEIGHT_INCREMENT,
  DEFAULT_LABEL_NAME,
  DEFAULT_LABEL_STUDIO_FULL_JSON,
  DEFAULT_LABEL_STUDIO_PRECISION,
  DEFAULT_PPOCR_FILE_PATTERN,
  DEFAULT_RECURSIVE,
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

export const toLabelStudioCommand = buildCommand({
  loader: async () => {
    const { convertToLabelStudio } = await import('./impl');
    return convertToLabelStudio;
  },
  parameters: {
    positional: {
      kind: 'array',
      parameter: {
        brief: 'Input directories containing PPOCRLabel files',
        parse: String,
      },
      minimum: 1,
    },
    flags: {
      outDir: {
        kind: 'parsed',
        brief:
          'Output directory. If not specified, files are saved in the same directory as the source files',
        parse: String,
        optional: true,
      },
      defaultLabelName: {
        kind: 'parsed',
        brief: `Default label name for text annotations. Default: "${DEFAULT_LABEL_NAME}"`,
        parse: String,
        optional: true,
      },
      toFullJson: {
        kind: 'boolean',
        brief: `Convert to Full OCR Label Studio format. Default: "${DEFAULT_LABEL_STUDIO_FULL_JSON}"`,
        optional: true,
      },
      createFilePerImage: {
        kind: 'boolean',
        brief: `Create a separate Label Studio JSON file for each image. Default: "${DEFAULT_CREATE_FILE_PER_IMAGE}"`,
        optional: true,
      },
      createFileListForServing: {
        kind: 'boolean',
        brief: `Create a file list for serving in Label Studio. Default: "${DEFAULT_CREATE_FILE_LIST_FOR_SERVING}"`,
        optional: true,
      },
      fileListName: {
        kind: 'parsed',
        brief: `Name of the file list for serving. Default: "${DEFAULT_FILE_LIST_NAME}"`,
        parse: String,
        optional: true,
      },
      baseServerUrl: {
        kind: 'parsed',
        brief: `Base server URL for constructing image URLs in the file list. Default: "${DEFAULT_BASE_SERVER_URL}"`,
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
        brief: `Regex pattern to match PPOCRLabel files (should match .txt files). Default: "${DEFAULT_PPOCR_FILE_PATTERN}"`,
        parse: String,
        optional: true,
      },
    },
  },
  docs: {
    brief: 'Convert PPOCRLabel files to Label Studio format',
  },
});
