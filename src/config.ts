import type { CommandContext, TypedCommandFlagParameters } from '@stricli/core';
import {
  DEFAULT_ADAPT_RESIZE_ADAPTIVE_BLOCK_SIZE,
  DEFAULT_ADAPT_RESIZE_MARGIN,
  DEFAULT_ADAPT_RESIZE_MAX_COMPONENT_SIZE,
  DEFAULT_ADAPT_RESIZE_MAX_HORIZONTAL_EXPANSION,
  DEFAULT_ADAPT_RESIZE_MIN_COMPONENT_SIZE,
  DEFAULT_ADAPT_RESIZE_MIN_PADDING_BRIGHTNESS,
  DEFAULT_ADAPT_RESIZE_MIN_PADDING_RATIO,
  DEFAULT_ADAPT_RESIZE_MORPHOLOGY_SIZE,
  DEFAULT_ADAPT_RESIZE_OUTLIER_PERCENTILE,
  DEFAULT_ADAPT_RESIZE_PADDING_CHECK_WIDTH,
  DEFAULT_ADAPT_RESIZE_THRESHOLD,
  DEFAULT_BACKUP,
  DEFAULT_COPY_IMAGES,
  DEFAULT_HEIGHT_INCREMENT,
  DEFAULT_IMAGE_BASE_DIR,
  DEFAULT_PPOCR_PRECISION,
  DEFAULT_RECURSIVE,
  DEFAULT_SHAPE_NORMALIZE,
  DEFAULT_SORT_HORIZONTAL,
  DEFAULT_SORT_VERTICAL,
  DEFAULT_USE_ORIENTED_BOX,
  DEFAULT_WIDTH_INCREMENT,
  IMAGE_BASE_DIR_INPUT_DIR,
  IMAGE_BASE_DIR_TASK_FILE,
  SHAPE_NORMALIZE_NONE,
  SHAPE_NORMALIZE_RECTANGLE,
  SORT_HORIZONTAL_LTR,
  SORT_HORIZONTAL_NONE,
  SORT_HORIZONTAL_RTL,
  SORT_VERTICAL_BOTTOM_TOP,
  SORT_VERTICAL_NONE,
  SORT_VERTICAL_TOP_BOTTOM,
} from '@/constants';

export type BaseFileIOOptions = {
  outDir?: string;
  fileName?: string;
  backup?: boolean;
  recursive?: boolean;
  filePattern?: string;
  copyImages?: boolean;
  imageBaseDir?: string;
};

export type BaseEnhanceOptions = {
  sortVertical?: string;
  sortHorizontal?: string;
  normalizeShape?: string;
  useOrientedBox?: boolean;
  widthIncrement?: number;
  heightIncrement?: number;
  adaptResize?: boolean;
  adaptResizeThreshold?: number;
  adaptResizeMargin?: number;
  adaptResizeMinComponentSize?: number;
  adaptResizeMaxComponentSize?: number;
  adaptResizeOutlierPercentile?: number;
  adaptResizeMorphologySize?: number;
  adaptResizeMaxHorizontalExpansion?: number;
  adaptResizePaddingCheckWidth?: number;
  adaptResizeMinPaddingBrightness?: number;
  adaptResizeMinPaddingRatio?: number;
  adaptResizeUseAdaptiveThreshold?: boolean;
  adaptResizeAdaptiveBlockSize?: number;
  precision?: number;
};

export const baseFileIOFlagOptions = {
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
      'Custom output filename. If not specified, uses default naming convention',
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
    brief: 'Regex pattern to match input files',
    parse: String,
    optional: true,
  },
  copyImages: {
    kind: 'boolean',
    brief: `Copy images to output directory when --outDir is specified. Only applies to toLabelStudio and toPPOCR commands. Default: ${DEFAULT_COPY_IMAGES}`,
    optional: true,
  },
  imageBaseDir: {
    kind: 'parsed',
    brief: `Base directory for resolving image paths. Options: "${IMAGE_BASE_DIR_TASK_FILE}" (relative to task file location), "${IMAGE_BASE_DIR_INPUT_DIR}" (relative to command execution directory). Default: "${DEFAULT_IMAGE_BASE_DIR}"`,
    parse: String,
    optional: true,
  },
} satisfies TypedCommandFlagParameters<
  BaseFileIOOptions,
  CommandContext
>['flags'];

export const baseEnhanceFlagOptions = {
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
  useOrientedBox: {
    kind: 'boolean',
    brief: `Use oriented (rotated) bounding box when normalizing shapes. Useful for skewed text. Default: ${DEFAULT_USE_ORIENTED_BOX}`,
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
  adaptResize: {
    kind: 'boolean',
    brief: `Apply adaptive resize to automatically adjust bounding boxes based on image content. Default: false`,
    optional: true,
  },
  adaptResizeThreshold: {
    kind: 'parsed',
    brief: `Grayscale threshold for adaptive resize (0-255). Default: ${DEFAULT_ADAPT_RESIZE_THRESHOLD}`,
    parse: Number,
    optional: true,
  },
  adaptResizeMargin: {
    kind: 'parsed',
    brief: `Margin pixels around detected content for adaptive resize. Default: ${DEFAULT_ADAPT_RESIZE_MARGIN}`,
    parse: Number,
    optional: true,
  },
  adaptResizeMinComponentSize: {
    kind: 'parsed',
    brief: `Minimum component size in pixels (filters dirt/noise). Default: ${DEFAULT_ADAPT_RESIZE_MIN_COMPONENT_SIZE}`,
    parse: Number,
    optional: true,
  },
  adaptResizeMaxComponentSize: {
    kind: 'parsed',
    brief: `Maximum component size in pixels (filters large artifacts). Default: ${DEFAULT_ADAPT_RESIZE_MAX_COMPONENT_SIZE}`,
    parse: Number,
    optional: true,
  },
  adaptResizeOutlierPercentile: {
    kind: 'parsed',
    brief: `Percentile for outlier removal (0-100). Default: ${DEFAULT_ADAPT_RESIZE_OUTLIER_PERCENTILE}`,
    parse: Number,
    optional: true,
  },
  adaptResizeMorphologySize: {
    kind: 'parsed',
    brief: `Morphological operation kernel size. Default: ${DEFAULT_ADAPT_RESIZE_MORPHOLOGY_SIZE}`,
    parse: Number,
    optional: true,
  },
  adaptResizeMaxHorizontalExpansion: {
    kind: 'parsed',
    brief: `Maximum horizontal expansion in pixels (prevents column overlap). Default: ${DEFAULT_ADAPT_RESIZE_MAX_HORIZONTAL_EXPANSION}`,
    parse: Number,
    optional: true,
  },
  adaptResizePaddingCheckWidth: {
    kind: 'parsed',
    brief: `Width of padding strip to validate (in pixels). Default: ${DEFAULT_ADAPT_RESIZE_PADDING_CHECK_WIDTH}`,
    parse: Number,
    optional: true,
  },
  adaptResizeMinPaddingBrightness: {
    kind: 'parsed',
    brief: `Minimum brightness for white padding pixels (0-255). Default: ${DEFAULT_ADAPT_RESIZE_MIN_PADDING_BRIGHTNESS}`,
    parse: Number,
    optional: true,
  },
  adaptResizeMinPaddingRatio: {
    kind: 'parsed',
    brief: `Minimum ratio of white pixels in padding strip (0-1). Default: ${DEFAULT_ADAPT_RESIZE_MIN_PADDING_RATIO}`,
    parse: Number,
    optional: true,
  },
  adaptResizeUseAdaptiveThreshold: {
    kind: 'boolean',
    brief: 'Use adaptive thresholding based on image histogram (recommended)',
    optional: true,
  },
  adaptResizeAdaptiveBlockSize: {
    kind: 'parsed',
    brief: `Block size for adaptive thresholding. Default: ${DEFAULT_ADAPT_RESIZE_ADAPTIVE_BLOCK_SIZE}`,
    parse: Number,
    optional: true,
  },
  precision: {
    kind: 'parsed',
    brief: `Number of decimal places for coordinates. Use -1 for full precision (no rounding). Default: ${DEFAULT_PPOCR_PRECISION} (integers)`,
    parse: Number,
    optional: true,
  },
} satisfies TypedCommandFlagParameters<
  BaseEnhanceOptions,
  CommandContext
>['flags'];
