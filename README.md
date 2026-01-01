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
  - [Run Locally](#running-run-locally)
- [Usage](#eyes-usage)
  - [Basic Usage](#basic-usage)
  - [CLI Usage](#cli-usage)
  - [Using generated files with Label Studio](#using-generated-files-with-label-studio)
    - [Interface setup](#interface-setup)
    - [Serving annotation files locally](#serving-annotation-files-locally)
  - [Using generated files with PPOCRLabelv2](#using-generated-files-with-ppocrlabelv2)
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

This project uses [pnpm](https://pnpm.io/) as package manager:

```bash
npm install --global pnpm
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

### Basic Usage

```ts
import { toLabelStudio, toPPOCR } from 'label-studio-converter';

// Convert PPOCRLabel files to Label Studio format
await toLabelStudio({
  inputDirs: ['./input-ppocr'],
  outDir: './output-label-studio',
  defaultLabelName: 'Text',
  toFullJson: true,
  createFilePerImage: false,
  createFileListForServing: true,
  fileListName: 'files.txt',
  baseServerUrl: 'http://localhost:8081',
  sortVertical: 'none',
  sortHorizontal: 'none',
});

// Convert Label Studio files to PPOCRLabel format
await toPPOCR({
  inputDirs: ['./input-label-studio'],
  outDir: './output-ppocr',
  fileName: 'Label.txt',
  baseImageDir: 'images/ch',
  sortVertical: 'none',
  sortHorizontal: 'none',
});
```

### CLI Usage

```
USAGE
  label-studio-converter toLabelStudio [--outDir value] [--defaultLabelName value] [--toFullJson] [--createFilePerImage] [--createFileListForServing] [--fileListName value] [--baseServerUrl value] [--sortVertical value] [--sortHorizontal value] <args>...
  label-studio-converter toPPOCR [--outDir value] [--fileName value] [--baseImageDir value] [--sortVertical value] [--sortHorizontal value] <args>...
  label-studio-converter --help
  label-studio-converter --version

Convert between Label Studio OCR format and PPOCRLabelv2 format

FLAGS
  -h --help     Print help information and exit
  -v --version  Print version information and exit

COMMANDS
  toLabelStudio  Convert PPOCRLabel files to Label Studio format
  toPPOCR        Convert Label Studio files to PPOCRLabel format
```

Subcommands:

```
USAGE
  label-studio-converter toLabelStudio [--outDir value] [--defaultLabelName value] [--toFullJson] [--createFilePerImage] [--createFileListForServing] [--fileListName value] [--baseServerUrl value] [--sortVertical value] [--sortHorizontal value] <args>...
  label-studio-converter toLabelStudio --help

Convert PPOCRLabel files to Label Studio format

FLAGS
     [--outDir]                                                 Output directory. Default to "./output"
     [--defaultLabelName]                                       Default label name for text annotations. Default to "Text"
     [--toFullJson/--noToFullJson]                              Convert to Full OCR Label Studio format. Default to "true"
     [--createFilePerImage/--noCreateFilePerImage]              Create a separate Label Studio JSON file for each image. Default to "false"
     [--createFileListForServing/--noCreateFileListForServing]  Create a file list for serving in Label Studio. Default to "true"
     [--fileListName]                                           Name of the file list for serving. Default to "files.txt"
     [--baseServerUrl]                                          Base server URL for constructing image URLs in the file list. Default to "http://localhost:8081"
     [--sortVertical]                                           Sort bounding boxes vertically. Options: "none" (default), "top-bottom", "bottom-top"
     [--sortHorizontal]                                         Sort bounding boxes horizontally. Options: "none" (default), "ltr", "rtl"
  -h  --help                                                    Print help information and exit

ARGUMENTS
  args...  Input directories containing PPOCRLabel files
```

```
USAGE
  label-studio-converter toPPOCR [--outDir value] [--fileName value] [--baseImageDir value] [--sortVertical value] [--sortHorizontal value] <args>...
  label-studio-converter toPPOCR --help

Convert Label Studio files to PPOCRLabel format

FLAGS
     [--outDir]          Output directory. Default to "./output"
     [--fileName]        Output PPOCR file name. Default to "Label.txt"
     [--baseImageDir]    Base directory path to prepend to image filenames in output (e.g., "ch" or "images/ch")
     [--sortVertical]    Sort bounding boxes vertically. Options: "none" (default), "top-bottom", "bottom-top"
     [--sortHorizontal]  Sort bounding boxes horizontally. Options: "none" (default), "ltr", "rtl"
  -h  --help             Print help information and exit

ARGUMENTS
  args...  Input directories containing Label Studio files
```

#### Examples

**Convert PPOCRLabel files to full Label Studio format:**

```bash
label-studio-converter toLabelStudio ./input-ppocr --outDir ./output-label-studio --defaultLabelName Text --toFullJson --createFileListForServing --fileListName files.txt --baseServerUrl http://localhost:8081 --sortVertical none --sortHorizontal none
```

**Convert Label Studio files to PPOCRLabel format:**

```bash
label-studio-converter toPPOCR ./input-label-studio --outDir ./output-ppocr --fileName Label.txt --baseImageDir images/ch --sortVertical none --sortHorizontal none
```

**Convert PPOCRLabel files to Label Studio format with one file per image:**

```bash
label-studio-converter toLabelStudio ./input-ppocr --outDir ./output-label-studio --defaultLabelName Text --toFullJson --createFilePerImage --sortVertical none --sortHorizontal none
```

**Convert PPOCRLabel files to minimal Label Studio format (cannot be used for serving):**

```bash
label-studio-converter toLabelStudio ./input-ppocr --outDir ./output-label-studio --defaultLabelName Text --noToFullJson --sortVertical none --sortHorizontal none
```

### Using generated files with Label Studio

#### Interface setup

When creating a new labeling project in Label Studio, choose the "OCR" template.
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
- A `Labels` tag with two label options: "Text" and "Handwriting". By default,
  all annotations will be labeled as "Text". You can modify this based on your
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
