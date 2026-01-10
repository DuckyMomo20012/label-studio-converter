import { readFile } from 'fs/promises';
import { describe, expect, it } from 'vitest';
import {
  labelStudioToPPOCR,
  minLabelStudioToPPOCR,
} from '../src/lib/label-studio';
import {
  FullOCRLabelStudioSchema,
  MinOCRLabelStudioSchema,
} from '../src/lib/schema';

describe('Full Label Studio Format - Fixtures', () => {
  it('should convert label_studio_full_one_rect.json with transcription', async () => {
    const fileContent = await readFile(
      './test/fixtures/label_studio_full_one_rect.json',
      'utf-8',
    );
    const input = FullOCRLabelStudioSchema.parse(JSON.parse(fileContent));

    const result = await labelStudioToPPOCR(input);

    expect(result.size).toBe(1);
    const annotations = Array.from(result.values())[0];
    expect(annotations).toHaveLength(1);
    expect(annotations![0]!.transcription).toBe('ACUTE CORONARY SYNDROME');
    expect(annotations![0]!.points).toHaveLength(4); // Rectangle has 4 points
  });

  it('should convert label_studio_full_one_poly.json with transcription', async () => {
    const fileContent = await readFile(
      './test/fixtures/label_studio_full_one_poly.json',
      'utf-8',
    );
    const input = FullOCRLabelStudioSchema.parse(JSON.parse(fileContent));

    const result = await labelStudioToPPOCR(input);

    expect(result.size).toBe(1);
    const annotations = Array.from(result.values())[0];
    expect(annotations).toHaveLength(1);
    expect(annotations![0]!.transcription).toBe('ACUTE CORONARY SYNDROME');
    expect(annotations![0]!.points).toHaveLength(4); // Polygon has 4 points
  });

  it('should convert label_studio_full_3point_rect.json without transcription', async () => {
    const fileContent = await readFile(
      './test/fixtures/label_studio_full_3point_rect.json',
      'utf-8',
    );
    const input = FullOCRLabelStudioSchema.parse(JSON.parse(fileContent));

    const result = await labelStudioToPPOCR(input);

    expect(result.size).toBe(1);
    const annotations = Array.from(result.values())[0];
    expect(annotations).toHaveLength(1);
    expect(annotations![0]!.transcription).toBe(''); // No transcription field
    expect(annotations![0]!.points).toHaveLength(4); // Rectangle
  });

  it('should convert label_studio_full_poly_multi.json (processes annotations, not drafts)', async () => {
    const fileContent = await readFile(
      './test/fixtures/label_studio_full_poly_multi.json',
      'utf-8',
    );
    const input = FullOCRLabelStudioSchema.parse(JSON.parse(fileContent));

    const result = await labelStudioToPPOCR(input);

    expect(result.size).toBe(1);
    const annotations = Array.from(result.values())[0];
    expect(annotations).toHaveLength(1);
    // Note: This file has a rectangle annotation and a polygon in drafts
    // The converter only processes completed annotations, not drafts
    expect(annotations![0]!.points).toHaveLength(4); // Rectangle
  });

  it('should convert label_studio_full_all.json with multiple annotations', async () => {
    const fileContent = await readFile(
      './test/fixtures/label_studio_full_all.json',
      'utf-8',
    );
    const input = FullOCRLabelStudioSchema.parse(JSON.parse(fileContent));

    const result = await labelStudioToPPOCR(input);

    expect(result.size).toBe(1);
    const annotations = Array.from(result.values())[0];
    expect(annotations).toHaveLength(2);
    expect(annotations![0]!.transcription).toBe('ACUTE CORONARY SYNDROME');
    expect(annotations![1]!.transcription).toBe('UNSTABLE ANGINA');
  });

  it('should handle label_studio_full_no_anno.json with empty annotations', async () => {
    const fileContent = await readFile(
      './test/fixtures/label_studio_full_no_anno.json',
      'utf-8',
    );
    const input = FullOCRLabelStudioSchema.parse(JSON.parse(fileContent));

    const result = await labelStudioToPPOCR(input);

    // Should return empty map or map with empty annotations
    expect(result.size).toBe(0);
  });

  it('should convert label_studio_full_diamond.json with diamond shape', async () => {
    const fileContent = await readFile(
      './test/fixtures/label_studio_full_diamond.json',
      'utf-8',
    );
    const input = FullOCRLabelStudioSchema.parse(JSON.parse(fileContent));

    const result = await labelStudioToPPOCR(input);

    expect(result.size).toBe(1);
    const annotations = Array.from(result.values())[0];
    expect(annotations).toHaveLength(1);
    expect(annotations![0]!.transcription).toBe('ACUTE CORONARY SYNDROME');
    expect(annotations![0]!.points).toHaveLength(4); // Diamond has 4 points
  });

  it('should convert label_studio_full_diamond_vert.json with vertical diamond shape', async () => {
    const fileContent = await readFile(
      './test/fixtures/label_studio_full_diamond_vert.json',
      'utf-8',
    );
    const input = FullOCRLabelStudioSchema.parse(JSON.parse(fileContent));

    const result = await labelStudioToPPOCR(input);

    expect(result.size).toBe(1);
    const annotations = Array.from(result.values())[0];
    expect(annotations).toHaveLength(1);
    expect(annotations![0]!.transcription).toBe('PLAN');
    expect(annotations![0]!.points).toHaveLength(4); // Diamond has 4 points
  });
});

describe('Min Label Studio Format - Fixtures', () => {
  it('should convert label_studio_min_one_rect.json with transcription', async () => {
    const fileContent = await readFile(
      './test/fixtures/label_studio_min_one_rect.json',
      'utf-8',
    );
    const input = MinOCRLabelStudioSchema.parse(JSON.parse(fileContent));

    const result = await minLabelStudioToPPOCR(input);

    expect(result.size).toBe(1);
    const annotations = Array.from(result.values())[0];
    expect(annotations).toHaveLength(1);
    expect(annotations![0]!.transcription).toBe('ACUTE CORONARY SYNDROME');
    expect(annotations![0]!.points).toHaveLength(4);
  });

  it('should convert label_studio_min_one_poly.json with transcription', async () => {
    const fileContent = await readFile(
      './test/fixtures/label_studio_min_one_poly.json',
      'utf-8',
    );
    const input = MinOCRLabelStudioSchema.parse(JSON.parse(fileContent));

    const result = await minLabelStudioToPPOCR(input);

    expect(result.size).toBe(1);
    const annotations = Array.from(result.values())[0];
    expect(annotations).toHaveLength(1);
    expect(annotations![0]!.transcription).toBe('ACUTE CORONARY SYNDROME');
    expect(annotations![0]!.points).toHaveLength(4);
  });

  it('should convert label_studio_min_3point_rect.json without transcription', async () => {
    const fileContent = await readFile(
      './test/fixtures/label_studio_min_3point_rect.json',
      'utf-8',
    );
    const input = MinOCRLabelStudioSchema.parse(JSON.parse(fileContent));

    const result = await minLabelStudioToPPOCR(input);

    expect(result.size).toBe(1);
    const annotations = Array.from(result.values())[0];
    expect(annotations).toHaveLength(1);
    expect(annotations![0]!.transcription).toBe(''); // No transcription
  });

  it('should convert label_studio_min_poly_multi.json without transcription', async () => {
    const fileContent = await readFile(
      './test/fixtures/label_studio_min_poly_multi.json',
      'utf-8',
    );
    const input = MinOCRLabelStudioSchema.parse(JSON.parse(fileContent));

    const result = await minLabelStudioToPPOCR(input);

    expect(result.size).toBe(1);
    const annotations = Array.from(result.values())[0];
    expect(annotations).toHaveLength(1);
    expect(annotations![0]!.transcription).toBe('');
  });

  it('should convert label_studio_min_all.json with multiple annotations', async () => {
    const fileContent = await readFile(
      './test/fixtures/label_studio_min_all.json',
      'utf-8',
    );
    const input = MinOCRLabelStudioSchema.parse(JSON.parse(fileContent));

    const result = await minLabelStudioToPPOCR(input);

    expect(result.size).toBe(1);
    const annotations = Array.from(result.values())[0];
    expect(annotations).toHaveLength(2);
    expect(annotations![0]!.transcription).toBe('ACUTE CORONARY SYNDROME');
    expect(annotations![1]!.transcription).toBe('UNSTABLE ANGINA');
  });

  it('should handle label_studio_min_no_anno.json with no bbox/poly', async () => {
    const fileContent = await readFile(
      './test/fixtures/label_studio_min_no_anno.json',
      'utf-8',
    );
    const input = MinOCRLabelStudioSchema.parse(JSON.parse(fileContent));

    const result = await minLabelStudioToPPOCR(input);

    // Should return empty map since there are no geometries to convert
    expect(result.size).toBe(0);
  });

  it('should convert label_studio_min_diamond.json with diamond shape', async () => {
    const fileContent = await readFile(
      './test/fixtures/label_studio_min_diamond.json',
      'utf-8',
    );
    const input = MinOCRLabelStudioSchema.parse(JSON.parse(fileContent));

    const result = await minLabelStudioToPPOCR(input);

    expect(result.size).toBe(1);
    const annotations = Array.from(result.values())[0];
    expect(annotations).toHaveLength(1);
    expect(annotations![0]!.transcription).toBe('ACUTE CORONARY SYNDROME');
    expect(annotations![0]!.points).toHaveLength(4); // Diamond has 4 points
  });

  it('should convert label_studio_min_diamond_vert.json with vertical diamond shape', async () => {
    const fileContent = await readFile(
      './test/fixtures/label_studio_min_diamond_vert.json',
      'utf-8',
    );
    const input = MinOCRLabelStudioSchema.parse(JSON.parse(fileContent));

    const result = await minLabelStudioToPPOCR(input);

    expect(result.size).toBe(1);
    const annotations = Array.from(result.values())[0];
    expect(annotations).toHaveLength(1);
    expect(annotations![0]!.transcription).toBe('PLAN');
    expect(annotations![0]!.points).toHaveLength(4); // Diamond has 4 points
  });
});

describe('Schema Validation', () => {
  it('should parse all full format fixtures without errors', async () => {
    const fixtures = [
      'label_studio_full_one_rect.json',
      'label_studio_full_one_poly.json',
      'label_studio_full_3point_rect.json',
      'label_studio_full_poly_multi.json',
      'label_studio_full_all.json',
      'label_studio_full_no_anno.json',
      'label_studio_full_diamond.json',
      'label_studio_full_diamond_vert.json',
    ];

    for (const fixture of fixtures) {
      const content = await readFile(`./test/fixtures/${fixture}`, 'utf-8');
      const parsed = JSON.parse(content);
      const result = FullOCRLabelStudioSchema.safeParse(parsed);

      expect(result.success, `${fixture} should parse successfully`).toBe(true);
    }
  });

  it('should parse all min format fixtures without errors', async () => {
    const fixtures = [
      'label_studio_min_one_rect.json',
      'label_studio_min_one_poly.json',
      'label_studio_min_3point_rect.json',
      'label_studio_min_poly_multi.json',
      'label_studio_min_all.json',
      'label_studio_min_no_anno.json',
      'label_studio_min_diamond.json',
      'label_studio_min_diamond_vert.json',
    ];

    for (const fixture of fixtures) {
      const content = await readFile(`./test/fixtures/${fixture}`, 'utf-8');
      const parsed = JSON.parse(content);
      const result = MinOCRLabelStudioSchema.safeParse(parsed);

      expect(result.success, `${fixture} should parse successfully`).toBe(true);
    }
  });
});
