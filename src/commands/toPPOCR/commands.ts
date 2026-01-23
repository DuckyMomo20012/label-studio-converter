import { buildCommand } from '@stricli/core';
import {
  DEFAULT_BACKUP,
  DEFAULT_LABEL_STUDIO_FILE_PATTERN,
  DEFAULT_PPOCR_FILE_NAME,
  DEFAULT_RECURSIVE,
} from '@/constants';
import { baseEnhanceFlagOptions } from '@/lib';

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
        brief:
          'Output directory. If not specified, files are saved in the same directory as the source files',
        parse: String,
        optional: true,
      },
      fileName: {
        kind: 'parsed',
        brief: `Output PPOCR file name. Default: "${DEFAULT_PPOCR_FILE_NAME}"`,
        parse: String,
        optional: true,
      },
      backup: {
        kind: 'boolean',
        brief: `Create backup of existing files before overwriting. Default: ${DEFAULT_BACKUP}`,
        optional: true,
      },
      baseImageDir: {
        kind: 'parsed',
        brief:
          'Base directory path to prepend to image filenames in output (e.g., "ch" or "images/ch")',
        parse: String,
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
      ...baseEnhanceFlagOptions,
    },
  },
  docs: {
    brief: 'Convert Label Studio files to PPOCRLabel format',
  },
});
