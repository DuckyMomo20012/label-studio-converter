# Adaptive Resize Transformer for Sino-Nom OCR

## Purpose

The `adaptResizeTransformer` is specifically designed for **correcting tight bounding boxes** in Sino-Nom (Chữ Nôm) OCR datasets. It intelligently expands boxes to properly wrap around characters while handling common challenges:

- **Dirt and noise** in scanned images
- **Two horizontal characters** occasionally appearing in the same row
- **Adjacent column interference** - preventing boxes from overlapping neighboring columns
- **Broken character strokes** that need to be connected

## How It Works

### 1. Noise Filtering

- **Morphological closing** connects broken character strokes
- **Connected component analysis** identifies distinct regions
- **Size-based filtering** removes dirt dots (too small) and large artifacts (too big)

### 2. Outlier Removal

- Uses **percentile-based boundaries** instead of absolute min/max
- Ignores the smallest/largest 2% of pixels by default
- Prevents single dirt dots from expanding the box unnecessarily

### 3. Smart Expansion Control

- **`maxHorizontalExpansion`** limits how far boxes can expand horizontally
- Prevents overlap with adjacent columns in vertical text
- Allows vertical expansion for full character height

### 4. Analysis Padding

- Analyzes a padded region around the original box
- Catches nearby character parts that were cut off
- Ensures complete character coverage

## Usage

### Basic Example

```typescript
import { adaptResizeTransformer, withOptions } from 'label-studio-converter';

const options = {
  threshold: 128, // Grayscale threshold (0-255)
  margin: 5, // Final margin around detected content
  minComponentSize: 10, // Minimum pixels for valid component (filters dirt)
  maxComponentSize: 100000, // Maximum pixels (filters huge artifacts)
  outlierPercentile: 2, // Ignore 2% outliers on each side
  morphologySize: 2, // Kernel size for morphological operations
  maxHorizontalExpansion: 50, // Max pixels to expand horizontally
};

const transformers = [withOptions(adaptResizeTransformer, options)];
```

### With Conversion Pipeline

```typescript
import {
  enhancePPOCRLabel,
  adaptResizeTransformer,
  withOptions,
} from 'label-studio-converter';

const enhanced = await enhancePPOCRLabel(ppocrData, {
  // First normalize to rectangles
  normalizeShape: 'rectangle',

  // Then apply adaptive resize
  adaptiveResize: true,
  adaptResizeThreshold: 128,
  adaptResizeMargin: 5,
  adaptResizeMinComponentSize: 10,
  adaptResizeMaxHorizontalExpansion: 50,

  // Finally sort for reading order
  sortVertical: 'top-bottom',
  sortHorizontal: 'ltr',
});
```

## Parameter Guide

### `threshold` (default: 128)

- Grayscale threshold for detecting text vs background
- Lower value (e.g., 100) captures lighter text
- Higher value (e.g., 150) ignores faint marks
- **Recommendation for Sino-Nom**: 120-140 depending on scan quality

### `margin` (default: 5)

- Additional padding pixels around detected content
- Too small: may cut off character edges
- Too large: may include neighboring characters
- **Recommendation for Sino-Nom**: 5-10 pixels

### `minComponentSize` (default: 10)

- Minimum pixels for a region to be considered valid text
- Filters out small dirt dots and noise
- Lower value: keeps smaller marks
- Higher value: more aggressive noise filtering
- **Recommendation for Sino-Nom**: 8-15 (depends on scan resolution)

### `maxComponentSize` (default: 100000)

- Maximum pixels for a valid component
- Prevents huge artifacts from being included
- Useful if entire columns are connected
- **Recommendation for Sino-Nom**: 50000-200000 (depends on character size)

### `outlierPercentile` (default: 2)

- Percentage of pixels to ignore as outliers (each side)
- 2 means ignore 2% smallest and 2% largest coordinates
- Lower value (1): less outlier filtering
- Higher value (5): more aggressive outlier removal
- **Recommendation for Sino-Nom**: 2-3%

### `morphologySize` (default: 2)

- Kernel size for morphological closing operation
- Connects broken character strokes
- Larger value: connects more gaps but may merge separate characters
- Smaller value: preserves details but may miss connections
- **Recommendation for Sino-Nom**: 1-3 pixels

### `maxHorizontalExpansion` (default: 50)

- **Most important for Sino-Nom vertical text!**
- Maximum pixels boxes can expand horizontally
- Prevents boxes from overlapping adjacent columns
- Should be roughly half the space between columns
- **Recommendation for Sino-Nom**: 30-80 pixels (measure your column spacing)

## Tuning for Your Dataset

### Step 1: Measure Your Images

```bash
# Measure typical column spacing in your images
# maxHorizontalExpansion should be ~ 40-60% of column spacing
```

### Step 2: Test on Sample

```typescript
// Start with conservative settings
const conservative = {
  threshold: 128,
  margin: 5,
  minComponentSize: 12,
  maxHorizontalExpansion: 40, // Half your column spacing
  outlierPercentile: 2,
};

// Test on 10-20 samples, then adjust
```

### Step 3: Common Adjustments

**If boxes are still too tight:**

- Decrease `threshold` (e.g., 110-120)
- Increase `margin` (e.g., 8-10)
- Decrease `minComponentSize` (e.g., 8)
- Increase `morphologySize` (e.g., 3)

**If boxes are overlapping columns:**

- Decrease `maxHorizontalExpansion` (e.g., 30)
- Increase `minComponentSize` to filter small gaps

**If dirt dots are included:**

- Increase `minComponentSize` (e.g., 15-20)
- Increase `outlierPercentile` (e.g., 3-4)

**If character strokes are disconnected:**

- Increase `morphologySize` (e.g., 3-4)
- Decrease `threshold` (e.g., 120)

## Example Workflow

```typescript
import {
  ppocrToFullLabelStudioConverters,
  adaptResizeTransformer,
  withOptions,
} from 'label-studio-converter';

// 1. Convert PPOCR to Label Studio with adaptive resize
const labelStudioData = await ppocrToFullLabelStudioConverters(ppocrData, {
  baseServerUrl: 'http://localhost:8081',
  normalizeShape: 'rectangle',

  // Add adaptive resize to the pipeline
  transformers: [
    withOptions(adaptResizeTransformer, {
      threshold: 128,
      margin: 7,
      minComponentSize: 12,
      maxHorizontalExpansion: 45,
      outlierPercentile: 2,
      morphologySize: 2,
    }),
  ],
});

// 2. Export for image cropping
// Now boxes properly wrap characters without overlap
```

## Performance Notes

- Processing time: ~50-200ms per box (depends on box size)
- Memory usage: Minimal (processes each box independently)
- Recommended: Process in batches of 100-500 boxes at a time for large datasets
- Uses Sharp (native C++ bindings) for fast image processing

## Troubleshooting

### "Boxes expanding too much vertically"

- This is usually OK for Sino-Nom (characters can be tall)
- If needed, you can post-process to limit vertical expansion

### "Some characters still cut off"

- Increase `margin` parameter
- Decrease `threshold` to capture lighter strokes
- Check if original detection missed character parts

### "Boxes merging into adjacent columns"

- Decrease `maxHorizontalExpansion`
- Increase `minComponentSize` to filter small connecting artifacts
- Check your column spacing measurement

### "Processing is slow"

- Use lower resolution images if possible
- Process in parallel batches
- Consider reducing `morphologySize` (faster but less stroke connection)

## Algorithm Details

1. **Extract padded ROI** around original box
2. **Grayscale + Threshold** to binary image
3. **Morphological Closing** (dilate → erode) to connect strokes
4. **Connected Component Analysis** using flood fill
5. **Filter components** by size (remove noise)
6. **Collect valid pixels** from all components
7. **Percentile-based boundaries** to ignore outliers
8. **Limit horizontal expansion** to prevent column overlap
9. **Add margin** and convert back to image coordinates
10. **Return new rectangle** points
