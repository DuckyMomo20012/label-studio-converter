# Sino Nom Box Adjustment Transformer

## Overview

The Sino Nom Box Adjustment transformer is specifically designed to handle tight bounding boxes in Chinese and Sino-Vietnamese (Sino Nom) text images. The transformer expands boxes by detecting vertical separator lines between text columns and aligning box boundaries to these separators.

## Problem Statement

When detecting text in Sino Nom documents, OCR engines often produce bounding boxes that are too tight and cut off character strokes. Since Sino Nom text is written vertically in columns from right to left with clear vertical separators between columns, we can use these separators to intelligently expand the boxes without overlapping adjacent columns.

## How It Works

The transformer follows these steps:

1. **Load Image**: Reads the image and converts it to grayscale
2. **Adaptive Thresholding**: Applies thresholding to create a binary image
3. **Vertical Projection**: Calculates column-wise text density
4. **Separator Detection**: Identifies valleys in the projection as separator lines
5. **Box Sorting**: Orders boxes from left to right, top to bottom
6. **Box Adjustment**: Expands each box to the nearest left and right separators

## Usage

### As a Library

```typescript
import {
  sinoNomAdjustTransformer,
  PPOCRInput,
  FullOCRLabelStudioOutput,
  Processor,
  withOptions,
} from 'label-studio-converter';

const processor = new Processor({
  input: PPOCRInput,
  output: FullOCRLabelStudioOutput,
  transformers: [
    withOptions(sinoNomAdjustTransformer, {
      threshold: 128,
      minLineLength: 100,
      lineDetectionMargin: 2,
      boxPadding: 5,
      timeoutMs: 10000,
    }),
  ],
});

// Process your tasks
const result = await processor.process({
  inputData: yourPPOCRTask,
  resolveInputImagePath: (path) => path,
  resolveOutputImagePath: (path) => path,
});
```

### Configuration Options

| Option                | Type   | Default | Description                                                                     |
| --------------------- | ------ | ------- | ------------------------------------------------------------------------------- |
| `threshold`           | number | 128     | Grayscale threshold for binarization (0-255). Lower values detect more as text. |
| `minLineLength`       | number | 100     | Minimum vertical length (in pixels) for a line to be considered a separator     |
| `lineDetectionMargin` | number | 2       | Horizontal margin (in pixels) when checking for continuous separator lines      |
| `boxPadding`          | number | 5       | Padding (in pixels) added between box edge and separator line                   |
| `timeoutMs`           | number | 10000   | Maximum processing time per box in milliseconds                                 |

### Constant Exports

All default values are exported as constants from `@/constants`:

```typescript
import {
  DEFAULT_SINO_NOM_THRESHOLD,
  DEFAULT_SINO_NOM_MIN_LINE_LENGTH,
  DEFAULT_SINO_NOM_LINE_DETECTION_MARGIN,
  DEFAULT_SINO_NOM_BOX_PADDING,
  DEFAULT_SINO_NOM_TIMEOUT_MS,
} from 'label-studio-converter';
```

## Image Rotation Support

The transformer includes optional image rotation utilities for cases where text needs to be reoriented:

```typescript
import {
  rotateImage,
  rotateForVerticalText,
  createImageBackup,
} from 'label-studio-converter';

// Rotate image with backup
await rotateImage('path/to/image.jpg', {
  angle: 90,
  createBackup: true,
  backupSuffix: '.backup',
});

// Auto-detect rotation (placeholder for future enhancement)
const { path, angle } = await rotateForVerticalText('path/to/image.jpg', {
  createBackup: true,
});

// Manual backup creation
const backupPath = await createImageBackup('path/to/image.jpg', '.bak');
```

## Algorithm Details

### Vertical Separator Detection

The separator detection algorithm:

1. Calculates a **vertical projection** by summing text pixels in each column
2. Identifies **valleys** where column density is significantly lower than surrounding areas
3. Validates separators by checking for **continuous empty space** along the column
4. Filters out false positives using configurable thresholds

### Box Adjustment

For each bounding box:

1. Finds the nearest separator line to the left (or uses padding if none exists)
2. Finds the nearest separator line to the right (or uses padding if none exists)
3. Expands the box horizontally to align with these boundaries
4. Maintains original vertical (top/bottom) boundaries

### Processing Order

Boxes are processed in reading order (left-to-right, top-to-bottom) to maintain logical document structure.

## Performance Considerations

- **Timeout Protection**: Each box has a configurable timeout to prevent hanging
- **Memory Efficient**: Processes images using Sharp's streaming capabilities
- **Parallel Processing**: Multiple boxes are adjusted in parallel using `Promise.all`

## Differences from `adapt-resize` Transformer

| Feature                | `adapt-resize`                                        | `sino-nom-adjust`                                   |
| ---------------------- | ----------------------------------------------------- | --------------------------------------------------- |
| **Purpose**            | General text box expansion using connected components | Sino Nom specific expansion using column separators |
| **Detection Method**   | Connected component analysis with morphology          | Vertical projection and valley detection            |
| **Expansion Strategy** | Expands based on nearby text components               | Expands to nearest vertical separator lines         |
| **Complexity**         | Higher (includes outlier removal, morphology)         | Lower (focused on vertical separators)              |
| **Best For**           | Mixed layouts, arbitrary text orientations            | Vertical columnar text (Chinese, Sino Nom)          |

## Example: Before and After

```
Before (tight boxes):
┌──┐  ┌──┐  ┌──┐
│文│  │字│  │例│
│本│  │符│  │子│
└──┘  └──┘  └──┘

After (adjusted to separators):
┌────┐ ┌────┐ ┌────┐
│ 文 │ │ 字 │ │ 例 │
│ 本 │ │ 符 │ │ 子 │
└────┘ └────┘ └────┘
```

## Limitations

- **Assumes vertical text layout**: Designed for traditional Chinese/Sino Nom writing
- **Simple thresholding**: Uses global threshold rather than local adaptive (can be enhanced)
- **No rotation detection**: Currently requires pre-rotated images (rotation detection is a placeholder)

## Future Enhancements

- [ ] Local adaptive thresholding for better separator detection
- [ ] Automatic text orientation detection
- [ ] Support for mixed horizontal/vertical layouts
- [ ] Machine learning-based separator detection
- [ ] Configurable column detection strategies

## Related Modules

- [`separator-detector.ts`](./separator-detector.ts): Core vertical line detection logic
- [`image-rotation.ts`](./image-rotation.ts): Image rotation and backup utilities
- [Original `adapt-resize` transformer](../adapt-resize/): General-purpose box expansion

## Contributing

When modifying this transformer:

1. Follow the project's naming conventions (camelCase for options, UPPER_SNAKE_CASE for constants)
2. Add corresponding constants to `src/constants.ts`
3. Export new functions from `src/lib/index.ts`
4. Add tests to validate behavior
5. Update this documentation
