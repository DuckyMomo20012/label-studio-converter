import { readFile } from 'fs/promises';
import { describe, expect, it } from 'vitest';
import {
  FullOCRLabelStudioSchema,
  type LabelStudioTask,
  type LabelStudioTaskMin,
  MinOCRLabelStudioSchema,
  type PPOCRLabelTask,
  fullLabelStudioToPPOCRConverters,
  minLabelStudioToPPOCRConverters,
  ppocrToFullLabelStudioConverters,
  ppocrToMinLabelStudioConverters,
} from '../src/lib';

describe('Full Label Studio Format - Fixtures', () => {
  const defaultOptions = {
    sortVertical: 'none' as const,
    sortHorizontal: 'none' as const,
    normalizeShape: 'none' as const,
    widthIncrement: 0,
    heightIncrement: 0,
    precision: -1,
  };

  it('should convert label_studio_full_one_rect.json with transcription', async () => {
    const fileContent = await readFile(
      './test/fixtures/label_studio_full_one_rect.json',
      'utf-8',
    );
    const rawData = JSON.parse(fileContent);
    const input: LabelStudioTask[] = rawData.map((task: unknown) =>
      FullOCRLabelStudioSchema.parse(task),
    );

    const result = await fullLabelStudioToPPOCRConverters(
      input,
      'test/fixtures/test.json',
      defaultOptions,
    );

    expect(result).toHaveLength(1);
    expect(result[0]!.data).toHaveLength(1);
    expect(result[0]!.data[0]!.transcription).toBe('ACUTE CORONARY SYNDROME');
    expect(result[0]!.data[0]!.points).toHaveLength(4); // Rectangle has 4 points
  });

  it('should convert label_studio_full_one_poly.json with transcription', async () => {
    const fileContent = await readFile(
      './test/fixtures/label_studio_full_one_poly.json',
      'utf-8',
    );
    const rawData = JSON.parse(fileContent);
    const input: LabelStudioTask[] = rawData.map((task: unknown) =>
      FullOCRLabelStudioSchema.parse(task),
    );

    const result = await fullLabelStudioToPPOCRConverters(
      input,
      'test/fixtures/test.json',
      defaultOptions,
    );

    expect(result).toHaveLength(1);
    expect(result[0]!.data).toHaveLength(1);
    expect(result[0]!.data[0]!.transcription).toBe('ACUTE CORONARY SYNDROME');
    expect(result[0]!.data[0]!.points).toHaveLength(4); // Polygon has 4 points
  });

  it('should convert label_studio_full_3point_rect.json without transcription', async () => {
    const fileContent = await readFile(
      './test/fixtures/label_studio_full_3point_rect.json',
      'utf-8',
    );
    const rawData = JSON.parse(fileContent);
    const input: LabelStudioTask[] = rawData.map((task: unknown) =>
      FullOCRLabelStudioSchema.parse(task),
    );

    const result = await fullLabelStudioToPPOCRConverters(
      input,
      'test/fixtures/test.json',
      defaultOptions,
    );

    expect(result).toHaveLength(1);
    expect(result[0]!.data).toHaveLength(1);
    expect(result[0]!.data[0]!.transcription).toBe(''); // No transcription field
    expect(result[0]!.data[0]!.points).toHaveLength(4); // Rectangle
  });

  it('should convert label_studio_full_poly_multi_pt.json (processes annotations, not drafts)', async () => {
    const fileContent = await readFile(
      './test/fixtures/label_studio_full_poly_multi_pt.json',
      'utf-8',
    );
    const rawData = JSON.parse(fileContent);
    const input: LabelStudioTask[] = rawData.map((task: unknown) =>
      FullOCRLabelStudioSchema.parse(task),
    );

    const result = await fullLabelStudioToPPOCRConverters(
      input,
      'test/fixtures/test.json',
      defaultOptions,
    );

    expect(result).toHaveLength(1);
    expect(result[0]!.data).toHaveLength(1);
    // Note: This file has a 12-point polygon annotation
    // The converter only processes completed annotations, not drafts
    expect(result[0]!.data[0]!.points).toHaveLength(12); // Polygon with 12 points
  });

  it('should convert label_studio_full_all.json with multiple annotations', async () => {
    const fileContent = await readFile(
      './test/fixtures/label_studio_full_all.json',
      'utf-8',
    );
    const rawData = JSON.parse(fileContent);
    const input: LabelStudioTask[] = rawData.map((task: unknown) =>
      FullOCRLabelStudioSchema.parse(task),
    );

    const result = await fullLabelStudioToPPOCRConverters(
      input,
      'test/fixtures/test.json',
      defaultOptions,
    );

    expect(result).toHaveLength(1);
    expect(result[0]!.data).toHaveLength(4);
    expect(result[0]!.data[0]!.transcription).toBe('ACUTE CORONARY SYNDROME');
    expect(result[0]!.data[1]!.transcription).toBe('UNSTABLE ANGINA');
    expect(result[0]!.data[2]!.transcription).toBe(
      'MILD CORONARY ARTERY DISEASE',
    );
    expect(result[0]!.data[3]!.transcription).toBe('MEDICAL MANAGEMENT');
  });

  it('should handle label_studio_full_no_anno.json with empty annotations', async () => {
    const fileContent = await readFile(
      './test/fixtures/label_studio_full_no_anno.json',
      'utf-8',
    );

    const input: LabelStudioTask[] = JSON.parse(fileContent);

    const result = await fullLabelStudioToPPOCRConverters(
      input,
      'test/fixtures/test.json',
      defaultOptions,
    );

    // Should return task with empty data
    expect(result).toHaveLength(1);
    expect(result[0]!.data).toHaveLength(0);
  });

  it('should convert label_studio_full_diamond.json with diamond shape', async () => {
    const fileContent = await readFile(
      './test/fixtures/label_studio_full_diamond.json',
      'utf-8',
    );
    const rawData = JSON.parse(fileContent);
    const input: LabelStudioTask[] = rawData.map((task: unknown) =>
      FullOCRLabelStudioSchema.parse(task),
    );

    const result = await fullLabelStudioToPPOCRConverters(
      input,
      'test/fixtures/test.json',
      defaultOptions,
    );

    expect(result).toHaveLength(1);
    expect(result[0]!.data).toHaveLength(1);
    expect(result[0]!.data[0]!.transcription).toBe('ACUTE CORONARY SYNDROME');
    expect(result[0]!.data[0]!.points).toHaveLength(4); // Diamond has 4 points
  });

  it('should convert label_studio_full_diamond_vert.json with vertical diamond shape', async () => {
    const fileContent = await readFile(
      './test/fixtures/label_studio_full_diamond_vert.json',
      'utf-8',
    );
    const rawData = JSON.parse(fileContent);
    const input: LabelStudioTask[] = rawData.map((task: unknown) =>
      FullOCRLabelStudioSchema.parse(task),
    );

    const result = await fullLabelStudioToPPOCRConverters(
      input,
      'test/fixtures/test.json',
      defaultOptions,
    );

    expect(result).toHaveLength(1);
    expect(result[0]!.data).toHaveLength(1);
    expect(result[0]!.data[0]!.transcription).toBe('PLAN');
    expect(result[0]!.data[0]!.points).toHaveLength(4); // Diamond has 4 points
  });
});

describe('Min Label Studio Format - Fixtures', () => {
  const defaultOptions = {
    sortVertical: 'none' as const,
    sortHorizontal: 'none' as const,
    normalizeShape: 'none' as const,
    widthIncrement: 0,
    heightIncrement: 0,
    precision: -1,
  };

  it('should convert label_studio_min_one_rect.json with transcription', async () => {
    const fileContent = await readFile(
      './test/fixtures/label_studio_min_one_rect.json',
      'utf-8',
    );
    const rawData = JSON.parse(fileContent);
    const input: LabelStudioTaskMin[] = rawData.map((task: unknown) =>
      MinOCRLabelStudioSchema.parse(task),
    );

    const result = await minLabelStudioToPPOCRConverters(
      input,
      'test/fixtures/test.json',
      defaultOptions,
    );

    expect(result.length).toBeGreaterThan(0);
    expect(result[0]!.data[0]!.transcription).toBe('ACUTE CORONARY SYNDROME');
    expect(result[0]!.data[0]!.points).toHaveLength(4);
  });

  it('should convert label_studio_min_all.json with multiple annotations', async () => {
    const fileContent = await readFile(
      './test/fixtures/label_studio_min_all.json',
      'utf-8',
    );
    const rawData = JSON.parse(fileContent);
    const input: LabelStudioTaskMin[] = rawData.map((task: unknown) =>
      MinOCRLabelStudioSchema.parse(task),
    );

    const result = await minLabelStudioToPPOCRConverters(
      input,
      'test/fixtures/test.json',
      defaultOptions,
    );

    // Should have results
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('PPOCR Label Format - Fixtures', () => {
  const defaultOptions = {
    sortVertical: 'none' as const,
    sortHorizontal: 'none' as const,
    normalizeShape: 'none' as const,
    widthIncrement: 0,
    heightIncrement: 0,
    precision: -1,
    baseServerUrl: '',
  };

  it('should convert ppocr_label_diamond.txt to full Label Studio', async () => {
    const fileContent = await readFile(
      './test/fixtures/ppocr_label_diamond.txt',
      'utf-8',
    );
    const lines = fileContent.split('\n').filter((l) => l.trim());
    const tasks: PPOCRLabelTask[] = lines.map((line) => {
      const [imagePath, dataStr] = line.split('\t');
      return {
        imagePath: imagePath!,
        data: JSON.parse(dataStr!),
      };
    });

    const result = await ppocrToFullLabelStudioConverters(
      tasks,
      'test/fixtures/test.txt',
      defaultOptions,
    );

    expect(result).toHaveLength(tasks.length);
    expect(result[0]!.annotations).toBeDefined();
  });

  it('should convert ppocr_label_diamond.txt to min Label Studio', async () => {
    const fileContent = await readFile(
      './test/fixtures/ppocr_label_diamond.txt',
      'utf-8',
    );
    const lines = fileContent.split('\n').filter((l) => l.trim());
    const tasks: PPOCRLabelTask[] = lines.map((line) => {
      const [imagePath, dataStr] = line.split('\t');
      return {
        imagePath: imagePath!,
        data: JSON.parse(dataStr!),
      };
    });

    const result = await ppocrToMinLabelStudioConverters(
      tasks,
      'test/fixtures/test.txt',
      defaultOptions,
    );

    expect(result.length).toBeGreaterThan(0);
    expect(result[0]!.ocr).toBeDefined();
  });
});
