import { describe, expect, it } from 'vitest';
import {
  labelStudioToPPOCR,
  minLabelStudioToPPOCR,
} from '../src/lib/label-studio';
import type { FullOCRLabelStudio, MinOCRLabelStudio } from '../src/lib/schema';

describe('labelStudioToPPOCR', () => {
  it('should convert full Label Studio format with polygon to PPOCR', async () => {
    const input: FullOCRLabelStudio = [
      {
        id: 1,
        annotations: [
          {
            id: 1,
            completed_by: 1,
            result: [
              {
                original_width: 1920,
                original_height: 1080,
                image_rotation: 0,
                value: {
                  points: [
                    [100, 100],
                    [200, 100],
                    [200, 150],
                    [100, 150],
                  ],
                  closed: true,
                },
                id: 'abc123',
                from_name: 'polygon',
                to_name: 'image',
                type: 'polygon',
                origin: 'manual',
              },
              {
                original_width: 1920,
                original_height: 1080,
                image_rotation: 0,
                value: {
                  x: 5.2,
                  y: 9.26,
                  width: 5.2,
                  height: 4.63,
                  rotation: 0,
                  text: ['Hello World'],
                },
                id: 'def456',
                from_name: 'transcription',
                to_name: 'image',
                type: 'textarea',
                origin: 'manual',
              },
            ],
            was_cancelled: false,
            ground_truth: false,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            draft_created_at: '2024-01-01T00:00:00Z',
            lead_time: 0,
            prediction: {},
            result_count: 2,
            unique_id: 'uuid-123',
            import_id: null,
            last_action: null,
            bulk_created: false,
            task: 1,
            project: 1,
            updated_by: 1,
            parent_prediction: null,
            parent_annotation: null,
            last_created_by: null,
          },
        ],
        file_upload: 'test.jpg',
        drafts: [],
        predictions: [],
        data: { ocr: 'Test OCR' },
        meta: {},
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        allow_skip: false,
        inner_id: 1,
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

    const result = await labelStudioToPPOCR(input);

    expect(result.size).toBe(1);
    const imageAnnotations = result.get('Test OCR');
    expect(imageAnnotations).toBeDefined();
    expect(imageAnnotations).toHaveLength(2);
    expect(imageAnnotations![0]!).toHaveProperty('points');
    expect(imageAnnotations![0]!).toHaveProperty('transcription');
    expect(imageAnnotations![0]!).toHaveProperty('dt_score');
    expect(imageAnnotations![0]!.points).toEqual([
      [1920, 1080],
      [3840, 1080],
      [3840, 1620],
      [1920, 1620],
    ]);
    expect(imageAnnotations![0]!.transcription).toBe(''); // Polygon has no text
    expect(imageAnnotations![1]!.transcription).toBe('Hello World');
  });

  it('should convert bbox to polygon points', async () => {
    const input: FullOCRLabelStudio = [
      {
        id: 1,
        annotations: [
          {
            id: 1,
            completed_by: 1,
            result: [
              {
                original_width: 1000,
                original_height: 1000,
                image_rotation: 0,
                value: {
                  x: 10, // 10% of 1000 = 100
                  y: 10, // 10% of 1000 = 100
                  width: 20, // 20% of 1000 = 200
                  height: 15, // 15% of 1000 = 150
                  rotation: 0,
                  text: ['Test'],
                },
                id: 'test123',
                from_name: 'transcription',
                to_name: 'image',
                type: 'textarea',
                origin: 'manual',
              },
            ],
            was_cancelled: false,
            ground_truth: false,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            draft_created_at: '2024-01-01T00:00:00Z',
            lead_time: 0,
            prediction: {},
            result_count: 1,
            unique_id: 'uuid-456',
            import_id: null,
            last_action: null,
            bulk_created: false,
            task: 1,
            project: 1,
            updated_by: 1,
            parent_prediction: null,
            parent_annotation: null,
            last_created_by: null,
          },
        ],
        file_upload: 'test.jpg',
        drafts: [],
        predictions: [],
        data: { ocr: 'Test' },
        meta: {},
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        allow_skip: false,
        inner_id: 1,
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

    const result = await labelStudioToPPOCR(input);

    expect(result.size).toBe(1);
    const imageAnnotations = result.get('Test');
    expect(imageAnnotations).toBeDefined();
    expect(imageAnnotations).toHaveLength(1);
    expect(imageAnnotations![0]!.points).toEqual([
      [100, 100],
      [300, 100],
      [300, 250],
      [100, 250],
    ]);
    expect(imageAnnotations![0]!.transcription).toBe('Test');
  });
});

describe('minLabelStudioToPPOCR', () => {
  it('should convert min Label Studio format to PPOCR', async () => {
    const input: MinOCRLabelStudio = [
      {
        ocr: 'Test Text',
        id: 1,
        bbox: [
          {
            x: 100,
            y: 100,
            width: 200,
            height: 50,
            rotation: 0,
            original_width: 1920,
            original_height: 1080,
          },
        ],
        label: [
          {
            points: [
              [100, 100],
              [300, 100],
              [300, 150],
              [100, 150],
            ],
            closed: true,
            labels: ['text'],
            original_width: 1920,
            original_height: 1080,
          },
        ],
        transcription: ['Test Text'],
        poly: [
          {
            points: [
              [100, 100],
              [300, 100],
              [300, 150],
              [100, 150],
            ],
            closed: true,
            original_width: 1920,
            original_height: 1080,
          },
        ],
        annotator: 1,
        annotation_id: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        lead_time: 0,
      },
    ];

    const result = await minLabelStudioToPPOCR(input);

    expect(result.size).toBe(1);
    const imageAnnotations = result.get('Test Text');
    expect(imageAnnotations).toBeDefined();
    expect(imageAnnotations).toHaveLength(1);
    expect(imageAnnotations![0]!.transcription).toBe('Test Text');
    expect(imageAnnotations![0]!.points).toEqual([
      [100, 100],
      [300, 100],
      [300, 150],
      [100, 150],
    ]);
    expect(imageAnnotations![0]!.dt_score).toBeGreaterThan(0);
  });

  it('should use bbox when poly is not available', async () => {
    const input: MinOCRLabelStudio = [
      {
        ocr: 'Bbox Text',
        id: 1,
        bbox: [
          {
            x: 50,
            y: 50,
            width: 100,
            height: 30,
            rotation: 0,
            original_width: 1920,
            original_height: 1080,
          },
        ],
        label: [],
        transcription: ['Bbox Text'],
        poly: [],
        annotator: 1,
        annotation_id: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        lead_time: 0,
      },
    ];

    const result = await minLabelStudioToPPOCR(input);

    expect(result.size).toBe(1);
    const imageAnnotations = result.get('Bbox Text');
    expect(imageAnnotations).toBeDefined();
    expect(imageAnnotations).toHaveLength(1);
    expect(imageAnnotations![0]!.points).toEqual([
      [50, 50],
      [150, 50],
      [150, 80],
      [50, 80],
    ]);
  });

  it('should fallback to ocr field when transcription is empty', async () => {
    const input: MinOCRLabelStudio = [
      {
        ocr: 'Fallback Text',
        id: 1,
        bbox: [],
        label: [],
        transcription: [],
        poly: [
          {
            points: [
              [10, 10],
              [20, 10],
              [20, 20],
              [10, 20],
            ],
            closed: true,
            original_width: 1920,
            original_height: 1080,
          },
        ],
        annotator: 1,
        annotation_id: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        lead_time: 0,
      },
    ];

    const result = await minLabelStudioToPPOCR(input);

    expect(result.size).toBe(1);
    const imageAnnotations = result.get('Fallback Text');
    expect(imageAnnotations).toBeDefined();
    expect(imageAnnotations).toHaveLength(1);
    expect(imageAnnotations![0]!.transcription).toBe('');
  });
});
