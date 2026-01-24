import { pointsToTuple } from '@/lib/geometry';
import { type ProcessorOutput } from '@/lib/processor';
import { type PPOCRLabelTask } from '@/modules/ppocrlabel/schema';

export const PPOCROutput = (async (outputTask, resolveImagePath) => {
  const imageFilePath = await resolveImagePath(outputTask.imagePath);

  return {
    imagePath: imageFilePath,
    data: outputTask.boxes.map((box) => ({
      ...box.metadata,
      transcription: box.text || '',
      points: pointsToTuple(box.points),
      dt_score: box.score,
    })),
  };
}) satisfies ProcessorOutput<PPOCRLabelTask>;
