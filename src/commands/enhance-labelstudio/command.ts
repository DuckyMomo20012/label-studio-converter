import { buildCommand } from '@stricli/core';
import {
  DEFAULT_BACKUP,
  DEFAULT_LABEL_STUDIO_FILE_PATTERN,
  DEFAULT_OUTPUT_MODE,
  DEFAULT_RECURSIVE,
  OUTPUT_MODE_ANNOTATIONS,
  OUTPUT_MODE_PREDICTIONS,
} from '@/constants';
import { baseEnhanceFlagOptions } from '@/lib';

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
        brief: `Regex pattern to match Label Studio files (should match .json files). Default: "${DEFAULT_LABEL_STUDIO_FILE_PATTERN}"`,
        parse: String,
        optional: true,
      },
      outputMode: {
        kind: 'parsed',
        brief: `Output mode: "${OUTPUT_MODE_ANNOTATIONS}" for editable annotations (ground truth) or "${OUTPUT_MODE_PREDICTIONS}" for read-only predictions (pre-annotations). Default: "${DEFAULT_OUTPUT_MODE}"`,
        parse: String,
        optional: true,
      },
      ...baseEnhanceFlagOptions,
    },
  },
  docs: {
    brief:
      'Enhance Label Studio files with sorting, normalization, and resizing',
  },
});
