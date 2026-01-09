import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import sizeOf from 'image-size';
import { DEFAULT_LABEL_NAME, type ShapeNormalizeOption } from '@/constants';
import { type Point, transformPoints } from '@/lib/geometry';
import {
  type FullOCRLabelStudio,
  type MinOCRLabelStudio,
  type PPOCRLabel,
} from '@/lib/schema';

export type ToLabelStudioOptions = {
  imagePath: string;
  baseServerUrl: string;
  inputDir?: string;
  toFullJson?: boolean;
  taskId?: number;
  labelName?: string;
  normalizeShape?: ShapeNormalizeOption;
  widthIncrement?: number;
  heightIncrement?: number;
};

export const ppocrToLabelStudio = async (
  data: PPOCRLabel,
  options: ToLabelStudioOptions,
): Promise<FullOCRLabelStudio | MinOCRLabelStudio> => {
  const {
    imagePath,
    baseServerUrl,
    inputDir,
    toFullJson = true,
    taskId = 1,
    labelName = DEFAULT_LABEL_NAME,
    normalizeShape,
    widthIncrement = 0,
    heightIncrement = 0,
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
    );
  } else {
    return ppocrToMinLabelStudio(
      data,
      imagePath,
      baseServerUrl,
      inputDir,
      labelName,
      normalizeShape,
      widthIncrement,
      heightIncrement,
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
): FullOCRLabelStudio => {
  const newBaseServerUrl =
    baseServerUrl.replace(/\/+$/, '') + (baseServerUrl === '' ? '' : '/');

  const now = new Date().toISOString();

  // Get actual image dimensions from the image file
  let original_width = 1920;
  let original_height = 1080;

  // Resolve absolute path to image file
  const resolvedImagePath = inputDir ? join(inputDir, imagePath) : imagePath;

  if (!existsSync(resolvedImagePath)) {
    throw new Error(`Image file not found: ${resolvedImagePath}`);
  }

  const buffer = readFileSync(resolvedImagePath);
  const dimensions = sizeOf(buffer);
  if (!dimensions.width || !dimensions.height) {
    throw new Error(
      `Failed to read image dimensions from: ${resolvedImagePath}`,
    );
  }
  original_width = dimensions.width;
  original_height = dimensions.height;

  // Extract filename from imagePath for file_upload (just the filename)
  const fileName = imagePath.split('/').pop() || imagePath;

  // Group all PPOCRLabel items into a single task with one annotation
  const result: FullOCRLabelStudio = [
    {
      id: taskId,
      annotations: [
        {
          id: taskId,
          completed_by: 1,
          result: data
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
                ((x ?? 0) / original_width) * 100,
                ((y ?? 0) / original_height) * 100,
              ]);

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
                },
              ];
            })
            .flat(),
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
      predictions: [],
      data: { ocr: `${newBaseServerUrl}${imagePath}` },
      meta: {},
      created_at: now,
      updated_at: now,
      allow_skip: false,
      inner_id: taskId,
      total_annotations: 1,
      cancelled_annotations: 0,
      total_predictions: 0,
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
): MinOCRLabelStudio => {
  const newBaseServerUrl =
    baseServerUrl.replace(/\/+$/, '') + (baseServerUrl === '' ? '' : '/');

  const now = new Date().toISOString();

  // Get actual image dimensions from the image file
  let original_width = 1920;
  let original_height = 1080;

  // Resolve absolute path to image file
  const resolvedImagePath = inputDir ? join(inputDir, imagePath) : imagePath;

  if (!existsSync(resolvedImagePath)) {
    throw new Error(`Image file not found: ${resolvedImagePath}`);
  }

  const buffer = readFileSync(resolvedImagePath);
  const dimensions = sizeOf(buffer);
  if (!dimensions.width || !dimensions.height) {
    throw new Error(
      `Failed to read image dimensions from: ${resolvedImagePath}`,
    );
  }
  original_width = dimensions.width;
  original_height = dimensions.height;

  return data.map((item, index) => {
    let { points } = item;

    // Apply geometry transformations
    points = transformPoints(points as Point[], {
      normalizeShape,
      widthIncrement,
      heightIncrement,
    });

    // Calculate bbox from points
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const point of points) {
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
      ocr: encodeURI(`${newBaseServerUrl}${imagePath}`),
      id: index + 1,
      bbox: [
        {
          x: minX,
          y: minY,
          width,
          height,
          rotation: 0,
          original_width,
          original_height,
        },
      ],
      label: [
        {
          points: points,
          closed: true,
          labels: [labelName],
          original_width,
          original_height,
        },
      ],
      transcription: [item.transcription],
      poly: [
        {
          points: points,
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
