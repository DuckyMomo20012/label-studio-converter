import { buildCommand } from '@stricli/core';
import {
  DEFAULT_LABEL_STUDIO_FILE_PATTERN,
  DEFAULT_PPOCR_FILE_NAME,
} from '@/constants';
import { baseEnhanceFlagOptions, baseFileIOFlagOptions } from '@/lib';

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
      ...baseFileIOFlagOptions,
      ...baseEnhanceFlagOptions,
      fileName: {
        kind: 'parsed',
        brief: `Output PPOCR file name. Default: "${DEFAULT_PPOCR_FILE_NAME}"`,
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
      filePattern: {
        kind: 'parsed',
        brief: `Regex pattern to match Label Studio files (should match .json files). Default: "${DEFAULT_LABEL_STUDIO_FILE_PATTERN}"`,
        parse: String,
        optional: true,
      },
    },
  },
  docs: {
    brief: 'Convert Label Studio files to PPOCRLabel format',
  },
});
