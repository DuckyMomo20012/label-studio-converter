import { randomUUID } from 'crypto';
import { tupleToPoints } from '@/lib';
import { getImageDimensions } from '@/lib/image';
import { type ProcessorInput } from '@/lib/processor';
import { type PPOCRLabelTask } from '@/modules/ppocrlabel/schema';

export const PPOCRInput = (async (inputTask, resolveImagePath) => {
  const imageFilePath = await resolveImagePath(inputTask.imagePath);

  let imgWidth = 0;
  let imgHeight = 0;

  const newTaskId = randomUUID().slice(0, 10);

  const dimensions = await getImageDimensions(imageFilePath);
  if (dimensions) {
    imgHeight = dimensions.height;
    imgWidth = dimensions.width;
  } else {
    console.warn(
      `Failed to auto-detect image size for ${imageFilePath}, using 0x0`,
    );
  }

  return {
    id: newTaskId,
    height: imgHeight,
    width: imgWidth,
    imagePath: imageFilePath,
    boxes: inputTask.data.map(
      ({ transcription, points, dt_score, ...meta }) => {
        const newBoxId = randomUUID().slice(0, 10);

        return {
          id: newBoxId,
          points: tupleToPoints(points),
          text: transcription,
          score: dt_score,
          metadata: meta,
        };
      },
    ),
  };
}) satisfies ProcessorInput<PPOCRLabelTask>;
