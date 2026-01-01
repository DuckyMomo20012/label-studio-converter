import { describe, expect, it } from 'vitest';
import {
  SORT_HORIZONTAL_LTR,
  SORT_HORIZONTAL_NONE,
  SORT_HORIZONTAL_RTL,
  SORT_VERTICAL_BOTTOM_TOP,
  SORT_VERTICAL_NONE,
  SORT_VERTICAL_TOP_BOTTOM,
} from '../src/constants';
import type { PPOCRLabel } from '../src/lib/schema';
import { sortBoundingBoxes } from '../src/lib/sort';

describe('sortBoundingBoxes', () => {
  const createAnnotation = (
    transcription: string,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
  ) => ({
    transcription,
    points: [
      [x1, y1],
      [x2, y1],
      [x2, y2],
      [x1, y2],
    ],
    dt_score: 1.0,
  });

  describe('No sorting (both none)', () => {
    it('should return annotations in original order', () => {
      const input: PPOCRLabel = [
        createAnnotation('Third', 100, 300, 200, 350),
        createAnnotation('First', 100, 100, 200, 150),
        createAnnotation('Second', 100, 200, 200, 250),
      ];

      const result = sortBoundingBoxes(
        input,
        SORT_VERTICAL_NONE,
        SORT_HORIZONTAL_NONE,
      );

      expect(result).toEqual(input);
      expect(result[0]!.transcription).toBe('Third');
      expect(result[1]!.transcription).toBe('First');
      expect(result[2]!.transcription).toBe('Second');
    });

    it('should not mutate the original array', () => {
      const input: PPOCRLabel = [
        createAnnotation('A', 100, 100, 200, 150),
        createAnnotation('B', 100, 200, 200, 250),
      ];

      const original = [...input];
      sortBoundingBoxes(input, SORT_VERTICAL_NONE, SORT_HORIZONTAL_NONE);

      expect(input).toEqual(original);
    });
  });

  describe('Vertical sorting only', () => {
    it('should sort top-bottom when horizontal is none', () => {
      const input: PPOCRLabel = [
        createAnnotation('Middle', 100, 200, 200, 250),
        createAnnotation('Top', 100, 50, 200, 100),
        createAnnotation('Bottom', 100, 400, 200, 450),
      ];

      const result = sortBoundingBoxes(
        input,
        SORT_VERTICAL_TOP_BOTTOM,
        SORT_HORIZONTAL_NONE,
      );

      expect(result[0]!.transcription).toBe('Top');
      expect(result[1]!.transcription).toBe('Middle');
      expect(result[2]!.transcription).toBe('Bottom');
    });

    it('should sort bottom-top when horizontal is none', () => {
      const input: PPOCRLabel = [
        createAnnotation('Middle', 100, 200, 200, 250),
        createAnnotation('Top', 100, 50, 200, 100),
        createAnnotation('Bottom', 100, 400, 200, 450),
      ];

      const result = sortBoundingBoxes(
        input,
        SORT_VERTICAL_BOTTOM_TOP,
        SORT_HORIZONTAL_NONE,
      );

      expect(result[0]!.transcription).toBe('Bottom');
      expect(result[1]!.transcription).toBe('Middle');
      expect(result[2]!.transcription).toBe('Top');
    });
  });

  describe('Horizontal sorting only', () => {
    it('should sort left-to-right when vertical is none', () => {
      const input: PPOCRLabel = [
        createAnnotation('Middle', 200, 100, 300, 150),
        createAnnotation('Left', 50, 100, 150, 150),
        createAnnotation('Right', 400, 100, 500, 150),
      ];

      const result = sortBoundingBoxes(
        input,
        SORT_VERTICAL_NONE,
        SORT_HORIZONTAL_LTR,
      );

      expect(result[0]!.transcription).toBe('Left');
      expect(result[1]!.transcription).toBe('Middle');
      expect(result[2]!.transcription).toBe('Right');
    });

    it('should sort right-to-left when vertical is none', () => {
      const input: PPOCRLabel = [
        createAnnotation('Middle', 200, 100, 300, 150),
        createAnnotation('Left', 50, 100, 150, 150),
        createAnnotation('Right', 400, 100, 500, 150),
      ];

      const result = sortBoundingBoxes(
        input,
        SORT_VERTICAL_NONE,
        SORT_HORIZONTAL_RTL,
      );

      expect(result[0]!.transcription).toBe('Right');
      expect(result[1]!.transcription).toBe('Middle');
      expect(result[2]!.transcription).toBe('Left');
    });
  });

  describe('Combined vertical and horizontal sorting', () => {
    it('should sort top-bottom then left-to-right (reading order)', () => {
      const input: PPOCRLabel = [
        createAnnotation('Row2-Col2', 250, 200, 350, 250),
        createAnnotation('Row1-Col2', 250, 50, 350, 100),
        createAnnotation('Row2-Col1', 50, 200, 150, 250),
        createAnnotation('Row1-Col1', 50, 50, 150, 100),
      ];

      const result = sortBoundingBoxes(
        input,
        SORT_VERTICAL_TOP_BOTTOM,
        SORT_HORIZONTAL_LTR,
      );

      expect(result[0]!.transcription).toBe('Row1-Col1');
      expect(result[1]!.transcription).toBe('Row1-Col2');
      expect(result[2]!.transcription).toBe('Row2-Col1');
      expect(result[3]!.transcription).toBe('Row2-Col2');
    });

    it('should sort top-bottom then right-to-left (RTL reading order)', () => {
      const input: PPOCRLabel = [
        createAnnotation('Row2-Col2', 250, 200, 350, 250),
        createAnnotation('Row1-Col2', 250, 50, 350, 100),
        createAnnotation('Row2-Col1', 50, 200, 150, 250),
        createAnnotation('Row1-Col1', 50, 50, 150, 100),
      ];

      const result = sortBoundingBoxes(
        input,
        SORT_VERTICAL_TOP_BOTTOM,
        SORT_HORIZONTAL_RTL,
      );

      expect(result[0]!.transcription).toBe('Row1-Col2');
      expect(result[1]!.transcription).toBe('Row1-Col1');
      expect(result[2]!.transcription).toBe('Row2-Col2');
      expect(result[3]!.transcription).toBe('Row2-Col1');
    });

    it('should sort bottom-top then left-to-right', () => {
      const input: PPOCRLabel = [
        createAnnotation('Row2-Col2', 250, 200, 350, 250),
        createAnnotation('Row1-Col2', 250, 50, 350, 100),
        createAnnotation('Row2-Col1', 50, 200, 150, 250),
        createAnnotation('Row1-Col1', 50, 50, 150, 100),
      ];

      const result = sortBoundingBoxes(
        input,
        SORT_VERTICAL_BOTTOM_TOP,
        SORT_HORIZONTAL_LTR,
      );

      expect(result[0]!.transcription).toBe('Row2-Col1');
      expect(result[1]!.transcription).toBe('Row2-Col2');
      expect(result[2]!.transcription).toBe('Row1-Col1');
      expect(result[3]!.transcription).toBe('Row1-Col2');
    });

    it('should handle complex document layout', () => {
      // Simulating a document with 3 rows and varying columns
      const input: PPOCRLabel = [
        createAnnotation('R3-C1', 50, 400, 150, 450),
        createAnnotation('R1-C3', 450, 50, 550, 100),
        createAnnotation('R2-C2', 250, 200, 350, 250),
        createAnnotation('R1-C1', 50, 50, 150, 100),
        createAnnotation('R2-C1', 50, 200, 150, 250),
        createAnnotation('R1-C2', 250, 50, 350, 100),
      ];

      const result = sortBoundingBoxes(
        input,
        SORT_VERTICAL_TOP_BOTTOM,
        SORT_HORIZONTAL_LTR,
      );

      expect(result[0]!.transcription).toBe('R1-C1');
      expect(result[1]!.transcription).toBe('R1-C2');
      expect(result[2]!.transcription).toBe('R1-C3');
      expect(result[3]!.transcription).toBe('R2-C1');
      expect(result[4]!.transcription).toBe('R2-C2');
      expect(result[5]!.transcription).toBe('R3-C1');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty array', () => {
      const input: PPOCRLabel = [];

      const result = sortBoundingBoxes(
        input,
        SORT_VERTICAL_TOP_BOTTOM,
        SORT_HORIZONTAL_LTR,
      );

      expect(result).toEqual([]);
    });

    it('should handle single annotation', () => {
      const input: PPOCRLabel = [createAnnotation('Only', 100, 100, 200, 150)];

      const result = sortBoundingBoxes(
        input,
        SORT_VERTICAL_TOP_BOTTOM,
        SORT_HORIZONTAL_LTR,
      );

      expect(result).toHaveLength(1);
      expect(result[0]!.transcription).toBe('Only');
    });

    it('should handle overlapping bounding boxes', () => {
      const input: PPOCRLabel = [
        createAnnotation('Large', 50, 50, 300, 300),
        createAnnotation('Small', 100, 100, 200, 150),
      ];

      const result = sortBoundingBoxes(
        input,
        SORT_VERTICAL_TOP_BOTTOM,
        SORT_HORIZONTAL_LTR,
      );

      // Small box center is at y=125, large box center at y=175
      expect(result[0]!.transcription).toBe('Small');
      expect(result[1]!.transcription).toBe('Large');
    });

    it('should handle very small coordinate differences', () => {
      const input: PPOCRLabel = [
        createAnnotation('A', 100.0, 100.0, 200.0, 150.0),
        createAnnotation('B', 100.0, 100.001, 200.0, 150.0),
      ];

      const result = sortBoundingBoxes(
        input,
        SORT_VERTICAL_TOP_BOTTOM,
        SORT_HORIZONTAL_NONE,
      );

      // Should maintain stable order due to threshold
      expect(result).toHaveLength(2);
    });

    it('should not mutate original array with sorting', () => {
      const input: PPOCRLabel = [
        createAnnotation('B', 100, 200, 200, 250),
        createAnnotation('A', 100, 100, 200, 150),
      ];

      const originalOrder = input.map((a) => a.transcription);
      sortBoundingBoxes(input, SORT_VERTICAL_TOP_BOTTOM, SORT_HORIZONTAL_NONE);

      expect(input.map((a) => a.transcription)).toEqual(originalOrder);
    });
  });

  describe('Real-world scenarios', () => {
    it('should sort multi-line document in reading order', () => {
      const input: PPOCRLabel = [
        createAnnotation('Line 3', 50, 300, 500, 340),
        createAnnotation('Line 1', 50, 100, 500, 140),
        createAnnotation('Line 5', 50, 500, 500, 540),
        createAnnotation('Line 2', 50, 200, 500, 240),
        createAnnotation('Line 4', 50, 400, 500, 440),
      ];

      const result = sortBoundingBoxes(
        input,
        SORT_VERTICAL_TOP_BOTTOM,
        SORT_HORIZONTAL_NONE,
      );

      expect(result[0]!.transcription).toBe('Line 1');
      expect(result[1]!.transcription).toBe('Line 2');
      expect(result[2]!.transcription).toBe('Line 3');
      expect(result[3]!.transcription).toBe('Line 4');
      expect(result[4]!.transcription).toBe('Line 5');
    });

    it('should sort table cells in reading order', () => {
      const input: PPOCRLabel = [
        createAnnotation('R2C3', 400, 200, 500, 250),
        createAnnotation('R1C1', 100, 100, 200, 150),
        createAnnotation('R2C1', 100, 200, 200, 250),
        createAnnotation('R1C2', 250, 100, 350, 150),
        createAnnotation('R2C2', 250, 200, 350, 250),
        createAnnotation('R1C3', 400, 100, 500, 150),
      ];

      const result = sortBoundingBoxes(
        input,
        SORT_VERTICAL_TOP_BOTTOM,
        SORT_HORIZONTAL_LTR,
      );

      expect(result[0]!.transcription).toBe('R1C1');
      expect(result[1]!.transcription).toBe('R1C2');
      expect(result[2]!.transcription).toBe('R1C3');
      expect(result[3]!.transcription).toBe('R2C1');
      expect(result[4]!.transcription).toBe('R2C2');
      expect(result[5]!.transcription).toBe('R2C3');
    });

    it('should sort Arabic/Hebrew style text (RTL)', () => {
      const input: PPOCRLabel = [
        createAnnotation('Row2-Word3', 100, 200, 200, 250),
        createAnnotation('Row1-Word1', 400, 50, 500, 100),
        createAnnotation('Row2-Word1', 400, 200, 500, 250),
        createAnnotation('Row1-Word2', 250, 50, 350, 100),
        createAnnotation('Row2-Word2', 250, 200, 350, 250),
        createAnnotation('Row1-Word3', 100, 50, 200, 100),
      ];

      const result = sortBoundingBoxes(
        input,
        SORT_VERTICAL_TOP_BOTTOM,
        SORT_HORIZONTAL_RTL,
      );

      expect(result[0]!.transcription).toBe('Row1-Word1');
      expect(result[1]!.transcription).toBe('Row1-Word2');
      expect(result[2]!.transcription).toBe('Row1-Word3');
      expect(result[3]!.transcription).toBe('Row2-Word1');
      expect(result[4]!.transcription).toBe('Row2-Word2');
      expect(result[5]!.transcription).toBe('Row2-Word3');
    });
  });
});
