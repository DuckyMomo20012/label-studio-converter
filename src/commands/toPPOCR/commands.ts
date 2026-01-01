import { buildCommand } from '@stricli/core';
import {
  DEFAULT_PPOCR_FILE_NAME,
  OUTPUT_BASE_DIR,
  SORT_HORIZONTAL_LTR,
  SORT_HORIZONTAL_NONE,
  SORT_HORIZONTAL_RTL,
  SORT_VERTICAL_BOTTOM_TOP,
  SORT_VERTICAL_NONE,
  SORT_VERTICAL_TOP_BOTTOM,
} from '@/constants';

export const toPPOCRCommand = buildCommand({
  loader: async () => {
    const { convertToPPOCR } = await import('./impl');
    return convertToPPOCR;
  },
  parameters: {
    positional: {
      kind: 'array',
      parameter: {
        brief: 'Input directories containing Label Studio files',
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
      fileName: {
        kind: 'parsed',
        brief: `Output PPOCR file name. Default to "${DEFAULT_PPOCR_FILE_NAME}"`,
        parse: String,
        optional: true,
      },
      baseImageDir: {
        kind: 'parsed',
        brief:
          'Base directory path to prepend to image filenames in output (e.g., "ch" or "images/ch")',
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
    },
  },
  docs: {
    brief: 'Convert Label Studio files to PPOCRLabel format',
  },
});
