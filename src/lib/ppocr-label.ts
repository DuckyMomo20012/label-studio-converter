import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import sizeOf from 'image-size';
import {
  DEFAULT_HEIGHT_INCREMENT,
  DEFAULT_LABEL_NAME,
  DEFAULT_LABEL_STUDIO_PRECISION,
  DEFAULT_OUTPUT_MODE,
  DEFAULT_WIDTH_INCREMENT,
  OUTPUT_MODE_PREDICTIONS,
  type OutputMode,
  type ShapeNormalizeOption,
} from '@/constants';
import { type Point, roundToPrecision, transformPoints } from '@/lib/geometry';
import {
  type FullOCRLabelStudio,
  type MinOCRLabelStudio,
  type PPOCRLabel,
} from '@/lib/schema';

export type ToLabelStudioOptions = {
  imagePath: string;
  baseServerUrl: string;
  inputDir?: string;
  relativeDir?: string;
  toFullJson?: boolean;
  taskId?: number;
  labelName?: string;
  normalizeShape?: ShapeNormalizeOption;
  widthIncrement?: number;
  heightIncrement?: number;
  precision?: number;
  outputMode?: OutputMode;
};

export const ppocrToLabelStudio = async (
  data: PPOCRLabel,
  options: ToLabelStudioOptions,
): Promise<FullOCRLabelStudio | MinOCRLabelStudio> => {
  const {
    imagePath,
    baseServerUrl,
    inputDir,
    relativeDir,
    toFullJson = true,
    taskId = 1,
    labelName = DEFAULT_LABEL_NAME,
    normalizeShape,
    widthIncrement = DEFAULT_WIDTH_INCREMENT,
    heightIncrement = DEFAULT_HEIGHT_INCREMENT,
    precision = DEFAULT_LABEL_STUDIO_PRECISION,
    outputMode = DEFAULT_OUTPUT_MODE,
  } = options || {};

  if (toFullJson) {
    return ppocrToFullLabelStudio(
      data,
      imagePath,
      baseServerUrl,
      inputDir,
      taskId,
      labelName,
      normalizeShape,
      widthIncrement,
      heightIncrement,
      precision,
      relativeDir,
      outputMode,
    );
  } else {
    // Min JSON format doesn't support annotations/predictions distinction
    return ppocrToMinLabelStudio(
      data,
      imagePath,
      baseServerUrl,
      inputDir,
      labelName,
      normalizeShape,
      widthIncrement,
      heightIncrement,
      precision,
      relativeDir,
    );
  }
};

export const ppocrToFullLabelStudio = (
  data: PPOCRLabel,
  imagePath: string,
  baseServerUrl: string,
  inputDir?: string,
  taskId: number = 1,
  labelName: string = DEFAULT_LABEL_NAME,
  normalizeShape?: ShapeNormalizeOption,
  widthIncrement: number = 0,
  heightIncrement: number = 0,
  precision: number = DEFAULT_LABEL_STUDIO_PRECISION,
  relativeDir?: string,
  outputMode: OutputMode = DEFAULT_OUTPUT_MODE,
): FullOCRLabelStudio => {
  const newBaseServerUrl =
    baseServerUrl.replace(/\/+$/, '') + (baseServerUrl === '' ? '' : '/');

  const now = new Date().toISOString();

  // Get actual image dimensions from the image file
  let original_width = 1920;
  let original_height = 1080;

  // Resolve path to image file
  // Paths in PPOCRLabel are relative to the directory containing Label.txt
  // Handle case where imagePath incorrectly starts with the parent dir name
  let resolvedImagePath: string;
  if (inputDir) {
    // Check if imagePath starts with the last component of inputDir
    // e.g., inputDir=".../images/ch" and imagePath="ch/file.jpg" -> use "file.jpg"
    const lastDirComponent = basename(inputDir);
    const imagePathParts = imagePath.split('/');
    if (imagePathParts[0] === lastDirComponent && imagePathParts.length > 1) {
      // Remove the duplicate directory component
      resolvedImagePath = join(inputDir, imagePathParts.slice(1).join('/'));
    } else {
      resolvedImagePath = join(inputDir, imagePath);
    }
  } else {
    resolvedImagePath = imagePath;
  }

  if (existsSync(resolvedImagePath)) {
    try {
      const buffer = readFileSync(resolvedImagePath);
      const dimensions = sizeOf(buffer);
      if (dimensions.width && dimensions.height) {
        original_width = dimensions.width;
        original_height = dimensions.height;
      } else {
        console.warn(
          `Warning: Failed to read dimensions from ${resolvedImagePath}, using defaults`,
        );
      }
    } catch (error) {
      console.warn(
        `Warning: Error reading image ${resolvedImagePath}, using defaults:`,
        error instanceof Error ? error.message : error,
      );
    }
  } else {
    console.warn(
      `Warning: Image file not found: ${resolvedImagePath}, using default dimensions`,
    );
  }

  // Extract filename from imagePath for file_upload (just the filename)
  const fileName = imagePath.split('/').pop() || imagePath;

  // Normalize imagePath for URL construction - remove duplicate dir component if present
  let normalizedImagePath = imagePath;
  if (inputDir && relativeDir) {
    const lastDirComponent = basename(inputDir);
    const imagePathParts = imagePath.split('/');
    if (imagePathParts[0] === lastDirComponent && imagePathParts.length > 1) {
      // Remove the duplicate directory component for URL
      normalizedImagePath = imagePathParts.slice(1).join('/');
    }
  }

  // Group all PPOCRLabel items into a single task
  // Place result in either annotations or predictions based on outputMode
  const isPredictions = outputMode === OUTPUT_MODE_PREDICTIONS;

  const resultItems = data
    .map((item) => {
      let { points } = item;

      // Apply geometry transformations
      points = transformPoints(points as Point[], {
        normalizeShape,
        widthIncrement,
        heightIncrement,
      });

      // Generate a single ID for all three related annotations
      const annotationId = randomUUID().slice(0, 10);
      const polygonPoints = points.map(([x, y]) => [
        roundToPrecision(((x ?? 0) / original_width) * 100, precision),
        roundToPrecision(((y ?? 0) / original_height) * 100, precision),
      ]);

      // For predictions, add score from dt_score
      const scoreField =
        isPredictions && item.dt_score !== undefined
          ? { score: item.dt_score }
          : {};

      // Create result items: polygon, labels, and textarea
      return [
        // 1. Polygon geometry only
        {
          original_width,
          original_height,
          image_rotation: 0,
          value: {
            points: polygonPoints,
            closed: true,
          },
          id: annotationId,
          from_name: 'poly',
          to_name: 'image',
          type: 'polygon',
          origin: 'manual',
          ...scoreField,
        },
        // 2. Labels with polygon geometry
        {
          original_width,
          original_height,
          image_rotation: 0,
          value: {
            points: polygonPoints,
            closed: true,
            labels: [labelName],
          },
          id: annotationId,
          from_name: 'label',
          to_name: 'image',
          type: 'labels',
          origin: 'manual',
          ...scoreField,
        },
        // 3. Textarea with polygon geometry and text
        {
          original_width,
          original_height,
          image_rotation: 0,
          value: {
            points: polygonPoints,
            closed: true,
            text: [item.transcription],
          },
          id: annotationId,
          from_name: 'transcription',
          to_name: 'image',
          type: 'textarea',
          origin: 'manual',
          ...scoreField,
        },
      ];
    })
    .flat();

  const result: FullOCRLabelStudio = [
    {
      id: taskId,
      annotations: isPredictions
        ? []
        : [
            {
              id: taskId,
              completed_by: 1,
              result: resultItems,
              was_cancelled: false,
              ground_truth: false,
              created_at: now,
              updated_at: now,
              draft_created_at: now,
              lead_time: 0,
              prediction: {},
              result_count: data.length * 3,
              unique_id: randomUUID(),
              import_id: null,
              last_action: null,
              bulk_created: false,
              task: taskId,
              project: 1,
              updated_by: 1,
              parent_prediction: null,
              parent_annotation: null,
              last_created_by: null,
            },
          ],
      file_upload: fileName,
      drafts: [],
      predictions: isPredictions
        ? [
            {
              model_version: 'ppocr-v1',
              result: resultItems,
              created_at: now,
              task: taskId,
              project: 1,
            },
          ]
        : [],
      data: {
        ocr: relativeDir
          ? `${newBaseServerUrl}${relativeDir}/${normalizedImagePath}`
          : `${newBaseServerUrl}${normalizedImagePath}`,
      },
      meta: {},
      created_at: now,
      updated_at: now,
      allow_skip: false,
      inner_id: taskId,
      total_annotations: isPredictions ? 0 : 1,
      cancelled_annotations: 0,
      total_predictions: isPredictions ? 1 : 0,
      comment_count: 0,
      unresolved_comment_count: 0,
      last_comment_updated_at: null,
      project: 1,
      updated_by: 1,
      comment_authors: [],
    },
  ];

  return result;
};

export const ppocrToMinLabelStudio = (
  data: PPOCRLabel,
  imagePath: string,
  baseServerUrl: string,
  inputDir?: string,
  labelName: string = 'text',
  normalizeShape?: ShapeNormalizeOption,
  widthIncrement: number = 0,
  heightIncrement: number = 0,
  precision: number = DEFAULT_LABEL_STUDIO_PRECISION,
  relativeDir?: string,
): MinOCRLabelStudio => {
  const newBaseServerUrl =
    baseServerUrl.replace(/\/+$/, '') + (baseServerUrl === '' ? '' : '/');

  const now = new Date().toISOString();

  // Get actual image dimensions from the image file
  // Default to 1920×1080 if image is missing or unreadable
  let original_width = 1920;
  let original_height = 1080;

  // Resolve path to image file
  // Paths in PPOCRLabel are relative to the directory containing Label.txt
  // Handle case where imagePath incorrectly starts with the parent dir name
  let resolvedImagePath: string;
  if (inputDir) {
    // Check if imagePath starts with the last component of inputDir
    // e.g., inputDir=".../images/ch" and imagePath="ch/file.jpg" -> use "file.jpg"
    const lastDirComponent = basename(inputDir);
    const imagePathParts = imagePath.split('/');
    if (imagePathParts[0] === lastDirComponent && imagePathParts.length > 1) {
      // Remove the duplicate directory component
      resolvedImagePath = join(inputDir, imagePathParts.slice(1).join('/'));
    } else {
      resolvedImagePath = join(inputDir, imagePath);
    }
  } else {
    resolvedImagePath = imagePath;
  }

  if (existsSync(resolvedImagePath)) {
    try {
      const buffer = readFileSync(resolvedImagePath);
      const dimensions = sizeOf(buffer);
      if (dimensions.width && dimensions.height) {
        original_width = dimensions.width;
        original_height = dimensions.height;
      } else {
        console.warn(
          `Warning: Failed to read dimensions from ${resolvedImagePath}, using defaults`,
        );
      }
    } catch (error) {
      console.warn(
        `Warning: Error reading image ${resolvedImagePath}, using defaults:`,
        error instanceof Error ? error.message : error,
      );
    }
  } else {
    console.warn(
      `Warning: Image file not found: ${resolvedImagePath}, using default dimensions`,
    );
  }

  // Normalize imagePath for URL construction - remove duplicate dir component if present
  let normalizedImagePath = imagePath;
  if (inputDir && relativeDir) {
    const lastDirComponent = basename(inputDir);
    const imagePathParts = imagePath.split('/');
    if (imagePathParts[0] === lastDirComponent && imagePathParts.length > 1) {
      // Remove the duplicate directory component for URL
      normalizedImagePath = imagePathParts.slice(1).join('/');
    }
  }

  return data.map((item, index) => {
    let { points } = item;

    // Apply geometry transformations
    points = transformPoints(points as Point[], {
      normalizeShape,
      widthIncrement,
      heightIncrement,
    });

    // Round coordinates based on precision first
    const roundedPoints = points.map(
      ([x, y]) =>
        [
          roundToPrecision(x ?? 0, precision),
          roundToPrecision(y ?? 0, precision),
        ] as [number, number],
    );

    // Calculate bbox from rounded points
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const point of roundedPoints) {
      const [x, y] = point;
      if (x !== undefined && y !== undefined) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }

    const width = maxX - minX;
    const height = maxY - minY;

    return {
      ocr: relativeDir
        ? encodeURI(`${newBaseServerUrl}${relativeDir}/${normalizedImagePath}`)
        : encodeURI(`${newBaseServerUrl}${normalizedImagePath}`),
      id: index + 1,
      bbox: [
        {
          x: minX,
          y: minY,
          width: width,
          height: height,
          rotation: 0,
          original_width,
          original_height,
        },
      ],
      label: [
        {
          points: roundedPoints,
          closed: true,
          labels: [labelName],
          original_width,
          original_height,
        },
      ],
      transcription: [item.transcription],
      poly: [
        {
          points: roundedPoints,
          closed: true,
          original_width,
          original_height,
        },
      ],
      annotator: 1,
      annotation_id: index + 1,
      created_at: now,
      updated_at: now,
      lead_time: 0,
    };
  });
};
