<div align="center">

  <h1>label-studio-converter</h1>

  <p>
    Convert between Label Studio OCR format and PPOCRLabelv2 format
  </p>

</div>

<br />

<!-- Table of Contents -->

# :notebook_with_decorative_cover: Table of Contents

- [Getting Started](#toolbox-getting-started)
  - [Prerequisites](#bangbang-prerequisites)
  - [Installation](#package-installation)
  - [Run Locally](#running-run-locally)
- [Usage](#eyes-usage)
  - [Library Usage](#library-usage)
  - [CLI Usage](#cli-usage)
    - [Available Commands](#available-commands)
    - [Command Flags Reference](#command-flags-reference)
      - [Flags Available for All Commands](#flags-available-for-all-commands)
      - [Flags Specific to toLabelStudio Command](#flags-specific-to-tolabelstudio-command)
      - [Flags Specific to toPPOCR Command](#flags-specific-to-toppocr-command)
      - [Flags Specific to enhance-labelstudio Command](#flags-specific-to-enhance-labelstudio-command)
      - [Image Path Resolution Logic](#image-path-resolution-logic)
    - [Image Path Resolution Logic](#image-path-resolution-logic)
      - [toLabelStudio: PPOCRLabel → Label Studio](#tolabelstudio-ppocrlabel--label-studio)
      - [toPPOCR: Label Studio → PPOCRLabel](#toppocr-label-studio--ppocrlabel)
      - [enhance-labelstudio: Label Studio Enhancement](#enhance-labelstudio-label-studio--label-studio-enhanced)
      - [enhance-ppocr: PPOCRLabel Enhancement](#enhance-ppocr-ppocrlabel--ppocrlabel-enhanced)
    - [Adaptive Resize Feature](#adaptive-resize-feature)
    - [Detailed Command Help](#detailed-command-help)
      - [toLabelStudio Command](#tolabelstudio-command)
      - [toPPOCR Command](#toppocr-command)
      - [enhance-labelstudio Command](#enhance-labelstudio-command)
      - [enhance-ppocr Command](#enhance-ppocr-command)
    - [Examples](#examples)
      - [Basic Conversion](#basic-conversion)
      - [Enhancement Pipeline](#enhancement-pipeline)
      - [File Organization](#file-organization)
      - [Shape Normalization](#shape-normalization)
  - [Using generated files with Label Studio](#using-generated-files-with-label-studio)
    - [Interface setup](#interface-setup)
    - [Serving annotation files locally](#serving-annotation-files-locally)
  - [Using generated files with PPOCRLabelv2](#using-generated-files-with-ppocrlabelv2)
  - [Conversion Margin of Error](#conversion-margin-of-error)
  - [Delete Generated Files](#delete-generated-files)
- [Roadmap](#compass-roadmap)
- [Contributing](#wave-contributing)
  - [Code of Conduct](#scroll-code-of-conduct)
- [License](#warning-license)
- [Contact](#handshake-contact)
- [Acknowledgements](#gem-acknowledgements)

<!-- Getting Started -->

## :toolbox: Getting Started

<!-- Prerequisites -->

### :bangbang: Prerequisites

- This project uses [pnpm](https://pnpm.io/) as package manager:

  ```bash
  npm install --global pnpm
  ```

- [Label Studio](https://labelstud.io/): Tested with version `1.22.0` and above.

- PPOCRLabelv2 from
  [`PFCCLab/PPOCRLabel`](https://github.com/PFCCLab/PPOCRLabel): Tested with
  latest commit
  [04928bf](https://github.com/PFCCLab/PPOCRLabel/tree/04928bf015656e41ba5569877df9b0666ca90f89)

- [Node.js](https://nodejs.org/): Tested with version `22.x` and above.

<!-- Installation -->

### :package: Installation

**As a CLI tool:**

```bash
npm install -g label-studio-converter
```

**As a library:**

```bash
npm install label-studio-converter
# or
pnpm add label-studio-converter
# or
yarn add label-studio-converter
```

<!-- Run Locally -->

### :running: Run Locally

Clone the project:

```bash
git clone https://github.com/DuckyMomo20012/label-studio-converter.git
```

Go to the project directory:

```bash
cd label-studio-converter
```

Install dependencies:

```bash
pnpm install
```

<!-- Usage -->

## :eyes: Usage

> [!IMPORTANT]
> This tool only supports conversion between PPOCRLabelv2 format and Label
> Studio ["OCR"
> template](https://labelstud.io/templates/optical_character_recognition). For
> setting up Label Studio for OCR tasks, please refer to the [Using generated
> files with Label Studio](#using-generated-files-with-label-studio) section.

> [!NOTE]
> **This package can be used both as a CLI tool and as a library.**
>
> - **CLI**: Run commands directly from the terminal
> - **Library**: Import and use functions in your TypeScript/JavaScript code

### Library Usage

**Conversion Functions:**

```ts
import {
  fullLabelStudioToPPOCRConverters,
  minLabelStudioToPPOCRConverters,
  ppocrToLabelStudio
} from 'label-studio-converter';

// Convert Label Studio Full Format to PPOCRLabel
const fullData = [...]; // FullOCRLabelStudio type
const ppocrMap = await fullLabelStudioToPPOCRConverters(fullData, {
  baseImageDir: 'images/ch',
  normalizeShape: 'rectangle',
  widthIncrement: 5,
  heightIncrement: 5,
  precision: 0 // integers
});

// Convert Label Studio Min Format to PPOCRLabel
const minData = [...]; // MinOCRLabelStudio type
const ppocrMap2 = await minLabelStudioToPPOCRConverters(minData, {
  baseImageDir: 'images/ch',
  precision: 0
});

// Convert PPOCRLabel to Label Studio
const ppocrData = [...]; // PPOCRLabel type
const labelStudioData = await ppocrToLabelStudio(ppocrData, {
  imagePath: 'example.jpg',
  baseServerUrl: 'http://localhost:8081',
  inputDir: './images',
  toFullJson: true,
  labelName: 'Text',
  precision: -1 // full precision
});
```

**Enhancement Functions:**

```ts
import {
  enhancePPOCRLabel,
  enhanceLabelStudioData,
} from 'label-studio-converter';

// Enhance PPOCRLabel data
const enhanced = enhancePPOCRLabel(ppocrData, {
  sortVertical: 'top-bottom',
  sortHorizontal: 'ltr',
  normalizeShape: 'rectangle',
  widthIncrement: 10,
  heightIncrement: 5,
  precision: 0,
});

// Enhance Label Studio data (Full or Min format)
const enhancedLS = await enhanceLabelStudioData(
  labelStudioData,
  true, // isFull: true for Full format, false for Min format
  {
    sortVertical: 'top-bottom',
    normalizeShape: 'rectangle',
    precision: 2,
  },
);
```

**Utility Functions:**

```ts
import {
  transformPoints,
  normalizeShape,
  resizeBoundingBox,
  sortBoundingBoxes,
} from 'label-studio-converter';

// Transform points (normalize + resize)
const transformed = transformPoints(points, {
  normalizeShape: 'rectangle',
  widthIncrement: 10,
  heightIncrement: 5,
});

// Normalize diamond shapes to rectangles
const normalized = normalizeShape(points);

// Resize bounding box
const resized = resizeBoundingBox(points, 10, 5);

// Sort bounding boxes
const sorted = sortBoundingBoxes(annotations, 'top-bottom', 'ltr');
```

### CLI Usage

#### Available Commands

```bash
label-studio-converter --help
```

**Output:**

```
USAGE
  label-studio-converter toLabelStudio [--outDir value] [--fileName value] [--backup] [--defaultLabelName value] [--toFullJson] [--createFilePerImage] [--createFileListForServing] [--fileListName value] [--baseServerUrl value] [--sortVertical value] [--sortHorizontal value] [--normalizeShape value] [--widthIncrement value] [--heightIncrement value] [--precision value] [--recursive] [--filePattern value] [--outputMode value] <args>...
  label-studio-converter toPPOCR [--outDir value] [--fileName value] [--backup] [--baseImageDir value] [--sortVertical value] [--sortHorizontal value] [--normalizeShape value] [--widthIncrement value] [--heightIncrement value] [--precision value] [--recursive] [--filePattern value] <args>...
  label-studio-converter enhance-labelstudio [--outDir value] [--fileName value] [--backup] [--sortVertical value] [--sortHorizontal value] [--normalizeShape value] [--widthIncrement value] [--heightIncrement value] [--precision value] [--recursive] [--filePattern value] [--outputMode value] <args>...
  label-studio-converter enhance-ppocr [--outDir value] [--fileName value] [--backup] [--sortVertical value] [--sortHorizontal value] [--normalizeShape value] [--widthIncrement value] [--heightIncrement value] [--precision value] [--recursive] [--filePattern value] <args>...
  label-studio-converter --help
  label-studio-converter --version

Convert between Label Studio OCR format and PPOCRLabelv2 format

FLAGS
  -h --help     Print help information and exit
  -v --version  Print version information and exit

COMMANDS
  toLabelStudio        Convert PPOCRLabel files to Label Studio format
  toPPOCR              Convert Label Studio files to PPOCRLabel format
  enhance-labelstudio  Enhance Label Studio files with sorting, normalization, and resizing
  enhance-ppocr        Enhance PPOCRLabel files with sorting, normalization, and resizing
```

#### Command Flags Reference

##### Flags Available for All Commands

**File I/O Flags:**

- `--outDir <path>`: Output directory path
  - **Behavior**: Saves converted/enhanced files to specified directory
  - **Default**: Same directory as input files
  - **Example**: `--outDir ./output` saves all files to `./output/`

- `--fileName <name>`: Custom output filename
  - **Behavior**: Renames output file (without extension for JSON, with extension for txt)
  - **Default**:
    - toLabelStudio: `{source}_full.json` or `{source}_min.json`
    - toPPOCR: `Label.txt`
    - enhance commands: Same as input filename
  - **Example**: `--fileName MyLabels.txt` creates `MyLabels.txt` instead of `Label.txt`

- `--backup` / `--noBackup`: Create backup before overwriting
  - **Behavior**: Copies existing file to `{filename}.backup` before overwriting
  - **Default**: `false` (no backup)
  - **Example**: `--backup` creates `Label.txt.backup` if `Label.txt` exists

- `--recursive` / `--noRecursive`: Search subdirectories
  - **Behavior**: Processes files in all subdirectories recursively
  - **Default**: `false` (current directory only)
  - **Example**: `--recursive` processes `./data/train/Label.txt` and `./data/test/Label.txt`

- `--filePattern <regex>`: Pattern to match input files
  - **Behavior**: Only processes files matching regex pattern
  - **Default**:
    - PPOCRLabel commands: `.*\.txt$` (all .txt files)
    - Label Studio commands: `.*\.json$` (all .json files)
  - **Example**: `--filePattern "train_.*\.txt$"` only processes files starting with `train_`

- `--copyImages` / `--noCopyImages`: Copy images when using --outDir
  - **Behavior**: When --outDir is specified, automatically copies/moves images to output directory alongside converted files
  - **Default**: `true` (copy images)
  - **Example**: `--noCopyImages` keeps images in original location, only copies task files
  - **Note**: Only applies to toLabelStudio and toPPOCR converters when --outDir is used

- `--imageBaseDir <dir>`: Controls output directory structure when copying images
  - **Behavior**: Determines how the directory structure is preserved when copying images to output directory
  - **Options**: `task-file` (relative to task file), `input-dir` (relative to input directory)
  - **Default**: `task-file`
  - **Example**: `--imageBaseDir input-dir --copyImages` preserves full path structure from input directory
  - **Use case**: Control whether copied images maintain full path from input directory or relative to task file
  - **Note**: Only affects output when --copyImages is used with --outDir

**Enhancement Flags:**

- `--sortVertical <order>`: Vertical sorting order
  - **Behavior**: Sorts bounding boxes by vertical position
  - **Options**: `none`, `top-bottom`, `bottom-top`
  - **Default**: `none` (no sorting)
  - **Example**: `--sortVertical top-bottom` sorts boxes from top to bottom

- `--sortHorizontal <order>`: Horizontal sorting order
  - **Behavior**: Sorts bounding boxes by horizontal position (applied after vertical sort)
  - **Options**: `none`, `ltr` (left-to-right), `rtl` (right-to-left)
  - **Default**: `none` (no sorting)
  - **Example**: `--sortHorizontal rtl` sorts boxes right-to-left (for vertical text)

- `--normalizeShape <option>`: Shape normalization
  - **Behavior**: Converts diamond/rotated shapes to axis-aligned rectangles
  - **Options**: `none`, `rectangle`
  - **Default**: `none` (preserve original shapes)
  - **Example**: `--normalizeShape rectangle` converts all polygons to rectangles

- `--widthIncrement <pixels>`: Adjust box width
  - **Behavior**: Adds pixels to box width (can be negative to shrink)
  - **Default**: `0` (no change)
  - **Example**: `--widthIncrement 5` expands boxes by 5px horizontally

- `--heightIncrement <pixels>`: Adjust box height
  - **Behavior**: Adds pixels to box height (can be negative to shrink)
  - **Default**: `0` (no change)
  - **Example**: `--heightIncrement -3` shrinks boxes by 3px vertically

- `--precision <decimals>`: Coordinate precision
  - **Behavior**: Number of decimal places for coordinates
  - **Default**:
    - toLabelStudio: `-1` (full precision, no rounding)
    - toPPOCR: `0` (integers only)
    - enhance-labelstudio: `-1` (full precision)
    - enhance-ppocr: `0` (integers)
  - **Example**: `--precision 2` rounds to 2 decimal places (e.g., 123.45)

**Adaptive Resize Flags (Advanced):**

- `--adaptResize` / `--noAdaptResize`: Enable intelligent box resizing
  - **Behavior**: Uses image analysis to shrink oversized boxes to fit actual text
  - **Default**: `false` (disabled)
  - **Use Case**: Sino-Nom OCR datasets with excessive padding
  - **Example**: `--adaptResize` enables feature with default parameters

- `--adaptResizeThreshold <0-255>`: Grayscale threshold
  - **Behavior**: Pixels ≥ threshold are considered text (white), < threshold are background (black)
  - **Default**: `128`
  - **Example**: `--adaptResizeThreshold 140` for darker text on light background

- `--adaptResizeMargin <pixels>`: Padding around detected content
  - **Behavior**: Additional pixels added on all sides after detection
  - **Default**: `5`
  - **Example**: `--adaptResizeMargin 8` adds 8px padding

- `--adaptResizeMinComponentSize <pixels>`: Noise filter
  - **Behavior**: Regions smaller than this are ignored (filters dirt dots)
  - **Default**: `10`
  - **Example**: `--adaptResizeMinComponentSize 15` filters more aggressively

- `--adaptResizeMaxComponentSize <pixels>`: Artifact filter
  - **Behavior**: Regions larger than this are ignored (filters huge artifacts)
  - **Default**: `100000`
  - **Example**: `--adaptResizeMaxComponentSize 50000` for smaller characters

- `--adaptResizeOutlierPercentile <%>`: Outlier removal
  - **Behavior**: Ignores this % of smallest and largest pixels when calculating boundaries
  - **Default**: `2` (ignore 2% on each end)
  - **Example**: `--adaptResizeOutlierPercentile 3` for more aggressive outlier removal

- `--adaptResizeMorphologySize <pixels>`: Stroke connection
  - **Behavior**: Kernel size for connecting broken character strokes
  - **Default**: `2`
  - **Example**: `--adaptResizeMorphologySize 3` connects larger gaps

- `--adaptResizeMaxHorizontalExpansion <pixels>`: Column overlap prevention
  - **Behavior**: Maximum pixels boxes can expand horizontally (CRITICAL for vertical text)
  - **Default**: `50`
  - **Example**: `--adaptResizeMaxHorizontalExpansion 30` for closely-spaced columns

##### Flags Specific to toLabelStudio Command

- `--defaultLabelName <name>`: Default label for annotations
  - **Behavior**: Label assigned to all text regions
  - **Default**: `"Text"`
  - **Example**: `--defaultLabelName "Handwriting"` labels all regions as Handwriting

- `--toFullJson` / `--noToFullJson`: Output format
  - **Behavior**: `true` = Full format (more metadata), `false` = Min format (compact)
  - **Default**: `true` (Full format)
  - **Example**: `--noToFullJson` creates minimal format files

- `--createFilePerImage` / `--noCreateFilePerImage`: File splitting
  - **Behavior**: `true` = one JSON per image, `false` = all tasks in one file
  - **Default**: `false` (single file)
  - **Example**: `--createFilePerImage` creates `image1.json`, `image2.json`, etc.

- `--createFileListForServing` / `--noCreateFileListForServing`: Generate file list
  - **Behavior**: Creates `files.txt` with image URLs for Label Studio import
  - **Default**: `true` (create file list)
  - **Example**: `--noCreateFileListForServing` skips file list creation

- `--fileListName <name>`: File list filename
  - **Behavior**: Name of the file containing image URLs for serving
  - **Default**: `"files.txt"`
  - **Example**: `--fileListName "images.txt"` creates `images.txt` instead

- `--baseServerUrl <url>`: Base URL for images
  - **Behavior**: Prepended to image paths in output JSON (e.g., for local HTTP server)
  - **Default**: `"http://localhost:8081"`
  - **Example**: `--baseServerUrl "http://192.168.1.100:8080"` for network access

- `--outputMode <mode>`: Annotation mode
  - **Behavior**:
    - `annotations` = editable ground truth annotations
    - `predictions` = read-only pre-annotations
  - **Default**: `"annotations"`
  - **Example**: `--outputMode predictions` for model predictions import

##### Flags Specific to toPPOCR Command

- `--baseImageDir <path>`: Image directory prefix
  - **Behavior**: Prepended to image filenames in output `Label.txt`
  - **Default**: Empty string (no prefix)
  - **Example**: `--baseImageDir "images/ch"` writes `images/ch/example.jpg` in Label.txt

##### Flags Specific to enhance-labelstudio Command

- `--outputMode <mode>`: Same as toLabelStudio command
  - See toLabelStudio flags section above

#### Image Path Resolution Logic

Understanding how image paths are resolved is critical for organizing your files before conversion. The key is knowing **where you run the command** and **what input parameter you provide**.

> **New in v1.5.0**: The `--imageBaseDir` flag controls the output directory structure when copying images. It determines whether copied images maintain their path relative to the task file (`task-file`, default) or the input directory (`input-dir`).

##### toLabelStudio: PPOCRLabel → Label Studio

**INPUT Resolution (Reading PPOCRLabel files):**

**Command Execution Context:**

- You run: `cd project && label-studio-converter toLabelStudio data/`
- Current working directory (CWD): `project/`
- Input parameter: `data/` (directory to search for Label.txt files)
- Converter finds: `project/data/Label.txt` (and other Label.txt files in subdirectories if --recursive)
- Task file being processed: `project/data/Label.txt`

**How Image Paths Are Read:**

1. **What's in the Label.txt file**:
   - Path format: `data/example.jpg` (PPOCRLabel standard: folder/filename)
   - PPOCRLabel was opened on `data/` folder, so paths use `data/` prefix

2. **How input resolver finds images**:
   - Reads path from Label.txt: `data/example.jpg`
   - Task file is at: `project/data/Label.txt`
   - Task directory: `project/data/`
   - Check if path starts with task folder name (`data/`):
     - YES → resolve from parent: `dirname(project/data/) + data/example.jpg` = `project/data/example.jpg`
     - NO → resolve from task dir: `project/data/ + example.jpg` = `project/data/example.jpg`

**OUTPUT Resolution (Copying images with --copyImages --outDir):**

**With `--imageBaseDir task-file` (default):**

When copying images to output directory, paths are maintained **relative to the task file location**:

- Input directory: `project/data/` (provided to command)
- Source image: `project/data/foo/bar/baz/example.jpg`
- Task file: `project/data/Label.txt`
- Output dir: `project/output/`
- Relative from task: `relative(project/data/, project/data/foo/bar/baz/example.jpg)` = `foo/bar/baz/example.jpg`
- Destination: `project/output/data/foo/bar/baz/example.jpg` (maintains structure relative to task file)

**With `--imageBaseDir input-dir`:**

When copying images to output directory, paths are maintained **relative to input directory**:

- Input directory: `project/data/` (provided to command)
- Source image: `project/data/foo/bar/baz/example.jpg`
- Output dir: `project/output/`
- Relative from input: `relative(project/data/, project/data/foo/bar/baz/example.jpg)` = `foo/bar/baz/example.jpg`
- Destination: `project/output/foo/bar/baz/example.jpg` (maintains path from input directory)
  - Path relative to CWD: `data/example.jpg`
  - (From input resolution step)

2. **How output resolver formats paths**:
   - No --outDir: Compute relative path from output JSON to image
   - Output JSON at: `project/data/Label_full.json`
   - Image at: `project/data/example.jpg`
   - Relative path: `relative(project/data/, project/data/example.jpg)` = `example.jpg`
   - Apply baseServerUrl: `http://localhost:8081/example.jpg`

3. **What goes in the output file**:
   - Label Studio JSON: `"ocr": "http://localhost:8081/example.jpg"`

**File Organization Examples:**

<details>
<summary><b>Example 1: Default Location (No --outDir)</b></summary>

**Setup**: Images and output in same place as task file

```
project/
└── data/
    ├── Label.txt              # Contains: data/example.jpg	[...]
    └── example.jpg
```

**Command:**

```bash
cd project
label-studio-converter toLabelStudio data/
```

**Result:**

```
project/
└── data/
    ├── Label.txt              # Original task file
    ├── Label_full.json        # NEW: Generated output
    ├── files.txt              # NEW: File list for serving
    └── example.jpg            # Original image (unchanged)
```

**Generated Label_full.json contains:**

```json
{
  "data": {
    "ocr": "http://localhost:8081/example.jpg"
  }
}
```

**Image Path Flow:**

- Input path in Label.txt: `data/example.jpg`
- Resolved path: `data/example.jpg` (relative to CWD)
- Output saved in: `data/` (same as task)
- Relative to output: `example.jpg`
- Final URL: `http://localhost:8081/example.jpg`

</details>

<details>
<summary><b>Example 2: With --outDir Configuration</b></summary>

**Setup**: Separate output directory for organized export

```
project/
├── data/
│   ├── Label.txt              # Contains: data/example.jpg	[...]
│   └── example.jpg
└── output/                    # Target output directory
```

**Command:**

```bash
cd project
label-studio-converter toLabelStudio data/ \
  --outDir output \
  --baseServerUrl http://localhost:8081
```

**Result:**

```
project/
├── data/
│   ├── Label.txt              # Original (unchanged)
│   └── example.jpg            # Original (unchanged)
└── output/                    # NEW: All outputs here
    ├── Label_full.json        # NEW: Generated tasks
    ├── files.txt              # NEW: File list
    └── example.jpg            # NEW: Copied from source
```

**Generated Label_full.json contains:**

```json
{
  "data": {
    "ocr": "http://localhost:8081/example.jpg"
  }
}
```

**Image Path Flow:**

- Input path in Label.txt: `data/example.jpg`
- Resolved path: `data/example.jpg` (relative to CWD)
- Copied to: `output/example.jpg`
- Relative to output: `example.jpg`
- Final URL: `http://localhost:8081/example.jpg`

</details>

##### toPPOCR: Label Studio → PPOCRLabel

**INPUT Resolution (Reading Label Studio JSON):**

**Command Execution Context:**

- You run: `cd project && label-studio-converter toPPOCR data/`
- Current working directory (CWD): `project/`
- Input parameter: `data/` (directory to search for JSON files)
- Converter finds: `project/data/export.json` (and other JSON files in subdirectories if --recursive)
- Task file being processed: `project/data/export.json`

**How Image Paths Are Read:**

1. **What's in the JSON file**:
   - Local path: `"ocr": "/example.jpg"` or `"ocr": "example.jpg"`
   - OR Remote URL: `"ocr": "http://localhost:8081/example.jpg"`

2. **How input resolver finds/downloads images**:
   - **Local path** (`/example.jpg` or `example.jpg`):
     - Strip leading slashes: `/example.jpg` → `example.jpg`
     - Task directory: `project/data/`
     - Resolve: `project/data/ + example.jpg` = `project/data/example.jpg`
   - **Remote URL** (`http://localhost:8081/example.jpg`):
     - Extract filename: `basename(URL)` = `example.jpg`
     - Download to task directory: `project/data/example.jpg`

**OUTPUT Resolution (Copying images with --copyImages --outDir):**

**With `--imageBaseDir task-file` (default):**

When copying images to output directory, paths are maintained **relative to the task file location**:

- Input directory: `project/data/` (provided to command)
- Source image: `project/data/foo/bar/baz/example.jpg`
- Task file: `project/data/export.json`
- Output dir: `project/output/`
- Relative from task: `relative(project/data/, project/data/foo/bar/baz/example.jpg)` = `foo/bar/baz/example.jpg`
- Destination: `project/output/data/foo/bar/baz/example.jpg` (maintains structure relative to task file)

**With `--imageBaseDir input-dir`:**

When copying images to output directory, paths are maintained **relative to input directory**:

- Input directory: `project/data/` (provided to command)
- Source image: `project/data/foo/bar/baz/example.jpg`
- Output dir: `project/output/`
- Relative from input: `relative(project/data/, project/data/foo/bar/baz/example.jpg)` = `foo/bar/baz/example.jpg`
- Destination: `project/output/foo/bar/baz/example.jpg` (maintains path from input directory)

**How Resolvers Work:**

1. **What the processor has**:
   - Path relative to CWD: `data/example.jpg`
   - (From input resolution step)

2. **How output resolver formats paths**:
   - Extract filename: `basename(data/example.jpg)` = `example.jpg`
   - Determine folder prefix:
     - No --baseImageDir: Use output directory basename
     - Output at: `project/data/Label.txt` → folder is `data`
     - Result: `data/example.jpg`
   - With --baseImageDir="images": Result would be `images/example.jpg`

3. **What goes in the output file**:
   - PPOCRLabel Label.txt: `data/example.jpg	[{"transcription":"Text",...}]`
   - **Important**: Path in Label.txt is a reference format, NOT the physical location
   - Physical images stay in task directory (`data/`), but Label.txt uses folder prefix

**File Organization Examples:**

<details>
<summary><b>Example 1: Default Location (No --outDir)</b></summary>

**Setup**: Export Label.txt to same directory as task

```
project/
└── data/
    └── export.json            # Contains: "ocr": "http://localhost:8081/example.jpg"
```

**Command:**

```bash
cd project
label-studio-converter toPPOCR data/ \
  --baseImageDir data
```

**Result:**

```
project/
└── data/
    ├── export.json            # Original (unchanged)
    ├── Label.txt              # NEW: Generated PPOCR file
    └── example.jpg            # NEW: Downloaded from server
```

**Generated Label.txt contains:**

```
data/example.jpg	[{"transcription":"Text","points":[[...]],"dt_score":1}]
```

**Image Path Flow:**

- Input URL in JSON: `http://localhost:8081/example.jpg`
- **Downloaded to**: `data/example.jpg` (task file directory)
- Resolved path: `data/example.jpg` (relative to CWD)
- Extracted filename: `example.jpg`
- baseImageDir: `data`
- Output in Label.txt: `data/example.jpg`

</details>

<details>
<summary><b>Example 2: With --outDir Configuration</b></summary>

**Setup**: Organize output in separate directory

```
project/
├── data/
│   └── export.json            # Contains: "ocr": "http://localhost:8081/example.jpg"
└── output/                    # Target output directory
```

**Command:**

```bash
cd project
label-studio-converter toPPOCR data/ \
  --outDir output
```

**Result:**

```
project/
├── data/
│   ├── export.json            # Original (unchanged)
│   └── example.jpg            # Downloaded, then copied to output
└── output/
    ├── Label.txt              # NEW: Generated PPOCR file
    └── example.jpg            # NEW: Copied from data/
```

**Generated Label.txt contains:**

```
output/example.jpg	[{"transcription":"Text","points":[[...]],"dt_score":1}]
```

**Image Path Flow:**

- Input URL in JSON: `http://localhost:8081/example.jpg`
- **Downloaded to**: `data/example.jpg` (task file directory)
- **Copied to**: `output/example.jpg` (because --outDir specified)
- Resolved path: `data/example.jpg` (relative to CWD)
- Output dir: `output/`
- Extracted filename: `example.jpg`
- Output folder name: `output`
- Output in Label.txt: `output/example.jpg`

**Note**: Images are automatically copied to output directory. Use `--noCopyImages` to skip copying.

</details>

##### enhance-labelstudio: Label Studio → Label Studio (Enhanced)

**INPUT Resolution**: Same as `toPPOCR` converter

- Reads Label Studio JSON files
- Resolves local paths relative to task file
- Downloads remote URLs to task file directory

**OUTPUT Resolution**: Same as `toLabelStudio` converter

- Generates Label Studio JSON with `data.ocr` URLs
- Applies `baseServerUrl` formatting
- Computes relative paths from output location to images

##### enhance-ppocr: PPOCRLabel → PPOCRLabel (Enhanced)

**INPUT Resolution**: Same as `toLabelStudio` converter

- Reads PPOCRLabel Label.txt files
- Resolves paths with folder pattern (`folder/file.jpg`)
- Detects folder name and resolves from parent directory

**OUTPUT Resolution**: Same as `toPPOCR` converter

- Generates PPOCRLabel Label.txt with `folder/filename.jpg` format
- Uses `baseImageDir` or output directory basename as folder prefix
- Extracts filename from resolved path, prepends folder name

---

**Key Concepts:**

1. **Path Resolution Flow**:
   - Input converters resolve paths to **task-relative paths** (relative to task file location)
   - Processor receives and operates on these **task-relative paths**
   - Output converters format these paths for the target system

2. **Remote Image Handling**:
   - URLs (`http://` or `https://`) are downloaded to **task file directory**
   - Only filename is extracted from URL (path structure ignored)
   - Example: `http://server.com/deep/path/example.jpg` → saved as `task-dir/example.jpg`

3. **Image Organization** (toLabelStudio & toPPOCR):
   - **No --outDir**: Output files created in task directory, images stay in place
   - **With --outDir**: Output files go to outDir, **images automatically copied** to outDir (unless --noCopyImages)
   - **--noCopyImages**: Skip image copying, only create task files in outDir
   - **enhance commands**: Images always stay in original location

4. **Output Path Format**:
   - **toLabelStudio**: `${baseServerUrl}/${relativePath}` where relativePath is from output JSON to image
   - **toPPOCR**: `${folder}/${filename}` where folder is `baseImageDir` or output directory name

#### Adaptive Resize Feature

For detailed algorithm documentation and tuning guide, see [ADAPTIVE_RESIZE.md](docs/ADAPTIVE_RESIZE.md).

**Quick Overview:**

- **Purpose**: Shrinks oversized boxes to fit actual text content (essential for Sino-Nom OCR with excessive padding)
- **Algorithm**: Morphological operations + connected component analysis + percentile-based outlier removal
- **Usage**: Enable with `--adaptResize` flag, tune with 7 parameters documented above

#### Detailed Command Help

##### toLabelStudio Command

```bash
label-studio-converter toLabelStudio --help
```

**Output:**

```
USAGE
  label-studio-converter toLabelStudio [--outDir value] [--fileName value] [--backup] [--defaultLabelName value] [--toFullJson] [--createFilePerImage] [--createFileListForServing] [--fileListName value] [--baseServerUrl value] [--sortVertical value] [--sortHorizontal value] [--normalizeShape value] [--widthIncrement value] [--heightIncrement value] [--precision value] [--recursive] [--filePattern value] [--outputMode value] <args>...
  label-studio-converter toLabelStudio --help

Convert PPOCRLabel files to Label Studio format

FLAGS
     [--outDir]                                                 Output directory. If not specified, files are saved in the same directory as the source files
     [--fileName]                                               Custom output filename (without extension). If not specified, uses source filename with format suffix
     [--backup/--noBackup]                                      Create backup of existing files before overwriting. Default: false
     [--defaultLabelName]                                       Default label name for text annotations. Default: "Text"
     [--toFullJson/--noToFullJson]                              Convert to Full OCR Label Studio format. Default: "true"
     [--createFilePerImage/--noCreateFilePerImage]              Create a separate Label Studio JSON file for each image. Default: "false"
     [--createFileListForServing/--noCreateFileListForServing]  Create a file list for serving in Label Studio. Default: "true"
     [--fileListName]                                           Name of the file list for serving. Default: "files.txt"
     [--baseServerUrl]                                          Base server URL for constructing image URLs in the file list. Default: "http://localhost:8081"
     [--sortVertical]                                           Sort bounding boxes vertically. Options: "none", "top-bottom", "bottom-top". Default: "none"
     [--sortHorizontal]                                         Sort bounding boxes horizontally. Options: "none", "ltr", "rtl". Default: "none"
     [--normalizeShape]                                         Normalize diamond-like shapes to axis-aligned rectangles. Options: "none", "rectangle". Default: "none"
     [--widthIncrement]                                         Increase bounding box width by this amount (in pixels). Can be negative to decrease. Default: 0
     [--heightIncrement]                                        Increase bounding box height by this amount (in pixels). Can be negative to decrease. Default: 0
     [--precision]                                              Number of decimal places for coordinates. Use -1 for full precision (no rounding). Default: -1
     [--recursive/--noRecursive]                                Recursively search directories for files. Default: false
     [--filePattern]                                            Regex pattern to match PPOCRLabel files (should match .txt files). Default: ".*\.txt$"
     [--outputMode]                                             Output mode: "annotations" for editable annotations (ground truth) or "predictions" for read-only predictions (pre-annotations). Default: "annotations"
  -h  --help                                                    Print help information and exit

ARGUMENTS
  args...  Input directories containing PPOCRLabel files
```

##### toPPOCR Command

```bash
label-studio-converter toPPOCR --help
```

**Output:**

```
USAGE
  label-studio-converter toPPOCR [--outDir value] [--fileName value] [--backup] [--baseImageDir value] [--sortVertical value] [--sortHorizontal value] [--normalizeShape value] [--widthIncrement value] [--heightIncrement value] [--precision value] [--recursive] [--filePattern value] <args>...
  label-studio-converter toPPOCR --help

Convert Label Studio files to PPOCRLabel format

FLAGS
     [--outDir]                   Output directory. If not specified, files are saved in the same directory as the source files
     [--fileName]                 Output PPOCR file name. Default: "Label.txt"
     [--backup/--noBackup]        Create backup of existing files before overwriting. Default: false
     [--baseImageDir]             Base directory path to prepend to image filenames in output (e.g., "ch" or "images/ch")
     [--sortVertical]             Sort bounding boxes vertically. Options: "none", "top-bottom", "bottom-top". Default: "none"
     [--sortHorizontal]           Sort bounding boxes horizontally. Options: "none", "ltr", "rtl". Default: "none"
     [--normalizeShape]           Normalize diamond-like shapes to axis-aligned rectangles. Options: "none", "rectangle". Default: "none"
     [--widthIncrement]           Increase bounding box width by this amount (in pixels). Can be negative to decrease. Default: 0
     [--heightIncrement]          Increase bounding box height by this amount (in pixels). Can be negative to decrease. Default: 0
     [--precision]                Number of decimal places for coordinates. Use -1 for full precision (no rounding). Default: 0 (integers)
     [--recursive/--noRecursive]  Recursively search directories for files. Default: false
     [--filePattern]              Regex pattern to match Label Studio files (should match .json files). Default: ".*\.json$"
  -h  --help                      Print help information and exit

ARGUMENTS
  args...  Input directories containing Label Studio files
```

##### enhance-labelstudio Command

```bash
label-studio-converter enhance-labelstudio --help
```

**Output:**

```
USAGE
  label-studio-converter enhance-labelstudio [--outDir value] [--fileName value] [--backup] [--sortVertical value] [--sortHorizontal value] [--normalizeShape value] [--widthIncrement value] [--heightIncrement value] [--precision value] [--recursive] [--filePattern value] [--outputMode value] <args>...
  label-studio-converter enhance-labelstudio --help

Enhance Label Studio files with sorting, normalization, and resizing

FLAGS
     [--outDir]                   Output directory. If not specified, files are saved in the same directory as the source files
     [--fileName]                 Custom output filename. If not specified, uses the same name as the source file
     [--backup/--noBackup]        Create backup of existing files before overwriting. Default: false
     [--sortVertical]             Sort bounding boxes vertically. Options: "none", "top-bottom", "bottom-top". Default: "none"
     [--sortHorizontal]           Sort bounding boxes horizontally. Options: "none", "ltr", "rtl". Default: "none"
     [--normalizeShape]           Normalize diamond-like shapes to axis-aligned rectangles. Options: "none", "rectangle". Default: "none"
     [--widthIncrement]           Increase bounding box width by this amount (in pixels). Can be negative to decrease. Default: 0
     [--heightIncrement]          Increase bounding box height by this amount (in pixels). Can be negative to decrease. Default: 0
     [--precision]                Number of decimal places for coordinates. Use -1 for full precision (no rounding). Default: -1
     [--recursive/--noRecursive]  Recursively search directories for files. Default: false
     [--filePattern]              Regex pattern to match Label Studio files (should match .json files). Default: ".*\.json$"
     [--outputMode]               Output mode: "annotations" for editable annotations (ground truth) or "predictions" for read-only predictions (pre-annotations). Default: "annotations"
  -h  --help                      Print help information and exit

ARGUMENTS
  args...  Input directories containing Label Studio JSON files
```

##### enhance-ppocr Command

```bash
label-studio-converter enhance-ppocr --help
```

**Output:**

```
USAGE
  label-studio-converter enhance-ppocr [--outDir value] [--fileName value] [--backup] [--sortVertical value] [--sortHorizontal value] [--normalizeShape value] [--widthIncrement value] [--heightIncrement value] [--precision value] [--recursive] [--filePattern value] <args>...
  label-studio-converter enhance-ppocr --help

Enhance PPOCRLabel files with sorting, normalization, and resizing

FLAGS
     [--outDir]                   Output directory. If not specified, files are saved in the same directory as the source files
     [--fileName]                 Custom output filename. If not specified, uses the same name as the source file
     [--backup/--noBackup]        Create backup of existing files before overwriting. Default: false
     [--sortVertical]             Sort bounding boxes vertically. Options: "none", "top-bottom", "bottom-top". Default: "none"
     [--sortHorizontal]           Sort bounding boxes horizontally. Options: "none", "ltr", "rtl". Default: "none"
     [--normalizeShape]           Normalize diamond-like shapes to axis-aligned rectangles. Options: "none", "rectangle". Default: "none"
     [--widthIncrement]           Increase bounding box width by this amount (in pixels). Can be negative to decrease. Default: 0
     [--heightIncrement]          Increase bounding box height by this amount (in pixels). Can be negative to decrease. Default: 0
     [--precision]                Number of decimal places for coordinates. Use -1 for full precision (no rounding). Default: 0 (integers)
     [--recursive/--noRecursive]  Recursively search directories for files. Default: false
     [--filePattern]              Regex pattern to match PPOCRLabel files (should match .txt files). Default: ".*\.txt$"
  -h  --help                      Print help information and exit

ARGUMENTS
  args...  Input directories containing PPOCRLabel files
```

#### Examples

##### Basic Conversion

```bash
# PPOCRLabel → Label Studio
label-studio-converter toLabelStudio ./input-ppocr --outDir ./output

# Label Studio → PPOCRLabel
label-studio-converter toPPOCR ./input-label-studio --outDir ./output --baseImageDir images/ch

# File-per-image + custom server URL
label-studio-converter toLabelStudio ./input-ppocr \
  --outDir ./output \
  --createFilePerImage \
  --baseServerUrl http://192.168.1.100:8080

# Predictions format (read-only pre-annotations)
label-studio-converter toLabelStudio ./input-ppocr --outputMode predictions
```

##### Enhancement Pipeline

```bash
# Sort + normalize + resize
label-studio-converter enhance-ppocr ./data \
  --sortVertical top-bottom \
  --sortHorizontal ltr \
  --normalizeShape rectangle \
  --widthIncrement 5 \
  --heightIncrement 5

# Adaptive resize for Sino-Nom OCR (shrinks oversized boxes)
label-studio-converter enhance-ppocr ./sinonom-data \
  --adaptResize \
  --adaptResizeThreshold 128 \
  --adaptResizeMargin 8 \
  --adaptResizeMaxHorizontalExpansion 50 \
  --sortHorizontal rtl

# Convert with full enhancement pipeline
label-studio-converter toLabelStudio ./input-ppocr \
  --outDir ./output \
  --normalizeShape rectangle \
  --adaptResize \
  --sortVertical top-bottom
```

##### File Organization

```bash
# Recursive search with pattern matching
label-studio-converter toLabelStudio ./dataset \
  --recursive \
  --filePattern "train_.*\.txt$"

# Custom output filenames
label-studio-converter toPPOCR ./data \
  --outDir ./output \
  --fileName MyLabels.txt

# Using imageBaseDir for flexible path resolution
# Default: resolve from task file location
label-studio-converter toLabelStudio ./annotations/

# Copy images maintaining full directory structure from execution directory
label-studio-converter toLabelStudio ./annotations/ \
  --copyImages \
  --imageBaseDir input-dir \
  --outDir ./output
```

##### Shape Normalization

Diamond/rotated shapes → axis-aligned rectangles:

```bash
label-studio-converter enhance-ppocr ./data \
  --normalizeShape rectangle \
  --outDir ./normalized
```

<details>
<summary>Visual comparison</summary>

**Before:** Diamond-like shapes

![Before normalization](./docs/images/label-studio-original-diamond.png)

**After:** Axis-aligned rectangles

![After normalization](./docs/images/label-studio-converted-diamond.png)

**Vertical text example:**

![Before (vertical)](./docs/images/label-studio-original-diamond-vert.png)
![After (vertical)](./docs/images/label-studio-converted-diamond-vert.png)

</details>

> [!NOTE]
> **Key Behaviors:**
>
> - Remote images (`http://`, `https://`) are automatically downloaded
> - Path resolution: `${baseServerUrl}/${relativeToOutDir}/image.jpg`
> - All PPOCRLabel positions treated as polygons in Label Studio
> - Missing images use fallback dimensions (1920×1080) and log warning

```bash
./dist/cli.js toPPOCR ./tmp --baseImageDir output --normalizeShape rectangle
```

![After normalization (vert)](./docs/images/label-studio-converted-diamond-vert.png)

</details>

### Using generated files with Label Studio

#### Interface setup

When creating a new labeling project in Label Studio, choose the ["OCR"
template](https://labelstud.io/templates/optical_character_recognition).
This will set up the appropriate interface for text recognition tasks.

This project uses the following Label Studio interface configuration:

```xml
<View>
	<Image name="image" value="$ocr" zoom="false" rotateControl="true" zoomControl="false"/>
	<Labels name="label" toName="image">
		<Label value="Text" background="green"/>
		<Label value="Handwriting" background="blue"/>
	</Labels>
	<Rectangle name="bbox" toName="image" strokeWidth="3"/>
	<Polygon name="poly" toName="image" strokeWidth="3"/>
	<TextArea name="transcription" toName="image" editable="true" perRegion="true" required="false" maxSubmissions="1" rows="5" placeholder="Recognized Text" displayMode="region-list"/>
</View>
```

This setup includes:

- An `Image` tag to display the image to be annotated.
- A `Labels` tag with two label options: `Text` and `Handwriting`. By default,
  all annotations will be labeled as `Text`. You can modify this based on your
  needs.
- A `Rectangle` tag to allow annotators to draw bounding boxes around text regions.
- A `Polygon` tag to allow annotators to draw polygons around text regions.
- A `TextArea` tag for annotators to input the recognized text for each region.

> [!IMPORTANT]
> Make sure that the `Image` tag's `value` attribute is set to `$ocr`, as this
> is where the image URLs will be populated from the generated JSON files.

#### Serving annotation files locally

To serve the generated Label Studio annotation files and images locally, you can
follow official [Label Studio
documentation](https://labelstud.io/guide/tasks#Import-data-from-a-local-directory).

1. Start a simple HTTP server in the output directory containing the generated
   Label Studio files. You can use Python's built-in HTTP server for this:

   ```bash
   cd ./output-label-studio
   python3 -m http.server 8081
   ```

   or using `http-server` from npm:

   ```bash
   npx http-server -p 8081 --cors
   ```

> [!IMPORTANT]
> Ensure that the port number (e.g., `8081`) matches the `baseServerUrl` used
> during conversion.

> [!NOTE]
> The server may have to be configured CORS settings to allow Label Studio to
> access the files. Refer to the documentation of the server you are using for
> instructions on how to enable CORS.

2. Add the file directory as source storage in Label Studio, by following the official
   [Label Studio
   documentation](https://labelstud.io/guide/tasks#Import-data-from-a-local-directory).

   By default, the generated file list is named `files.txt`. before running the
   command below, ensure that the `files.txt` is copied to the `./myfiles`
   directory.

   The following command starts a Docker container with the latest image of
   Label Studio with port 8080 and an environment variable that allows Label
   Studio to access local files. In this example, a local directory `./myfiles`
   is mounted to the `/label-studio/files` location.

   ```bash
   docker run -it -p 8080:8080 -v $(pwd)/mydata:/label-studio/data \
     --env LABEL_STUDIO_LOCAL_FILES_SERVING_ENABLED=true \
     --env LABEL_STUDIO_LOCAL_FILES_DOCUMENT_ROOT=/label-studio/files \
     -v $(pwd)/myfiles:/label-studio/files \
     heartexlabs/label-studio:latest label-studio
   ```

3. Open your web browser and navigate to `http://localhost:8080` to access
   Label Studio.

4. Create a new project or open an existing one, and go to the "Import" tab.

5. Import the generated tasks to Label Studio.

### Using generated files with PPOCRLabelv2

PPOCRLabelv2 has many Github repositories, but we have tested the generated
files with the following repository:

- [`PFCCLab/PPOCRLabel`](https://github.com/PFCCLab/PPOCRLabel).

Generated files can be used by placing them in the appropriate directory
structure as expected by PPOCRLabelv2, by replaceing the existing `Label.txt`
files in the dataset directories.

If the images are put in a different directory, make sure to update the image
directory path by specifying the `baseImageDir` option during conversion.

### Conversion Margin of Error

During conversion between two formats, which are PPOCRLabelv2 and Label Studio,
margin of errors may occur due to differences in how each format handles certain
aspects of the data.

**Convert from Label Studio to PPOCRLabelv2**

Label Studio annotation:

![Label Studio annotation](./docs/images/label-studio-original-example.png)

Generated PPOCRLabelv2 annotation:

![PPOCRLabelv2 annotation](./docs/images/ppocr-label-converted-example.png)

Converted back to Label Studio annotation:

![Converted back to Label Studio annotation](./docs/images/label-studio-converted-back-example.png)

<details>
<summary>
  <b>Original data</b>:
</summary>

```json
[
  {
    "id": 1,
    "annotations": [
      {
        "id": 201,
        "completed_by": 1,
        "result": [
          {
            "original_width": 889,
            "original_height": 520,
            "image_rotation": 0,
            "value": {
              "x": 27.691012033297714,
              "y": 58.08133472367049,
              "width": 42.14645223570203,
              "height": 5.4223149113660085,
              "rotation": 0
            },
            "id": "pa6F68vZpa",
            "from_name": "bbox",
            "to_name": "image",
            "type": "rectangle",
            "origin": "manual"
          },
          {
            "original_width": 889,
            "original_height": 520,
            "image_rotation": 0,
            "value": {
              "x": 27.691012033297714,
              "y": 58.08133472367049,
              "width": 42.14645223570203,
              "height": 5.4223149113660085,
              "rotation": 0,
              "labels": ["Text"]
            },
            "id": "pa6F68vZpa",
            "from_name": "label",
            "to_name": "image",
            "type": "labels",
            "origin": "manual"
          },
          {
            "original_width": 889,
            "original_height": 520,
            "image_rotation": 0,
            "value": {
              "x": 27.691012033297714,
              "y": 58.08133472367049,
              "width": 42.14645223570203,
              "height": 5.4223149113660085,
              "rotation": 0,
              "text": ["ACUTE CORONARY SYNDROME"]
            },
            "id": "pa6F68vZpa",
            "from_name": "transcription",
            "to_name": "image",
            "type": "textarea",
            "origin": "manual"
          },
          {
            "original_width": 889,
            "original_height": 520,
            "image_rotation": 0,
            "value": {
              "x": 27.569025196146622,
              "y": 70.38581856100105,
              "width": 49.03965680633165,
              "height": 4.788140385599174,
              "rotation": 359.64368755661553
            },
            "id": "iIfXbvxhFx",
            "from_name": "bbox",
            "to_name": "image",
            "type": "rectangle",
            "origin": "manual"
          },
          {
            "original_width": 889,
            "original_height": 520,
            "image_rotation": 0,
            "value": {
              "x": 27.569025196146622,
              "y": 70.38581856100105,
              "width": 49.03965680633165,
              "height": 4.788140385599174,
              "rotation": 359.64368755661553,
              "labels": ["Text"]
            },
            "id": "iIfXbvxhFx",
            "from_name": "label",
            "to_name": "image",
            "type": "labels",
            "origin": "manual"
          },
          {
            "original_width": 889,
            "original_height": 520,
            "image_rotation": 0,
            "value": {
              "x": 27.569025196146622,
              "y": 70.38581856100105,
              "width": 49.03965680633165,
              "height": 4.788140385599174,
              "rotation": 359.64368755661553,
              "text": ["MILD CORONARY ARTERY DISEASE"]
            },
            "id": "iIfXbvxhFx",
            "from_name": "transcription",
            "to_name": "image",
            "type": "textarea",
            "origin": "manual"
          },
          {
            "original_width": 889,
            "original_height": 520,
            "image_rotation": 0,
            "value": {
              "points": [
                [27.630018614722168, 81.85610010427528],
                [61.66434617987663, 80.8133472367049],
                [61.969313272754356, 85.71428571428571],
                [28.239952800477624, 86.44421272158499]
              ],
              "closed": true
            },
            "id": "mpqixNR8uh",
            "from_name": "poly",
            "to_name": "image",
            "type": "polygon",
            "origin": "manual"
          },
          {
            "original_width": 889,
            "original_height": 520,
            "image_rotation": 0,
            "value": {
              "points": [
                [27.630018614722168, 81.85610010427528],
                [61.66434617987663, 80.8133472367049],
                [61.969313272754356, 85.71428571428571],
                [28.239952800477624, 86.44421272158499]
              ],
              "closed": true,
              "labels": ["Handwriting"]
            },
            "id": "mpqixNR8uh",
            "from_name": "label",
            "to_name": "image",
            "type": "labels",
            "origin": "manual"
          },
          {
            "original_width": 889,
            "original_height": 520,
            "image_rotation": 0,
            "value": {
              "points": [
                [27.630018614722168, 81.85610010427528],
                [61.66434617987663, 80.8133472367049],
                [61.969313272754356, 85.71428571428571],
                [28.239952800477624, 86.44421272158499]
              ],
              "closed": true,
              "text": ["MEDICAL MANAGEMENT"]
            },
            "id": "mpqixNR8uh",
            "from_name": "transcription",
            "to_name": "image",
            "type": "textarea",
            "origin": "manual"
          }
        ],
        "was_cancelled": false,
        "ground_truth": false,
        "created_at": "2026-01-07T03:14:39.424067Z",
        "updated_at": "2026-01-10T03:21:09.833576Z",
        "draft_created_at": "2026-01-07T03:14:04.596361Z",
        "lead_time": 2686.9700000000003,
        "prediction": {},
        "result_count": 3,
        "unique_id": "7e8c79f1-49ce-471c-8b26-8b8c6f9c3401",
        "import_id": null,
        "last_action": null,
        "bulk_created": false,
        "task": 1,
        "project": 2,
        "updated_by": 1,
        "parent_prediction": null,
        "parent_annotation": null,
        "last_created_by": null
      }
    ],
    "file_upload": "example.jpg",
    "drafts": [],
    "predictions": [],
    "data": { "ocr": "\/example.jpg" },
    "meta": {},
    "created_at": "2026-01-07T03:13:41.175183Z",
    "updated_at": "2026-01-10T03:21:09.923449Z",
    "allow_skip": true,
    "inner_id": 1,
    "total_annotations": 1,
    "cancelled_annotations": 0,
    "total_predictions": 0,
    "comment_count": 0,
    "unresolved_comment_count": 0,
    "last_comment_updated_at": null,
    "project": 2,
    "updated_by": 1,
    "comment_authors": []
  }
]
```

</details>

<details>
<summary>
  <b>Converted data</b>:
</summary>

Command:

```bash
./dist/cli.js toPPOCR ./tmp --baseImageDir output
```

Output:

```
data/example.jpg	[{"transcription":"ACUTE CORONARY SYNDROME","points":[[246,302],[621,302],[621,330],[246,330]],"dt_score":1},{"transcription":"MILD CORONARY ARTERY DISEASE","points":[[245,366],[681,366],[681,391],[245,391]],"dt_score":1},{"transcription":"MEDICAL MANAGEMENT","points":[[246,426],[548,420],[551,446],[251,450]],"dt_score":1}]
```

</details>

<details>
<summary>
  <b>Convert back to Label Studio</b>:
</summary>

Command:

```bash
./dist/cli.js toLabelStudio ./tmp
```

Output:

```json
[
  [
    {
      "id": 1,
      "annotations": [
        {
          "id": 1,
          "completed_by": 1,
          "result": [
            {
              "original_width": 889,
              "original_height": 520,
              "image_rotation": 0,
              "value": {
                "points": [
                  [27.671541057367826, 58.07692307692308],
                  [69.85376827896513, 58.07692307692308],
                  [69.85376827896513, 63.46153846153846],
                  [27.671541057367826, 63.46153846153846]
                ],
                "closed": true
              },
              "id": "fce62949-7",
              "from_name": "poly",
              "to_name": "image",
              "type": "polygon",
              "origin": "manual"
            },
            {
              "original_width": 889,
              "original_height": 520,
              "image_rotation": 0,
              "value": {
                "points": [
                  [27.671541057367826, 58.07692307692308],
                  [69.85376827896513, 58.07692307692308],
                  [69.85376827896513, 63.46153846153846],
                  [27.671541057367826, 63.46153846153846]
                ],
                "closed": true,
                "labels": ["Text"]
              },
              "id": "fce62949-7",
              "from_name": "label",
              "to_name": "image",
              "type": "labels",
              "origin": "manual"
            },
            {
              "original_width": 889,
              "original_height": 520,
              "image_rotation": 0,
              "value": {
                "points": [
                  [27.671541057367826, 58.07692307692308],
                  [69.85376827896513, 58.07692307692308],
                  [69.85376827896513, 63.46153846153846],
                  [27.671541057367826, 63.46153846153846]
                ],
                "closed": true,
                "text": ["ACUTE CORONARY SYNDROME"]
              },
              "id": "fce62949-7",
              "from_name": "transcription",
              "to_name": "image",
              "type": "textarea",
              "origin": "manual"
            },
            {
              "original_width": 889,
              "original_height": 520,
              "image_rotation": 0,
              "value": {
                "points": [
                  [27.559055118110237, 70.38461538461539],
                  [76.6029246344207, 70.38461538461539],
                  [76.6029246344207, 75.1923076923077],
                  [27.559055118110237, 75.1923076923077]
                ],
                "closed": true
              },
              "id": "9d9389a6-f",
              "from_name": "poly",
              "to_name": "image",
              "type": "polygon",
              "origin": "manual"
            },
            {
              "original_width": 889,
              "original_height": 520,
              "image_rotation": 0,
              "value": {
                "points": [
                  [27.559055118110237, 70.38461538461539],
                  [76.6029246344207, 70.38461538461539],
                  [76.6029246344207, 75.1923076923077],
                  [27.559055118110237, 75.1923076923077]
                ],
                "closed": true,
                "labels": ["Text"]
              },
              "id": "9d9389a6-f",
              "from_name": "label",
              "to_name": "image",
              "type": "labels",
              "origin": "manual"
            },
            {
              "original_width": 889,
              "original_height": 520,
              "image_rotation": 0,
              "value": {
                "points": [
                  [27.559055118110237, 70.38461538461539],
                  [76.6029246344207, 70.38461538461539],
                  [76.6029246344207, 75.1923076923077],
                  [27.559055118110237, 75.1923076923077]
                ],
                "closed": true,
                "text": ["MILD CORONARY ARTERY DISEASE"]
              },
              "id": "9d9389a6-f",
              "from_name": "transcription",
              "to_name": "image",
              "type": "textarea",
              "origin": "manual"
            },
            {
              "original_width": 889,
              "original_height": 520,
              "image_rotation": 0,
              "value": {
                "points": [
                  [27.671541057367826, 81.92307692307692],
                  [61.64229471316085, 80.76923076923077],
                  [61.97975253093363, 85.76923076923076],
                  [28.23397075365579, 86.53846153846155]
                ],
                "closed": true
              },
              "id": "4f2e63fc-b",
              "from_name": "poly",
              "to_name": "image",
              "type": "polygon",
              "origin": "manual"
            },
            {
              "original_width": 889,
              "original_height": 520,
              "image_rotation": 0,
              "value": {
                "points": [
                  [27.671541057367826, 81.92307692307692],
                  [61.64229471316085, 80.76923076923077],
                  [61.97975253093363, 85.76923076923076],
                  [28.23397075365579, 86.53846153846155]
                ],
                "closed": true,
                "labels": ["Text"]
              },
              "id": "4f2e63fc-b",
              "from_name": "label",
              "to_name": "image",
              "type": "labels",
              "origin": "manual"
            },
            {
              "original_width": 889,
              "original_height": 520,
              "image_rotation": 0,
              "value": {
                "points": [
                  [27.671541057367826, 81.92307692307692],
                  [61.64229471316085, 80.76923076923077],
                  [61.97975253093363, 85.76923076923076],
                  [28.23397075365579, 86.53846153846155]
                ],
                "closed": true,
                "text": ["MEDICAL MANAGEMENT"]
              },
              "id": "4f2e63fc-b",
              "from_name": "transcription",
              "to_name": "image",
              "type": "textarea",
              "origin": "manual"
            }
          ],
          "was_cancelled": false,
          "ground_truth": false,
          "created_at": "2026-01-10T03:25:05.530Z",
          "updated_at": "2026-01-10T03:25:05.530Z",
          "draft_created_at": "2026-01-10T03:25:05.530Z",
          "lead_time": 0,
          "prediction": {},
          "result_count": 9,
          "unique_id": "e17b1920-022b-4e48-9207-f9904a42e840",
          "import_id": null,
          "last_action": null,
          "bulk_created": false,
          "task": 1,
          "project": 1,
          "updated_by": 1,
          "parent_prediction": null,
          "parent_annotation": null,
          "last_created_by": null
        }
      ],
      "file_upload": "example.jpg",
      "drafts": [],
      "predictions": [],
      "data": {
        "ocr": "http://localhost:8081/output/example.jpg"
      },
      "meta": {},
      "created_at": "2026-01-10T03:25:05.530Z",
      "updated_at": "2026-01-10T03:25:05.530Z",
      "allow_skip": false,
      "inner_id": 1,
      "total_annotations": 1,
      "cancelled_annotations": 0,
      "total_predictions": 0,
      "comment_count": 0,
      "unresolved_comment_count": 0,
      "last_comment_updated_at": null,
      "project": 1,
      "updated_by": 1,
      "comment_authors": []
    }
  ]
]
```

</details>

**Comparison of bounding box positions:**

|     Original Label Studio (polygon)      | Label Studio to PPOCRLabel | PPOCRLabel -> Label Studio (polygon)     | Margin (Converted Back − Original)      |
| :--------------------------------------: | -------------------------- | ---------------------------------------- | --------------------------------------- |
| \[27.630018614722168, 81.85610010427528] | \[246,426]                 | \[27.671541057367826, 81.92307692307692] | \[0.04152244264566, 0.06697681880164]   |
|  \[61.66434617987663, 80.8133472367049]  | \[548,420]                 | \[61.64229471316085, 80.76923076923077]  | \[-0.02205146671578, -0.04411646747413] |
| \[61.969313272754356, 85.71428571428571] | \[551,446]                 | \[61.97975253093363, 85.76923076923076]  | \[0.01043925817927, 0.05494505494505]   |
| \[28.239952800477624, 86.44421272158499] | \[251,450]                 | \[28.23397075365579, 86.53846153846155]  | \[-0.00598204682183, 0.09424881687656]  |

> [!IMPORTANT]
> So as you can see, after converting from Label Studio to PPOCRLabelv2 and then
> back to Label Studio, the positions of the bounding boxes have slight
> differences due to the conversion process. This may affect the accuracy of the
> annotations, especially if precise bounding box locations are critical for your
> application.

### Delete generated files

To delete the generated files after conversion, you can use the following
commands:

**Linux/macOS**:

- When you specified a custom output directory using `--outDir` option:

  ```bash
  rm -rf ./output-label-studio
  ```

- When you did not specify an output directory (default: files are saved in the
  same directory as the source files):

  **For default output file names:**

  ```bash
  # Delete Label Studio files generated by toLabelStudio command
  find ./input-dir -type f \( -name "*_full.json" -o -name "*_min.json" \) -delete

  # Delete PPOCRLabel files generated by toPPOCR command
  find ./input-dir -type f -name "*_Label.txt" -delete

  # Delete file list for serving
  find ./input-dir -type f -name "files.txt" -delete
  ```

  **For custom output file names or patterns:**

  ```bash
  # Delete files with custom pattern (e.g., files ending with _converted.json)
  find ./input-dir -type f -name "*_converted.json" -delete

  # Delete files with custom PPOCRLabel filename (e.g., CustomLabel.txt)
  find ./input-dir -type f -name "*_CustomLabel.txt" -delete
  ```

**Windows (PowerShell)**:

- When you specified a custom output directory using `--outDir` option:

  ```powershell
  Remove-Item -Path ".\output-label-studio" -Recurse -Force
  ```

- When you did not specify an output directory (default: files are saved in the
  same directory as the source files):

  **For default output file names:**

  ```powershell
  # Delete Label Studio files generated by toLabelStudio command
  Get-ChildItem -Path ".\input-dir" -Recurse -Include "*_full.json","*_min.json" | Remove-Item -Force

  # Delete PPOCRLabel files generated by toPPOCR command
  Get-ChildItem -Path ".\input-dir" -Recurse -Filter "*_Label.txt" | Remove-Item -Force

  # Delete file list for serving
  Get-ChildItem -Path ".\input-dir" -Recurse -Filter "files.txt" | Remove-Item -Force
  ```

  **For custom output file names or patterns:**

  ```powershell
  # Delete files with custom pattern (e.g., files ending with _converted.json)
  Get-ChildItem -Path ".\input-dir" -Recurse -Filter "*_converted.json" | Remove-Item -Force

  # Delete files with custom PPOCRLabel filename (e.g., CustomLabel.txt)
  Get-ChildItem -Path ".\input-dir" -Recurse -Filter "*_CustomLabel.txt" | Remove-Item -Force
  ```

> [!WARNING]
> These commands will permanently delete files. Make sure to review the file
> patterns and paths before executing. You can preview files that would be
> deleted by removing the `-delete` flag (Linux/macOS) or `| Remove-Item-Force`
> (Windows) from the commands.

<!-- Roadmap -->

## :compass: Roadmap

- [x] Add tests.

<!-- Contributing -->

## :wave: Contributing

<a href="https://github.com/DuckyMomo20012/label-studio-converter/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=DuckyMomo20012/label-studio-converter" />
</a>

Contributions are always welcome!

Please read the [contribution guidelines](./CONTRIBUTING.md).

<!-- Code of Conduct -->

### :scroll: Code of Conduct

Please read the [Code of Conduct](./CODE_OF_CONDUCT.md).

<!-- License -->

## :warning: License

This project is licensed under the **Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)** License.

[![License: CC BY-NC-SA 4.0](https://licensebuttons.net/l/by-nc-sa/4.0/88x31.png)](https://creativecommons.org/licenses/by-nc-sa/4.0/).

See the **[LICENSE.md](./LICENSE.md)** file for full details.

<!-- Contact -->

## :handshake: Contact

Duong Vinh - tienvinh.duong4@gmail.com

Project Link: [https://github.com/DuckyMomo20012/label-studio-converter](https://github.com/DuckyMomo20012/label-studio-converter).

<!-- Acknowledgments -->

## :gem: Acknowledgements

Here are useful resources and libraries that we have used in our projects:

- [Label Studio Documentation](https://labelstud.io/guide): Official documentation for Label Studio.
- [PPOCRLabel GitHub Repository](https://github.com/PFCCLab/PPOCRLabel):
  Repository for PPOCRLabelv2 tool.
