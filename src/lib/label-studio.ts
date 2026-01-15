import * as turf from '@turf/turf';
import {
  type HorizontalSortOrder,
  OUTPUT_MODE_PREDICTIONS,
  type ShapeNormalizeOption,
  type VerticalSortOrder,
} from '@/constants';
import { type EnhancementOptions, enhancePPOCRLabel } from '@/lib/enhance';
import { type Point, roundPoints, transformPoints } from '@/lib/geometry';
import {
  type FullOCRLabelStudio,
  type MinOCRLabelStudio,
  type PPOCRLabel,
} from '@/lib/schema';

export interface ConversionOptions {
  baseImageDir?: string;
  normalizeShape?: ShapeNormalizeOption;
  widthIncrement?: number;
  heightIncrement?: number;
  precision?: number;
}

export const labelStudioToPPOCR = async (
  data: FullOCRLabelStudio,
  options?: ConversionOptions,
): Promise<Map<string, PPOCRLabel>> => {
  const {
    baseImageDir,
    normalizeShape,
    widthIncrement = 0,
    heightIncrement = 0,
    precision = 0,
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
      const groupedById = new Map<string, typeof annotation.result>();

      for (const resultItem of annotation.result) {
        const { id } = resultItem;
        if (!groupedById.has(id)) {
          groupedById.set(id, []);
        }
        groupedById.get(id)!.push(resultItem);
      }

      // Process each group of result items (with same ID)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for (const [_, resultItems] of groupedById) {
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
    widthIncrement = 0,
    heightIncrement = 0,
    precision = 0,
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

/**
 * Helper function to process and enhance a single annotation or prediction
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
const processAnnotationOrPrediction = <
  T extends { result: any[] } & Record<string, any>,
>(
  annotation: T,
  options: {
    sortVertical?: VerticalSortOrder;
    sortHorizontal?: HorizontalSortOrder;
    normalizeShape?: ShapeNormalizeOption;
    widthIncrement: number;
    heightIncrement: number;
    precision: number;
  },
): T => {
  const {
    sortVertical,
    sortHorizontal,
    normalizeShape,
    widthIncrement,
    heightIncrement,
    precision,
  } = options;

  // Group result items by their ID
  const groupedById = new Map<string, typeof annotation.result>();

  for (const resultItem of annotation.result) {
    const { id } = resultItem;
    if (!groupedById.has(id)) {
      groupedById.set(id, []);
    }
    groupedById.get(id)!.push(resultItem);
  }

  // Process each group and enhance
  const enhancedResult: typeof annotation.result = [];

  for (const [, resultItems] of groupedById) {
    // Collect all items in group to extract points
    let ppocrAnnotations: PPOCRLabel = [];

    for (const resultItem of resultItems) {
      let points: number[][] | undefined;

      // Extract points
      if ('points' in resultItem.value && resultItem.value.points) {
        const { points: valuePoints } = resultItem.value;
        const { original_width, original_height } = resultItem;

        points = valuePoints.map(([x, y]: [number, number]) => [
          ((x ?? 0) * original_width) / 100,
          ((y ?? 0) * original_height) / 100,
        ]);
      } else if (
        'x' in resultItem.value &&
        'y' in resultItem.value &&
        'width' in resultItem.value &&
        'height' in resultItem.value
      ) {
        const { x, y, width, height } = resultItem.value;
        const { original_width, original_height } = resultItem;

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

      if (points) {
        ppocrAnnotations.push({
          transcription: '',
          points: points as Point[],
          dt_score: 1.0,
        });
      }
    }

    // Apply enhancements
    if (ppocrAnnotations.length > 0) {
      ppocrAnnotations = enhancePPOCRLabel(ppocrAnnotations, {
        sortVertical,
        sortHorizontal,
        normalizeShape,
        widthIncrement,
        heightIncrement,
        precision,
      });

      // Convert back to Label Studio format
      for (let i = 0; i < resultItems.length; i++) {
        const resultItem = resultItems[i]!;
        const enhanced = ppocrAnnotations[i];

        if (!enhanced) {
          enhancedResult.push(resultItem);
          continue;
        }

        // Update the points in the result item
        if ('points' in resultItem.value && resultItem.value.points) {
          const { original_width, original_height } = resultItem;

          enhancedResult.push({
            ...resultItem,
            value: {
              ...resultItem.value,
              points: enhanced.points.map(
                ([x, y]) =>
                  [
                    ((x ?? 0) / original_width) * 100,
                    ((y ?? 0) / original_height) * 100,
                  ] as [number, number],
              ),
            },
          });
        } else if (
          'x' in resultItem.value &&
          'y' in resultItem.value &&
          'width' in resultItem.value &&
          'height' in resultItem.value
        ) {
          // Convert back to bbox format
          const { original_width, original_height } = resultItem;
          const xs = enhanced.points.map(([x]) => x ?? 0);
          const ys = enhanced.points.map(([, y]) => y ?? 0);
          const minX = Math.min(...xs);
          const maxX = Math.max(...xs);
          const minY = Math.min(...ys);
          const maxY = Math.max(...ys);

          enhancedResult.push({
            ...resultItem,
            value: {
              ...resultItem.value,
              x: (minX / original_width) * 100,
              y: (minY / original_height) * 100,
              width: ((maxX - minX) / original_width) * 100,
              height: ((maxY - minY) / original_height) * 100,
            },
          });
        } else {
          enhancedResult.push(resultItem);
        }
      }
    } else {
      enhancedResult.push(...resultItems);
    }
  }

  return {
    ...annotation,
    result: enhancedResult,
  };
};
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * Enhance Label Studio data (both Full and Min formats) with sorting, normalization, and resizing
 * Also handles conversion between annotations and predictions based on outputMode
 */
export const enhanceLabelStudioData = async (
  data: FullOCRLabelStudio | MinOCRLabelStudio,
  isFull: boolean,
  options: EnhancementOptions,
): Promise<FullOCRLabelStudio | MinOCRLabelStudio> => {
  const {
    sortVertical,
    sortHorizontal,
    normalizeShape,
    widthIncrement = 0,
    heightIncrement = 0,
    precision = 0,
    outputMode,
  } = options;

  if (isFull) {
    const fullData = data as FullOCRLabelStudio;
    const isPredictions = outputMode === OUTPUT_MODE_PREDICTIONS;

    return fullData.map((task) => {
      const processOptions = {
        sortVertical,
        sortHorizontal,
        normalizeShape,
        widthIncrement,
        heightIncrement,
        precision,
      };

      // Combine annotations and predictions for processing
      const allItems = [
        ...task.annotations.map((a) => ({
          item: a,
          source: 'annotations' as const,
        })),
        ...(task.predictions || []).map((p) => ({
          item: p,
          source: 'predictions' as const,
        })),
      ];

      // Process all items
      const processedItems = allItems.map(({ item }) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        processAnnotationOrPrediction(item as any, processOptions),
      );

      // Convert based on outputMode
      if (isPredictions) {
        // Convert everything to predictions
        return {
          ...task,
          annotations: [],
          predictions: processedItems as typeof task.predictions,
          total_annotations: 0,
          total_predictions: processedItems.length,
        };
      } else {
        // Convert everything to annotations (default)
        return {
          ...task,
          annotations: processedItems as typeof task.annotations,
          predictions: [],
          total_annotations: processedItems.length,
          total_predictions: 0,
        };
      }
    }) as FullOCRLabelStudio;
  } else {
    // Handle MinOCRLabelStudio format
    const minData = data as MinOCRLabelStudio;
    return minData.map((item) => {
      // Collect all points from poly/bbox
      let ppocrAnnotations: PPOCRLabel = [];

      const numAnnotations = Math.max(
        item.poly?.length || 0,
        item.bbox?.length || 0,
        item.transcription?.length || 0,
      );

      for (let i = 0; i < numAnnotations; i++) {
        let points: number[][] | undefined;

        if (item.poly && item.poly.length > i && item.poly[i]) {
          const { points: polyPoints } = item.poly[i]!;
          points = polyPoints;
        } else if (item.bbox && item.bbox.length > i && item.bbox[i]) {
          const { x, y, width, height } = item.bbox[i]!;
          points = [
            [x, y],
            [x + width, y],
            [x + width, y + height],
            [x, y + height],
          ];
        }

        if (points) {
          ppocrAnnotations.push({
            transcription:
              item.transcription && item.transcription.length > i
                ? (item.transcription[i] ?? '')
                : '',
            points: points as Point[],
            dt_score: 1.0,
          });
        }
      }

      // Apply enhancements
      if (ppocrAnnotations.length > 0) {
        ppocrAnnotations = enhancePPOCRLabel(ppocrAnnotations, {
          sortVertical,
          sortHorizontal,
          normalizeShape,
          widthIncrement,
          heightIncrement,
          precision,
        });

        // Convert back to min format
        const newPoly = ppocrAnnotations.map((ann) => ({
          points: ann.points,
        }));

        // Return updated item with poly (omit bbox)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { bbox: _, ...itemWithoutBbox } = item;
        return {
          ...itemWithoutBbox,
          poly: newPoly,
        };
      }

      return item;
    }) as MinOCRLabelStudio;
  }
};
