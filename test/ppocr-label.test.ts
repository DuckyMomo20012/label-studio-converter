import { describe, expect, it } from 'vitest';
import {
  ppocrToFullLabelStudio,
  ppocrToLabelStudio,
  ppocrToMinLabelStudio,
} from '../src/lib/ppocr-label';
import type { FullOCRLabelStudio, PPOCRLabel } from '../src/lib/schema';

describe('ppocrToLabelStudio', () => {
  const samplePPOCRData: PPOCRLabel = [
    {
      transcription: 'Hello World',
      points: [
        [100, 100],
        [300, 100],
        [300, 150],
        [100, 150],
      ],
      dt_score: 0.95,
    },
    {
      transcription: 'Test Text',
      points: [
        [100, 200],
        [250, 200],
        [250, 230],
        [100, 230],
      ],
      dt_score: 0.88,
    },
  ];

  it('should convert to full Label Studio format by default', async () => {
    const result = await ppocrToLabelStudio(samplePPOCRData, {
      imagePath: 'test/fixtures/images/example.jpg',
      baseServerUrl: '',
    });

    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(1);
    expect(result[0]!).toHaveProperty('id');
    expect(result[0]!).toHaveProperty('annotations');
    expect(result[0]!).toHaveProperty('data');

    // Type assertion for full format
    const firstResult = result[0]! as FullOCRLabelStudio[0];
    expect(firstResult.annotations).toHaveLength(1);
    expect(firstResult.annotations[0]!.result.length).toBe(6); // 2 items * 3 (polygon + labels + textarea each)
  });

  it('should convert to min Label Studio format when toFullJson is false', async () => {
    const result = await ppocrToLabelStudio(samplePPOCRData, {
      imagePath: 'test/fixtures/images/example.jpg',
      baseServerUrl: '',
      toFullJson: false,
    });

    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(2);
    expect(result[0]!).toHaveProperty('ocr');
    expect(result[0]!).toHaveProperty('poly');
    expect(result[0]!).toHaveProperty('transcription');
  });
});

describe('ppocrToFullLabelStudio', () => {
  it('should create proper full Label Studio structure', () => {
    const input: PPOCRLabel = [
      {
        transcription: 'Sample',
        points: [
          [50, 50],
          [150, 50],
          [150, 80],
          [50, 80],
        ],
        dt_score: 0.9,
      },
    ];

    const result = ppocrToFullLabelStudio(
      input,
      'test/fixtures/images/example.jpg',
      '',
    );

    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe(1);
    expect(result[0]!.annotations[0]!.result).toHaveLength(3); // polygon + labels + textarea

    const polyResult = result[0]!.annotations[0]!.result[0]!;
    const labelsResult = result[0]!.annotations[0]!.result[1]!;
    const textResult = result[0]!.annotations[0]!.result[2]!;

    // Check polygon annotation
    expect(polyResult!.type).toBe('polygon');
    expect(
      'points' in polyResult!.value && polyResult!.value.points,
    ).toBeDefined();
    expect('closed' in polyResult!.value && polyResult!.value.closed).toBe(
      true,
    );

    // Check labels annotation
    expect(labelsResult!.type).toBe('labels');
    expect(
      'labels' in labelsResult!.value && labelsResult!.value.labels,
    ).toEqual(['Text']);

    // Check textarea annotation
    expect(textResult!.type).toBe('textarea');
    expect('text' in textResult!.value && textResult!.value.text).toEqual([
      'Sample',
    ]);
  });

  it('should generate unique IDs for each result item', () => {
    const input: PPOCRLabel = [
      {
        transcription: 'First',
        points: [
          [10, 10],
          [20, 10],
          [20, 20],
          [10, 20],
        ],
        dt_score: 1.0,
      },
      {
        transcription: 'Second',
        points: [
          [30, 30],
          [40, 30],
          [40, 40],
          [30, 40],
        ],
        dt_score: 1.0,
      },
    ];

    const result = ppocrToFullLabelStudio(
      input,
      'test/fixtures/images/example.jpg',
      '',
    );
    const ids = result[0]!.annotations[0]!.result.map((r: any) => r.id);

    // There should be 6 IDs total (2 items * 3 annotations each)
    expect(ids.length).toBe(6);

    // Each set of 3 annotations (polygon, labels, textarea) should share the same ID
    // So we should have 2 unique IDs
    expect(new Set(ids).size).toBe(2);

    // All IDs should be 10 characters
    ids.forEach((id: string) => {
      expect(id).toHaveLength(10);
    });
  });

  it('should convert coordinates to percentages', () => {
    const input: PPOCRLabel = [
      {
        transcription: 'Test',
        points: [
          [100, 100],
          [200, 100],
          [200, 200],
          [100, 200],
        ],
        dt_score: 1.0,
      },
    ];

    const result = ppocrToFullLabelStudio(
      input,
      'test/fixtures/images/example.jpg',
      '',
    );
    const polyResult = result[0]!.annotations[0]!.result[0]!;
    const { value } = polyResult!;

    // Type assertion for polygon value
    type PolygonValue = { points: number[][]; closed: boolean };
    const polygonValue = value as PolygonValue;

    // Check that points are converted to percentages
    expect(polygonValue.points).toBeDefined();
    expect(polygonValue.points.length).toBe(4);

    // All percentage values should be between 0 and 100
    polygonValue.points.forEach((point: number[]) => {
      expect(point[0]).toBeGreaterThan(0);
      expect(point[0]).toBeLessThan(100);
      expect(point[1]).toBeGreaterThan(0);
      expect(point[1]).toBeLessThan(100);
    });
  });

  it('should use imagePath in data.ocr and filename in file_upload', () => {
    const input: PPOCRLabel = [
      {
        transcription: 'First',
        points: [
          [10, 10],
          [20, 10],
          [20, 20],
          [10, 20],
        ],
        dt_score: 1.0,
      },
      {
        transcription: 'Second',
        points: [
          [30, 30],
          [40, 30],
          [40, 40],
          [30, 40],
        ],
        dt_score: 1.0,
      },
    ];

    const imagePath = 'test/fixtures/images/example.jpg';
    const result = ppocrToFullLabelStudio(
      input,
      imagePath,
      'http://localhost:8080',
    );
    expect(result[0]!.data.ocr).toBe(
      'http://localhost:8080/test/fixtures/images/example.jpg',
    );
    expect(result[0]!.file_upload).toBe('example.jpg');
  });
});

describe('ppocrToMinLabelStudio', () => {
  it('should create proper min Label Studio structure', () => {
    const input: PPOCRLabel = [
      {
        transcription: 'Test',
        points: [
          [100, 100],
          [200, 100],
          [200, 150],
          [100, 150],
        ],
        dt_score: 0.85,
      },
    ];

    const result = ppocrToMinLabelStudio(
      input,
      'test/fixtures/images/example.jpg',
      'http://localhost:8080',
    );

    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe(1);
    expect(result[0]!.ocr).toBe(
      'http://localhost:8080/test/fixtures/images/example.jpg',
    );
    expect(result[0]!.transcription).toEqual(['Test']);
    expect(result[0]!.poly[0]!.points).toEqual(input[0]!.points);
    expect(result[0]!.bbox).toHaveLength(1);
  });

  it('should calculate bbox correctly from points', () => {
    const input: PPOCRLabel = [
      {
        transcription: 'Bbox Test',
        points: [
          [50, 60],
          [150, 60],
          [150, 90],
          [50, 90],
        ],
        dt_score: 1.0,
      },
    ];

    const result = ppocrToMinLabelStudio(
      input,
      'test/fixtures/images/example.jpg',
      '',
    );

    expect(result[0]!.bbox[0]!.x).toBe(50);
    expect(result[0]!.bbox[0]!.y).toBe(60);
    expect(result[0]!.bbox[0]!.width).toBe(100);
    expect(result[0]!.bbox[0]!.height).toBe(30);
  });

  it('should handle multiple items correctly', () => {
    const input: PPOCRLabel = [
      {
        transcription: 'First',
        points: [
          [10, 10],
          [20, 10],
          [20, 20],
          [10, 20],
        ],
        dt_score: 0.9,
      },
      {
        transcription: 'Second',
        points: [
          [30, 30],
          [50, 30],
          [50, 45],
          [30, 45],
        ],
        dt_score: 0.95,
      },
    ];

    const result = ppocrToMinLabelStudio(
      input,
      'test/fixtures/images/example.jpg',
      '',
    );

    expect(result).toHaveLength(2);
    expect(result[0]!.id).toBe(1);
    expect(result[1]!.id).toBe(2);
    expect(result[0]!.annotation_id).toBe(1);
    expect(result[1]!.annotation_id).toBe(2);
  });

  it('should set default label as text', () => {
    const input: PPOCRLabel = [
      {
        transcription: 'Label Test',
        points: [
          [0, 0],
          [10, 0],
          [10, 10],
          [0, 10],
        ],
        dt_score: 1.0,
      },
    ];

    const result = ppocrToMinLabelStudio(
      input,
      'test/fixtures/images/example.jpg',
      '',
    );

    expect(result[0]!.label[0]!.labels).toEqual(['text']);
  });
});
