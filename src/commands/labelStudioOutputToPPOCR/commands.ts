import { buildCommand } from '@stricli/core';
import { pick } from 'es-toolkit';
import {
  DEFAULT_LABEL_STUDIO_OUTPUT_IMAGE_BASE_DIR,
  DEFAULT_PPOCR_FILE_NAME,
} from '@/constants';
import { baseFileIOFlagOptions } from '@/lib';

export const labelStudioOutputToPPOCRCommand = buildCommand({
  loader: async () => {
    const { labelStudioOutputToPPOCR } = await import('./impl');
    return labelStudioOutputToPPOCR;
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
      ...pick(baseFileIOFlagOptions, ['recursive', 'backup', 'filePattern']),
      outDir: {
        kind: 'parsed',
        brief: 'Output directory.',
        parse: String,
        optional: false,
      },
      fileName: {
        kind: 'parsed',
        brief: `Output PPOCR file name. Default: "${DEFAULT_PPOCR_FILE_NAME}"`,
        parse: String,
        optional: true,
      },
      removeBaseImageDir: {
        kind: 'parsed',
        parse: String,
        brief: `Remove base image directory from image paths in output. Default: "${DEFAULT_LABEL_STUDIO_OUTPUT_IMAGE_BASE_DIR}"`,
        optional: true,
      },
      generateFileState: {
        kind: 'boolean',
        brief: 'Generate a file state file for each input directory',
        optional: true,
      },
    },
  },
  docs: {
    brief: 'Convert Label Studio output files to PPOCRLabel format',
  },
});
