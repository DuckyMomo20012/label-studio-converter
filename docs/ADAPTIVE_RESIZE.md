# Adaptive Resize Algorithm

## Purpose

The adaptive resize transformer corrects tight bounding boxes in OCR datasets by intelligently expanding boxes to wrap around characters. Designed for Sino-Nom (Chữ Nôm) vertical text with challenges like:

- **Dirt and noise** in scanned images
- **Broken character strokes** requiring connection
- **Adjacent column interference** - must prevent overlaps
- **Outlier pixels** from scanning artifacts

## Algorithm Overview

The algorithm uses computer vision techniques to find optimal bounding boxes:

### 1. Morphological Image Processing

**Morphological Closing** (`morphologySize` parameter):

- Sequence: Dilation → Erosion with square kernel
- Connects broken character strokes without expanding overall shape
- Kernel size 2-3 pixels typical for standard resolution scans
- Larger kernels merge more gaps but risk connecting separate characters

### 2. Connected Component Analysis

After morphological operations, the algorithm:

- Applies **flood fill** to identify distinct regions
- Labels each connected region as a component
- Analyzes component size and spatial properties

**Size-based filtering** (`minComponentSize`, `maxComponentSize`):

- Removes dirt dots (too small, e.g., < 10 pixels)
- Filters huge artifacts (too large, e.g., > 100000 pixels)
- Prevents noise from affecting boundary detection

### 3. Percentile-based Boundary Detection

Instead of using absolute min/max coordinates (vulnerable to outliers):

**Outlier Removal** (`outlierPercentile` parameter):

- Collects all valid pixel coordinates from filtered components
- Sorts X and Y coordinates independently
- Ignores bottom `outlierPercentile`% and top `outlierPercentile`%
- Default 2% means: ignore 2% smallest + 2% largest on each axis

Example: 1000 valid pixels, 2% outlier

- Sort X coordinates, ignore 20 smallest + 20 largest
- Sort Y coordinates, ignore 20 smallest + 20 largest
- Use remaining 960 pixels for boundary

### 4. Horizontal Expansion Limiting

**Critical for vertical text** (`maxHorizontalExpansion` parameter):

- Calculates original box width
- Allows horizontal expansion up to `maxHorizontalExpansion` pixels per side
- Vertical expansion unlimited (characters can be tall)
- Prevents boxes from overlapping adjacent columns

Algorithm:

```
newLeft = max(detectedLeft, originalLeft - maxHorizontalExpansion)
newRight = min(detectedRight, originalRight + maxHorizontalExpansion)
newTop = detectedTop    // unlimited
newBottom = detectedBottom  // unlimited
```

### 5. Binary Thresholding

**Grayscale Conversion** (`threshold` parameter):

- Converts image region to grayscale (0-255)
- Pixels ≥ threshold → white (text)
- Pixels < threshold → black (background)
- Lower threshold (e.g., 100) captures lighter ink
- Higher threshold (e.g., 150) ignores faint marks

### 6. Margin Application

After detecting optimal boundaries:

- Add `margin` pixels on all sides
- Prevents cutting character edges
- Accounts for anti-aliasing and sub-pixel rendering
- Typical values: 3-10 pixels depending on resolution

## Algorithm Steps (Detailed)

```
For each bounding box:
  1. Calculate analysis region (original box + padding)
  2. Extract image region using Sharp
  3. Convert to grayscale
  4. Apply binary threshold
  5. Perform morphological closing:
     - Dilate with square kernel (morphologySize × morphologySize)
     - Erode with same kernel
  6. Run connected component analysis (flood fill)
  7. Filter components by size:
     - Discard if < minComponentSize
     - Discard if > maxComponentSize
  8. Collect all valid pixels (x,y coordinates)
  9. Sort coordinates independently:
     - X coordinates → remove outlierPercentile% from each end
     - Y coordinates → remove outlierPercentile% from each end
  10. Calculate boundaries from remaining pixels:
      - minX, maxX, minY, maxY
  11. Apply horizontal expansion limit:
      - Constrain horizontal growth to ±maxHorizontalExpansion
      - Allow unlimited vertical growth
  12. Add margin to final boundaries
  13. Convert back to original image coordinates
  14. Return new rectangle points
```

## Parameter Tuning Guide

### `threshold` (0-255, default: 128)

**Purpose**: Separates text from background in grayscale

**Tuning strategy**:

- Dark, crisp text on white → 130-150
- Light or faded ink → 100-120
- Test by viewing binary result: text should be white blobs, background black
- Too low: includes background noise
- Too high: loses thin character strokes

### `margin` (pixels, default: 5)

**Purpose**: Safety padding around detected content

**Tuning strategy**:

- Measure character stroke width (pixels)
- margin = 0.5-1.0 × stroke width
- Too small: may clip character edges during cropping
- Too large: includes neighboring characters
- Typical range: 3-10 pixels (depends on resolution)

### `minComponentSize` (pixels, default: 10)

**Purpose**: Filters small noise artifacts

**Tuning strategy**:

- Measure typical dirt dot size in your scans
- Set threshold slightly above dirt size
- Too low: includes noise dots
- Too high: removes small character parts (dots, commas)
- Calculate: minComponentSize ≈ (resolution_dpi / 300)² × 10

### `maxComponentSize` (pixels, default: 100000)

**Purpose**: Prevents huge artifacts from affecting bounds

**Tuning strategy**:

- Measure largest expected character (pixels)
- maxComponentSize = 2-3 × largest character area
- Useful when entire columns connect
- Rarely needs tuning unless characters are very large

### `outlierPercentile` (%, default: 2)

**Purpose**: Removes outlier pixels from boundary calculation

**Tuning strategy**:

- Start with 2%
- If single dirt dots expand boxes → increase to 3-5%
- If character parts cut off → decrease to 1%
- Higher resolution scans → can use higher percentile

### `morphologySize` (pixels, default: 2)

**Purpose**: Connects broken character strokes

**Tuning strategy**:

- Measure gap size in broken strokes
- morphologySize should be slightly larger than gap
- Too small: doesn't connect breaks
- Too large: merges separate characters
- Typical range: 1-4 pixels
- Scale with resolution: morphologySize ≈ resolution_dpi / 150

### `maxHorizontalExpansion` (pixels, default: 50)

**Purpose**: Prevents column overlap in vertical text

**Tuning strategy (CRITICAL)**:

1. Measure column spacing in your images (pixels between columns)
2. maxHorizontalExpansion = 0.4-0.6 × column_spacing
3. Example: 100px column spacing → maxHorizontalExpansion = 40-60
4. Too small: characters still tight horizontally
5. Too large: boxes overlap adjacent columns

Formula:

```
column_spacing = (image_width - total_text_width) / (num_columns - 1)
maxHorizontalExpansion = column_spacing × 0.5
```

## Resolution-dependent Scaling

For consistent results across resolutions:

| Resolution | morphologySize | margin | minComponentSize | maxHorizontalExpansion |
| ---------- | -------------- | ------ | ---------------- | ---------------------- |
| 150 DPI    | 1              | 3      | 5                | 25                     |
| 300 DPI    | 2              | 5      | 10               | 50                     |
| 600 DPI    | 4              | 10     | 40               | 100                    |

Scaling formula:

```
scaled_value = base_value × (actual_dpi / 300)
```

## Processing Pipeline Integration

### Recommended Transformer Order

1. **normalize** - Convert polygons to rectangles first
2. **adaptResize** - Expand tight boxes around characters
3. **sort** - Arrange in reading order

Rationale:

- normalize ensures rectangles (adaptResize expects rectangles)
- adaptResize fixes tight boxes before sorting
- sort uses final box positions for reading order

### Performance Characteristics

**Time complexity**: O(n × w × h) where:

- n = number of boxes
- w, h = average box dimensions

**Typical processing time**:

- Small box (50×50): 20-50ms
- Medium box (100×100): 50-100ms
- Large box (200×200): 100-200ms

**Memory usage**:

- Per-box processing (minimal global memory)
- Peak: 2-3× box pixel count during morphological operations
- Sharp uses streaming where possible

**Optimization tips**:

- Process in parallel batches (100-500 boxes per batch)
- Use lower resolution if acceptable (2× faster at 150 DPI vs 300 DPI)
- Reduce morphologySize for speed (less accurate but faster)

## Troubleshooting

### Boxes expanding too much vertically

**Cause**: Vertical expansion is unlimited by design

**Solutions**:

- Increase `minComponentSize` to filter connecting artifacts
- Increase `outlierPercentile` to ignore vertical outliers
- Post-process: `maxHeight = original_height × 1.5`

### Characters still cut off after resize

**Causes**:

1. `margin` too small
2. `threshold` too high (missing light strokes)
3. `minComponentSize` too high (removing character parts)

**Debugging**:

```typescript
// Save intermediate binary image to check threshold
const binary = await image.threshold(options.threshold);
await binary.toFile('debug_binary.png');
```

### Boxes overlapping adjacent columns

**Causes**:

1. `maxHorizontalExpansion` too large
2. Columns too close together
3. Characters extending between columns

**Solutions**:

- Measure actual column spacing
- Reduce `maxHorizontalExpansion` to 40-50% of spacing
- Increase `minComponentSize` to filter connecting artifacts
- Check if characters genuinely span columns (data issue)

### Dirt dots included in boxes

**Causes**:

1. `minComponentSize` too small
2. `outlierPercentile` too low
3. Large dirt connected to character by morphological closing

**Solutions**:

- Increase `minComponentSize` (test values: 12, 15, 20)
- Increase `outlierPercentile` (test 3%, 4%, 5%)
- Reduce `morphologySize` if dirt connects to text
- Pre-process images to remove dirt before detection

### Processing is slow

**Causes**:

- High resolution images
- Large boxes
- Many boxes to process

**Solutions**:

- Resize images to 150-300 DPI before processing
- Process in parallel batches (use `Promise.all()` with batch size 100-500)
- Reduce `morphologySize` (faster morphological operations)
- Use Sharp's resize with `fastShrinkOnLoad` option
- Consider caching: process once, save results

## Advanced: Algorithm Internals

### Morphological Closing Mathematics

Closing = Erosion(Dilation(Image, Kernel), Kernel)

**Dilation** expands white regions:

```
For each pixel (x,y):
  If any pixel in kernel neighborhood is white:
    Set (x,y) to white
```

**Erosion** shrinks white regions:

```
For each pixel (x,y):
  If all pixels in kernel neighborhood are white:
    Keep (x,y) white
  Else:
    Set (x,y) to black
```

Net effect: bridges gaps without overall expansion

### Connected Component Labeling

Algorithm: Flood fill with region growing

```
Initialize label = 0
For each white pixel (x,y):
  If pixel is unlabeled:
    label++
    Flood fill from (x,y) with label:
      - Add to queue
      - Mark with label
      - Add neighbors to queue
      - Repeat until queue empty
  Count pixels for this label (component size)
```

Result: Each white region has unique label, size known

### Percentile-based Bounds

Instead of min/max (affected by single outlier):

```
valid_pixels = [all pixels from valid components]
x_coords = sort([p.x for p in valid_pixels])
y_coords = sort([p.y for p in valid_pixels])

n = len(valid_pixels)
ignore = floor(n × outlierPercentile / 100)

min_x = x_coords[ignore]
max_x = x_coords[n - ignore - 1]
min_y = y_coords[ignore]
max_y = y_coords[n - ignore - 1]
```

Robust to noise while preserving true character extent

### Horizontal Expansion Limiting

```
original_width = original_box.right - original_box.left
original_center_x = (original_box.left + original_box.right) / 2

detected_left = min_x - margin
detected_right = max_x + margin

// Constrain expansion from original boundaries
max_allowed_left = original_box.left - maxHorizontalExpansion
max_allowed_right = original_box.right + maxHorizontalExpansion

final_left = max(detected_left, max_allowed_left)
final_right = min(detected_right, max_allowed_right)

// Vertical: no constraint
final_top = min_y - margin
final_bottom = max_y + margin
```

Ensures box cannot expand beyond column boundaries

## References and Related Work

**Morphological Image Processing**:

- Serra, J. (1982). _Image Analysis and Mathematical Morphology_
- Used extensively in document analysis and OCR pre-processing

**Connected Component Analysis**:

- Rosenfeld & Pfaltz (1966). Sequential operations in digital picture processing
- Fundamental technique in computer vision

**Percentile-based Outlier Detection**:

- Robust statistics approach, less sensitive than mean/stddev
- Common in astronomical image processing

**OCR Bounding Box Correction**:

- Smith, R. (2007). Tesseract OCR Engine
- Similar techniques for text region refinement
