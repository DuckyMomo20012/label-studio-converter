import { randomUUID } from 'crypto';
import { tupleToPoints } from '@/lib/geometry';
import { getImageDimensions } from '@/lib/image';
import { type ProcessorInput } from '@/lib/processor';
import {
  type UnifiedOCRBox,
  type UnifiedOCRTask,
  type UnifiedPoint,
} from '@/lib/unified';
import { LabelStudioTaskMin } from '@/modules/label-studio-min/schema';

export const MinOCRLabelStudioInput = (async (inputTask, resolveImagePath) => {
  const imageFilePath = await resolveImagePath(inputTask.ocr);

  let imgWidth = 0;
  let imgHeight = 0;

  const dimensions = await getImageDimensions(imageFilePath);
  if (dimensions) {
    imgHeight = dimensions.height;
    imgWidth = dimensions.width;
  } else {
    console.warn(
      `Failed to auto-detect image size for ${imageFilePath}, using 0x0`,
    );
  }

  // Process each bbox/poly with its corresponding transcription
  const numAnnotations = Math.max(
    inputTask.poly?.length || 0,
    inputTask.bbox?.length || 0,
    inputTask.transcription?.length || 0,
  );

  const outputTask: UnifiedOCRTask = {
    id: inputTask.id.toString(),
    height: imgHeight,
    width: imgWidth,
    imagePath: imageFilePath,
    boxes: [],
  };

  let boxList: UnifiedOCRBox[] = [];

  for (let i = 0; i < numAnnotations; i++) {
    let points: UnifiedPoint[] | undefined;

    // Use poly if available, otherwise convert from bbox
    if (inputTask.poly && inputTask.poly.length > i && inputTask.poly[i]) {
      const poly = inputTask.poly[i];
      if (poly) {
        const { points: polyPoints } = poly;
        points = tupleToPoints(polyPoints);
      }
    } else if (
      inputTask.bbox &&
      inputTask.bbox.length > i &&
      inputTask.bbox[i]
    ) {
      const bbox = inputTask.bbox[i];
      if (bbox) {
        const { x, y, width, height } = bbox;

        // Convert bbox to 4 corner points
        points = [
          { x: x, y },
          { x: x + width, y },
          { x: x + width, y: y + height },
          { x: x, y: y + height },
        ];
      }
    }

    // Skip if no geometry data for this annotation
    if (!points) {
      continue;
    }

    // Get transcription text for this annotation
    const transcription =
      inputTask.transcription && inputTask.transcription.length > i
        ? inputTask.transcription[i]
        : '';

    const newBoxId = randomUUID().slice(0, 10);

    boxList.push({
      id: newBoxId,
      points: points,
      text: transcription,
      metadata: {},
    });
  }

  outputTask.boxes = boxList;

  return outputTask;
}) satisfies ProcessorInput<LabelStudioTaskMin>;
