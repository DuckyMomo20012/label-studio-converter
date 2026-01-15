import { groupBy } from 'es-toolkit';
import {
  DEFAULT_HEIGHT_INCREMENT,
  DEFAULT_LABEL_STUDIO_PRECISION,
  DEFAULT_PPOCR_PRECISION,
  DEFAULT_WIDTH_INCREMENT,
  type HorizontalSortOrder,
  OUTPUT_MODE_PREDICTIONS,
  type OutputMode,
  type ShapeNormalizeOption,
  type VerticalSortOrder,
} from '@/constants';
import { type Point, roundPoints, transformPoints } from '@/lib/geometry';
import {
  type FullOCRLabelStudio,
  type MinOCRLabelStudio,
  type PPOCRLabel,
} from '@/lib/schema';
import { sortBoundingBoxes } from '@/lib/sort';

/**
 * Common enhancement options shared across formats
 */
export interface EnhancementOptions {
  sortVertical?: VerticalSortOrder;
  sortHorizontal?: HorizontalSortOrder;
  normalizeShape?: ShapeNormalizeOption;
  widthIncrement?: number;
  heightIncrement?: number;
  precision?: number;
  outputMode?: OutputMode;
}

/**
 * Apply all enhancement transformations to PPOCRLabel data
 */
export function enhancePPOCRLabel(
  data: PPOCRLabel,
  options: EnhancementOptions,
): PPOCRLabel {
  const {
    sortVertical,
    sortHorizontal,
    normalizeShape,
    widthIncrement = DEFAULT_WIDTH_INCREMENT,
    heightIncrement = DEFAULT_HEIGHT_INCREMENT,
    precision = DEFAULT_PPOCR_PRECISION,
  } = options;

  // Apply sorting first
  let enhanced = data;
  if (sortVertical && sortHorizontal) {
    enhanced = sortBoundingBoxes(enhanced, sortVertical, sortHorizontal);
  }

  // Apply shape transformations
  if (normalizeShape || widthIncrement !== 0 || heightIncrement !== 0) {
    enhanced = enhanced.map((annotation) => {
      let points = transformPoints(annotation.points as Point[], {
        normalizeShape,
        widthIncrement,
        heightIncrement,
      });

      // Apply precision rounding
      points = roundPoints(points, precision);

      return {
        ...annotation,
        points,
      };
    });
  }

  return enhanced;
}

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
  const groupedById = groupBy(annotation.result, (item) => item.id);

  // Process each group and enhance
  const enhancedResult: typeof annotation.result = [];

  for (const [, resultItems] of Object.entries(groupedById)) {
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
    widthIncrement = DEFAULT_WIDTH_INCREMENT,
    heightIncrement = DEFAULT_HEIGHT_INCREMENT,
    precision = DEFAULT_LABEL_STUDIO_PRECISION,
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
