import * as turf from '@turf/turf';
import { groupBy } from 'es-toolkit';
import {
  DEFAULT_HEIGHT_INCREMENT,
  DEFAULT_PPOCR_PRECISION,
  DEFAULT_WIDTH_INCREMENT,
} from '@/constants';
import { type TransformOptions } from '@/lib/enhance';
import { type Point, roundPoints, transformPoints } from '@/lib/geometry';
import {
  type FullOCRLabelStudio,
  type MinOCRLabelStudio,
  type PPOCRLabel,
} from '@/lib/schema';

export type ConversionOptions = TransformOptions & {
  baseImageDir?: string;
};

export const labelStudioToPPOCR = async (
  data: FullOCRLabelStudio,
  options?: ConversionOptions,
): Promise<Map<string, PPOCRLabel>> => {
  const {
    baseImageDir,
    normalizeShape,
    widthIncrement = DEFAULT_WIDTH_INCREMENT,
    heightIncrement = DEFAULT_HEIGHT_INCREMENT,
    precision = DEFAULT_PPOCR_PRECISION,
  } = options || {};
  const resultMap = new Map<string, PPOCRLabel>();

  for (const task of data) {
    // Extract image path from data.ocr (full path with URL) or file_upload (just filename)
    let imagePath = task.file_upload || '';
    if (task.data.ocr) {
      // Extract path from URL: http://localhost:8081/ch/image.jpg -> ch/image.jpg
      const urlPath = task.data.ocr.replace(/^https?:\/\/[^/]+\//, '');
      imagePath = decodeURIComponent(urlPath);
    }

    // Apply baseImageDir if provided
    if (baseImageDir) {
      imagePath = `${baseImageDir}/${task.file_upload || imagePath.split('/').pop() || imagePath}`;
    }

    const imageAnnotations: PPOCRLabel = [];

    // Process each annotation in the task
    for (const annotation of task.annotations) {
      // Group result items by their ID to avoid duplicates
      // (polygon, labels, and textarea share the same ID)
      const groupedById = groupBy(annotation.result, (item) => item.id);

      // Process each group of result items (with same ID)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for (const [_, resultItems] of Object.entries(groupedById)) {
        let points: number[][] | undefined;
        let transcription = '';

        // Process all result items in this group to extract points and transcription
        for (const resultItem of resultItems) {
          // Extract points from different value types
          if ('points' in resultItem.value && resultItem.value.points) {
            // Polygon/polyline with percentage points - convert to absolute
            const { points: valuePoints } = resultItem.value;
            const { original_width, original_height } = resultItem;

            // Convert percentage coordinates to absolute pixels
            points = valuePoints.map(([x, y]) => [
              ((x ?? 0) * original_width) / 100,
              ((y ?? 0) * original_height) / 100,
            ]);
          } else if (
            'x' in resultItem.value &&
            'y' in resultItem.value &&
            'width' in resultItem.value &&
            'height' in resultItem.value
          ) {
            // Rectangle - convert to 4 corner points
            const { x, y, width, height } = resultItem.value;
            const { original_width, original_height } = resultItem;

            // Convert normalized values to absolute coordinates
            const absX = (x * original_width) / 100;
            const absY = (y * original_height) / 100;
            const absWidth = (width * original_width) / 100;
            const absHeight = (height * original_height) / 100;

            points = [
              [absX, absY],
              [absX + absWidth, absY],
              [absX + absWidth, absY + absHeight],
              [absX, absY + absHeight],
            ];
          }

          // Extract transcription from text field
          if (
            'text' in resultItem.value &&
            Array.isArray(resultItem.value.text)
          ) {
            transcription = resultItem.value.text[0] || '';
          }
        }

        // If we have points, create a PPOCRLabel entry
        if (points && points.length > 0) {
          // Apply geometry transformations
          points = transformPoints(points as Point[], {
            normalizeShape,
            widthIncrement,
            heightIncrement,
          });

          // Round points to specified precision
          points = roundPoints(points as Point[], precision);

          // Calculate dt_score based on polygon area
          let dt_score = 1.0;
          try {
            const firstPoint = points[0];
            if (firstPoint) {
              const polygon = turf.polygon([points.concat([firstPoint])]);
              const area = turf.area(polygon);
              dt_score = Math.min(1.0, Math.max(0.5, area / 10000));
            }
          } catch {
            dt_score = 0.8;
          }

          imageAnnotations.push({
            transcription,
            points,
            dt_score,
          });
        }
      }
    }

    if (imageAnnotations.length > 0) {
      resultMap.set(imagePath, imageAnnotations);
    }
  }

  return resultMap;
};

export const minLabelStudioToPPOCR = async (
  data: MinOCRLabelStudio,
  options?: ConversionOptions,
): Promise<Map<string, PPOCRLabel>> => {
  const {
    baseImageDir,
    normalizeShape,
    widthIncrement = DEFAULT_WIDTH_INCREMENT,
    heightIncrement = DEFAULT_HEIGHT_INCREMENT,
    precision = DEFAULT_PPOCR_PRECISION,
  } = options || {};
  const resultMap = new Map<string, PPOCRLabel>();

  for (const item of data) {
    // Extract image path from ocr URL
    let imagePath = item.ocr || '';
    if (imagePath) {
      // Extract path from URL: http://localhost:8081/ch/image.jpg -> ch/image.jpg
      imagePath = decodeURIComponent(
        imagePath.replace(/^https?:\/\/[^/]+\//, ''),
      );
    }

    // Apply baseImageDir if provided
    if (baseImageDir) {
      imagePath = `${baseImageDir}/${imagePath.split('/').pop() || imagePath}`;
    }

    // Process each bbox/poly with its corresponding transcription
    const numAnnotations = Math.max(
      item.poly?.length || 0,
      item.bbox?.length || 0,
      item.transcription?.length || 0,
    );

    for (let i = 0; i < numAnnotations; i++) {
      let points: number[][] | undefined;

      // Use poly if available, otherwise convert from bbox
      if (item.poly && item.poly.length > i && item.poly[i]) {
        const poly = item.poly[i];
        if (poly) {
          const { points: polyPoints } = poly;
          points = polyPoints;
        }
      } else if (item.bbox && item.bbox.length > i && item.bbox[i]) {
        const bbox = item.bbox[i];
        if (bbox) {
          const { x, y, width, height } = bbox;

          // Convert bbox to 4 corner points
          points = [
            [x, y],
            [x + width, y],
            [x + width, y + height],
            [x, y + height],
          ];
        }
      }

      // Skip if no geometry data for this annotation
      if (!points) {
        continue;
      }

      // Apply geometry transformations
      points = transformPoints(points as Point[], {
        normalizeShape,
        widthIncrement,
        heightIncrement,
      });

      // Round points to specified precision
      points = roundPoints(points as Point[], precision);

      // Get transcription text for this annotation
      const transcription =
        item.transcription && item.transcription.length > i
          ? item.transcription[i]
          : '';

      // Calculate dt_score based on polygon area
      let dt_score = 1.0;
      try {
        const firstPoint = points[0];
        if (firstPoint) {
          const polygon = turf.polygon([points.concat([firstPoint])]);
          const area = turf.area(polygon);
          dt_score = Math.min(1.0, Math.max(0.5, area / 10000));
        }
      } catch {
        dt_score = 0.8;
      }

      const annotation = {
        transcription: transcription ?? '',
        points,
        dt_score,
      };

      // Group by image path
      if (!resultMap.has(imagePath)) {
        resultMap.set(imagePath, []);
      }
      resultMap.get(imagePath)!.push(annotation);
    }
  }

  return resultMap;
};
