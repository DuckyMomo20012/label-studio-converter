import { randomUUID } from 'crypto';
import {
  DEFAULT_LABEL_NAME,
  DEFAULT_OUTPUT_MODE,
  OUTPUT_MODE_PREDICTIONS,
} from '@/constants';
import { pixelToPercentage, pointsToTuple } from '@/lib/geometry';
import { type ProcessorOutput } from '@/lib/processor';
import {
  type LabelStudioAnnotation,
  type LabelStudioPrediction,
  type LabelStudioResultItem,
  type LabelStudioTask,
} from '@/modules/label-studio-full/schema';

export type FullOCRLabelStudioOutputOptions = {
  taskId?: number;
  outputMode?: string;
  defaultLabelName?: string;
};

export const FullOCRLabelStudioOutput = (async (
  outputTask,
  resolveImagePath,
  options,
) => {
  const imageFilePath = await resolveImagePath(outputTask.imagePath);

  const {
    taskId = 1,
    defaultLabelName = DEFAULT_LABEL_NAME,
    outputMode = DEFAULT_OUTPUT_MODE,
  } = options || {};

  const now = new Date().toISOString();

  const {
    id: baseTaskId,
    width: imgWidth,
    height: imgHeight,
    boxes,
    metadata,
  } = outputTask;

  const newTaskId =
    baseTaskId !== undefined ? parseInt(baseTaskId, 10) : taskId;

  const fileName = imageFilePath.split('/').pop() || imageFilePath;

  const isPredictions = outputMode === OUTPUT_MODE_PREDICTIONS;

  const resultItems = boxes
    .map((box) => {
      const { id: baseBoxId, points, text, score } = box;

      const newPoints = pointsToTuple(points);

      // Convert from absolute pixel coordinates to percentage (0-100)
      const percentagePoints = pixelToPercentage(
        newPoints,
        imgWidth,
        imgHeight,
      );

      const newBoxId = baseBoxId || randomUUID().slice(0, 10);

      // For predictions, add score from dt_score
      const scoreField = isPredictions && score !== undefined ? { score } : {};

      // Create result items: polygon, labels, and textarea
      return [
        // 1. Polygon geometry only
        {
          original_width: imgWidth,
          original_height: imgHeight,
          image_rotation: 0,
          value: {
            points: percentagePoints,
            closed: true,
          },
          id: newBoxId,
          from_name: 'poly',
          to_name: 'image',
          type: 'polygon',
          origin: 'manual',
          // ...boxMeta,
          ...scoreField,
        },
        // 2. Labels with polygon geometry
        {
          original_width: imgWidth,
          original_height: imgHeight,
          image_rotation: 0,
          value: {
            points: percentagePoints,
            closed: true,
            labels: [defaultLabelName],
          },
          id: newBoxId,
          from_name: 'label',
          to_name: 'image',
          type: 'labels',
          origin: 'manual',
          // ...boxMeta,
          ...scoreField,
        },
        // 3. Textarea with polygon geometry and text
        {
          original_width: imgWidth,
          original_height: imgHeight,
          image_rotation: 0,
          value: {
            points: percentagePoints,
            closed: true,
            text: [text || ''],
          },
          id: newBoxId,
          from_name: 'transcription',
          to_name: 'image',
          type: 'textarea',
          origin: 'manual',
          // ...boxMeta,
          ...scoreField,
        },
      ] satisfies LabelStudioResultItem[];
    })
    .flat();

  return {
    id: newTaskId,
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
            result_count: boxes.length,
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
          } satisfies LabelStudioAnnotation,
        ],
    file_upload: fileName,
    drafts: [],
    predictions: isPredictions
      ? [
          {
            model_version: 'ppocr-v1',
            result: resultItems,
            created_ago: now,
            task: newTaskId,
          } satisfies LabelStudioPrediction,
        ]
      : [],
    data: {
      ocr: imageFilePath,
    },
    meta: metadata || {},
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
  };
}) satisfies ProcessorOutput<LabelStudioTask, FullOCRLabelStudioOutputOptions>;
