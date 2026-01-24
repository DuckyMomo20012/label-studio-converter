import { buildCommand } from '@stricli/core';
import {
  DEFAULT_BASE_SERVER_URL,
  DEFAULT_CREATE_FILE_LIST_FOR_SERVING,
  DEFAULT_CREATE_FILE_PER_IMAGE,
  DEFAULT_FILE_LIST_NAME,
  DEFAULT_LABEL_NAME,
  DEFAULT_LABEL_STUDIO_FULL_JSON,
  DEFAULT_OUTPUT_MODE,
  DEFAULT_PPOCR_FILE_PATTERN,
  OUTPUT_MODE_ANNOTATIONS,
  OUTPUT_MODE_PREDICTIONS,
} from '@/constants';
import { baseEnhanceFlagOptions, baseFileIOFlagOptions } from '@/lib';

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
      ...baseFileIOFlagOptions,
      ...baseEnhanceFlagOptions,
      fileName: {
        kind: 'parsed',
        brief:
          'Custom output filename (without extension). If not specified, uses source filename with format suffix',
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
      filePattern: {
        kind: 'parsed',
        brief: `Regex pattern to match PPOCRLabel files (should match .txt files). Default: "${DEFAULT_PPOCR_FILE_PATTERN}"`,
        parse: String,
        optional: true,
      },
      outputMode: {
        kind: 'parsed',
        brief: `Output mode: "${OUTPUT_MODE_ANNOTATIONS}" for editable annotations (ground truth) or "${OUTPUT_MODE_PREDICTIONS}" for read-only predictions (pre-annotations). Default: "${DEFAULT_OUTPUT_MODE}"`,
        parse: String,
        optional: true,
      },
    },
  },
  docs: {
    brief: 'Convert PPOCRLabel files to Label Studio format',
  },
});
