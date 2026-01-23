import { buildCommand } from '@stricli/core';
import {
  DEFAULT_BACKUP,
  DEFAULT_PPOCR_FILE_PATTERN,
  DEFAULT_RECURSIVE,
} from '@/constants';
import { baseEnhanceFlagOptions } from '@/lib';

export const enhancePPOCRCommand = buildCommand({
  loader: async () => {
    const { enhancePPOCR } = await import('./impl');
    return enhancePPOCR;
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
      fileName: {
        kind: 'parsed',
        brief:
          'Custom output filename. If not specified, uses the same name as the source file',
        parse: String,
        optional: true,
      },
      backup: {
        kind: 'boolean',
        brief: `Create backup of existing files before overwriting. Default: ${DEFAULT_BACKUP}`,
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
      ...baseEnhanceFlagOptions,
    },
  },
  docs: {
    brief: 'Enhance PPOCRLabel files with sorting, normalization, and resizing',
  },
});
