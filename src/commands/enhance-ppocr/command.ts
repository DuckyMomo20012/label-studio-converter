import { buildCommand } from '@stricli/core';
import { DEFAULT_PPOCR_FILE_PATTERN } from '@/constants';
import { baseEnhanceFlagOptions, baseFileIOFlagOptions } from '@/lib';

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
      ...baseFileIOFlagOptions,
      ...baseEnhanceFlagOptions,
      fileName: {
        kind: 'parsed',
        brief:
          'Custom output filename. If not specified, uses the same name as the source file',
        parse: String,
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
    brief: 'Enhance PPOCRLabel files with sorting, normalization, and resizing',
  },
});
