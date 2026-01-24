import { DEFAULT_LABEL_NAME } from '@/constants';
import { pixelToPercentage, pointsToTuple } from '@/lib/geometry';
import { type ProcessorOutput } from '@/lib/processor';
import { type LabelStudioTaskMin } from '@/modules/label-studio-min/schema';

export type MinOCRLabelStudioOutputOptions = {
  taskId?: number;
  defaultLabelName?: string;
};

export const MinOCRLabelStudioOutput = (async (
  outputTask,
  resolveImagePath,
  options,
) => {
  const imageFilePath = await resolveImagePath(outputTask.imagePath);

  const { taskId = 1, defaultLabelName = DEFAULT_LABEL_NAME } = options || {};

  const baseTaskId = outputTask.id;

  const newTaskId =
    baseTaskId !== undefined ? parseInt(baseTaskId, 10) : taskId;

  const now = new Date().toISOString();

  const { width: imgWidth, height: imgHeight, boxes } = outputTask;

  return {
    ocr: imageFilePath,
    id: newTaskId,
    label: boxes.map((box) => ({
      points: pixelToPercentage(pointsToTuple(box.points), imgWidth, imgHeight),
      closed: true,
      labels: [defaultLabelName],
      original_width: imgWidth,
      original_height: imgHeight,
    })),
    transcription: boxes.map((box) => box.text || ''),
    poly: boxes.map((box) => ({
      points: pixelToPercentage(pointsToTuple(box.points), imgWidth, imgHeight),
      closed: true,
      original_width: imgWidth,
      original_height: imgHeight,
    })),
    annotator: 1,
    annotation_id: newTaskId,
    created_at: now,
    updated_at: now,
    lead_time: 0,
  };
}) satisfies ProcessorOutput<
  LabelStudioTaskMin,
  MinOCRLabelStudioOutputOptions
>;
