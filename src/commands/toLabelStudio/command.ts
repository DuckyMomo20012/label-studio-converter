import { buildCommand } from '@stricli/core';
import {
  DEFAULT_BASE_SERVER_URL,
  DEFAULT_CREATE_FILE_LIST_FOR_SERVING,
  DEFAULT_CREATE_FILE_PER_IMAGE,
  DEFAULT_FILE_LIST_NAME,
  DEFAULT_HEIGHT_INCREMENT,
  DEFAULT_LABEL_NAME,
  DEFAULT_LABEL_STUDIO_FULL_JSON,
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
        brief: `Output directory. Default to "${OUTPUT_BASE_DIR}"`,
        parse: String,
        optional: true,
      },
      defaultLabelName: {
        kind: 'parsed',
        brief: `Default label name for text annotations. Default to "${DEFAULT_LABEL_NAME}"`,
        parse: String,
        optional: true,
      },
      toFullJson: {
        kind: 'boolean',
        brief: `Convert to Full OCR Label Studio format. Default to "${DEFAULT_LABEL_STUDIO_FULL_JSON}"`,
        optional: true,
      },
      createFilePerImage: {
        kind: 'boolean',
        brief: `Create a separate Label Studio JSON file for each image. Default to "${DEFAULT_CREATE_FILE_PER_IMAGE}"`,
        optional: true,
      },
      createFileListForServing: {
        kind: 'boolean',
        brief: `Create a file list for serving in Label Studio. Default to "${DEFAULT_CREATE_FILE_LIST_FOR_SERVING}"`,
        optional: true,
      },
      fileListName: {
        kind: 'parsed',
        brief: `Name of the file list for serving. Default to "${DEFAULT_FILE_LIST_NAME}"`,
        parse: String,
        optional: true,
      },
      baseServerUrl: {
        kind: 'parsed',
        brief: `Base server URL for constructing image URLs in the file list. Default to "${DEFAULT_BASE_SERVER_URL}"`,
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
    },
  },
  docs: {
    brief: 'Convert PPOCRLabel files to Label Studio format',
  },
});
