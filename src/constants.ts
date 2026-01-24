export const DEFAULT_DETECT_IMAGE_SIZE = true;

export const DEFAULT_LABEL_NAME = 'Text';
export const DEFAULT_LABEL_STUDIO_FULL_JSON = true;
export const DEFAULT_CREATE_FILE_PER_IMAGE = false;
export const DEFAULT_CREATE_FILE_LIST_FOR_SERVING = true;
export const DEFAULT_FILE_LIST_NAME = 'files.txt';
export const DEFAULT_BASE_SERVER_URL = 'http://localhost:8081';

export const DEFAULT_PPOCR_FILE_NAME = 'Label.txt';

// Vertical sorting options
export const SORT_VERTICAL_NONE = 'none';
export const SORT_VERTICAL_TOP_BOTTOM = 'top-bottom';
export const SORT_VERTICAL_BOTTOM_TOP = 'bottom-top';
export const DEFAULT_SORT_VERTICAL = SORT_VERTICAL_NONE;

// Horizontal sorting options
export const SORT_HORIZONTAL_NONE = 'none';
export const SORT_HORIZONTAL_LTR = 'ltr';
export const SORT_HORIZONTAL_RTL = 'rtl';
export const DEFAULT_SORT_HORIZONTAL = SORT_HORIZONTAL_NONE;

export type VerticalSortOrder =
  | typeof SORT_VERTICAL_NONE
  | typeof SORT_VERTICAL_TOP_BOTTOM
  | typeof SORT_VERTICAL_BOTTOM_TOP;

export type HorizontalSortOrder =
  | typeof SORT_HORIZONTAL_NONE
  | typeof SORT_HORIZONTAL_LTR
  | typeof SORT_HORIZONTAL_RTL;

// Shape normalization options
export const SHAPE_NORMALIZE_NONE = 'none';
export const SHAPE_NORMALIZE_RECTANGLE = 'rectangle';
export const DEFAULT_SHAPE_NORMALIZE = SHAPE_NORMALIZE_NONE;

export type ShapeNormalizeOption =
  | typeof SHAPE_NORMALIZE_NONE
  | typeof SHAPE_NORMALIZE_RECTANGLE;

// Normalize transformer options
export const DEFAULT_USE_ORIENTED_BOX = false;

// Bounding box resize options
export const DEFAULT_WIDTH_INCREMENT = 0;
export const DEFAULT_HEIGHT_INCREMENT = 0;

// Adaptive resize options
export const DEFAULT_ADAPT_RESIZE_THRESHOLD = 128;
export const DEFAULT_ADAPT_RESIZE_MARGIN = 5;
export const DEFAULT_ADAPT_RESIZE_MIN_COMPONENT_SIZE = 10;
export const DEFAULT_ADAPT_RESIZE_MAX_COMPONENT_SIZE = 100000;
export const DEFAULT_ADAPT_RESIZE_OUTLIER_PERCENTILE = 2;
export const DEFAULT_ADAPT_RESIZE_MORPHOLOGY_SIZE = 2;
export const DEFAULT_ADAPT_RESIZE_MAX_HORIZONTAL_EXPANSION = 50;
export const DEFAULT_ADAPT_RESIZE_TIMEOUT_MS = 30000;
export const DEFAULT_ADAPT_RESIZE_MAX_BOX_SIZE = 3000;

// Number precision options
// For Label Studio: keep full precision (no rounding) by default
export const DEFAULT_LABEL_STUDIO_PRECISION = -1; // -1 means no rounding
// For PPOCR: round to integers
export const DEFAULT_PPOCR_PRECISION = 0;

// File reading options
export const DEFAULT_RECURSIVE = false;
// Default patterns for matching files - users can customize these
export const DEFAULT_PPOCR_FILE_PATTERN = '.*\\.txt$'; // Recommended: match .txt files
export const DEFAULT_LABEL_STUDIO_FILE_PATTERN = '.*\\.json$'; // Recommended: match .json files

// Output mode options (annotations vs predictions)
export const OUTPUT_MODE_ANNOTATIONS = 'annotations';
export const OUTPUT_MODE_PREDICTIONS = 'predictions';
export const DEFAULT_OUTPUT_MODE = OUTPUT_MODE_ANNOTATIONS;

export type OutputMode =
  | typeof OUTPUT_MODE_ANNOTATIONS
  | typeof OUTPUT_MODE_PREDICTIONS;

// Backup options
export const DEFAULT_BACKUP = false;
export const BACKUP_SUFFIX_PREFIX = 'backup-';
export const BACKUP_TIMESTAMP_FORMAT = 'YYYY-MM-DDTHH-MM-SS'; // ISO format with colons replaced by hyphens
