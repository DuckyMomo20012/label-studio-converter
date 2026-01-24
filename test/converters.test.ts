import { readFile } from 'fs/promises';
import { describe, expect, it } from 'vitest';
import {
  FullOCRLabelStudioSchema,
  type LabelStudioTask,
  type LabelStudioTaskMin,
  MinOCRLabelStudioSchema,
  PPOCRLabelSchema,
  type PPOCRLabelTask,
  fullLabelStudioToPPOCRConverters,
  minLabelStudioToPPOCRConverters,
  ppocrToFullLabelStudioConverters,
  ppocrToMinLabelStudioConverters,
} from '../src/lib';

describe('Converters', () => {
  describe('Label Studio to PPOCR Converters', () => {
    it('should convert full Label Studio to PPOCR format', async () => {
      const fileContent = await readFile(
        './test/fixtures/label_studio_full_one_rect.json',
        'utf-8',
      );
      const rawData = JSON.parse(fileContent);
      const input: LabelStudioTask[] = rawData.map((task: unknown) =>
        FullOCRLabelStudioSchema.parse(task),
      );

      const results = await fullLabelStudioToPPOCRConverters(
        input,
        'test/fixtures/test.json',
        'test/fixtures',
        {
          sortVertical: 'none',
          sortHorizontal: 'none',
          normalizeShape: 'none',
          widthIncrement: 0,
          heightIncrement: 0,
          precision: -1,
        },
      );

      expect(results).toHaveLength(1);
      expect(results[0]!.data).toHaveLength(1);
      expect(results[0]!.data[0]!.transcription).toBe(
        'ACUTE CORONARY SYNDROME',
      );
      expect(results[0]!.data[0]!.points).toHaveLength(4);
    });

    it('should convert min Label Studio to PPOCR format', async () => {
      const fileContent = await readFile(
        './test/fixtures/label_studio_min_one_rect.json',
        'utf-8',
      );
      const rawData = JSON.parse(fileContent);
      const input: LabelStudioTaskMin[] = rawData.map((task: unknown) =>
        MinOCRLabelStudioSchema.parse(task),
      );

      const results = await minLabelStudioToPPOCRConverters(
        input,
        'test/fixtures/label_studio_min_one_rect.json',
        'test/fixtures',
        {
          sortVertical: 'none',
          sortHorizontal: 'none',
          normalizeShape: 'none',
          widthIncrement: 0,
          heightIncrement: 0,
          precision: -1,
        },
      );

      expect(results).toHaveLength(input.length);
      expect(results[0]!.data[0]!.transcription).toBeDefined();
    });

    it('should apply shape normalization in conversion', async () => {
      const fileContent = await readFile(
        './test/fixtures/label_studio_full_diamond.json',
        'utf-8',
      );
      const rawData = JSON.parse(fileContent);
      const input: LabelStudioTask[] = rawData.map((task: unknown) =>
        FullOCRLabelStudioSchema.parse(task),
      );

      const results = await fullLabelStudioToPPOCRConverters(
        input,
        'test/fixtures/label_studio_full_diamond.json',
        'test/fixtures',
        {
          sortVertical: 'none',
          sortHorizontal: 'none',
          normalizeShape: 'rectangle',
          widthIncrement: 0,
          heightIncrement: 0,
          precision: 2,
        },
      );

      // Should have normalized to rectangle (4 points)
      const { points } = results[0]!.data[0]!;
      expect(points).toHaveLength(4);

      // Check it's axis-aligned rectangle (coordinates should be rounded)
      const xs = points.map((p) => p[0]!);
      const ys = points.map((p) => p[1]!);
      const uniqueXs = [...new Set(xs)];
      const uniqueYs = [...new Set(ys)];

      expect(uniqueXs).toHaveLength(2); // Only 2 unique x values
      expect(uniqueYs).toHaveLength(2); // Only 2 unique y values
    });

    it('should handle empty annotations', async () => {
      const fileContent = await readFile(
        './test/fixtures/label_studio_full_no_anno.json',
        'utf-8',
      );
      const rawData = JSON.parse(fileContent);
      const input: LabelStudioTask[] = rawData.map((task: unknown) =>
        FullOCRLabelStudioSchema.parse(task),
      );

      const results = await fullLabelStudioToPPOCRConverters(
        input,
        'test/fixtures/label_studio_full_no_anno.json',
        'test/fixtures',
        {
          sortVertical: 'none',
          sortHorizontal: 'none',
          normalizeShape: 'none',
          widthIncrement: 0,
          heightIncrement: 0,
          precision: -1,
        },
      );

      expect(results).toHaveLength(1);
      expect(results[0]!.data).toHaveLength(0);
    });
  });

  describe('PPOCR to Label Studio Converters', () => {
    it('should convert PPOCR to full Label Studio format', async () => {
      const fileContent = await readFile(
        './test/fixtures/ppocr_label_diamond.txt',
        'utf-8',
      );
      const lines = fileContent.split('\n').filter((l) => l.trim());
      const tasks: PPOCRLabelTask[] = lines.map((line) => {
        const [imagePath, dataStr] = line.split('\t');
        const parsedData = PPOCRLabelSchema.parse(JSON.parse(dataStr!));
        return {
          imagePath: imagePath!,
          data: parsedData,
        };
      });

      const results = await ppocrToFullLabelStudioConverters(
        tasks,
        'test/fixtures/ppocr_label_diamond.txt',
        {
          sortVertical: 'none',
          sortHorizontal: 'none',
          normalizeShape: 'none',
          widthIncrement: 0,
          heightIncrement: 0,
          precision: -1,
          baseServerUrl: 'http://example.com',
        },
      );

      expect(results).toHaveLength(tasks.length);
      expect(results[0]!.annotations).toHaveLength(1);
      expect(results[0]!.annotations[0]!.result.length).toBeGreaterThan(0);
    });

    it('should convert PPOCR to min Label Studio format', async () => {
      const fileContent = await readFile(
        './test/fixtures/ppocr_label_diamond.txt',
        'utf-8',
      );
      const lines = fileContent.split('\n').filter((l) => l.trim());
      const tasks: PPOCRLabelTask[] = lines.map((line) => {
        const [imagePath, dataStr] = line.split('\t');
        const parsedData = PPOCRLabelSchema.parse(JSON.parse(dataStr!));
        return {
          imagePath: imagePath!,
          data: parsedData,
        };
      });

      const results = await ppocrToMinLabelStudioConverters(
        tasks,
        'test/fixtures/ppocr_label_diamond.txt',
        {
          sortVertical: 'none',
          sortHorizontal: 'none',
          normalizeShape: 'none',
          widthIncrement: 0,
          heightIncrement: 0,
          precision: -1,
        },
      );

      // Min format has one entry per annotation
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]!.ocr).toBeDefined();
      expect(results[0]!.transcription).toBeDefined();
    });

    it('should handle empty PPOCR data', async () => {
      const fileContent = await readFile(
        './test/fixtures/ppocr_label_empty.txt',
        'utf-8',
      );
      const lines = fileContent.split('\n').filter((l) => l.trim());
      const tasks: PPOCRLabelTask[] = lines.map((line) => {
        const [imagePath, dataStr] = line.split('\t');
        const parsedData = PPOCRLabelSchema.parse(JSON.parse(dataStr!));
        return {
          imagePath: imagePath!,
          data: parsedData,
        };
      });

      const results = await ppocrToFullLabelStudioConverters(
        tasks,
        'test/fixtures/ppocr_label_empty.txt',
        {
          sortVertical: 'none',
          sortHorizontal: 'none',
          normalizeShape: 'none',
          widthIncrement: 0,
          heightIncrement: 0,
          precision: -1,
        },
      );

      expect(results).toHaveLength(tasks.length);
      // Empty PPOCR data should result in empty annotations
      expect(results[0]?.annotations[0]?.result ?? []).toHaveLength(0);
    });
  });

  describe('Round-trip conversion', () => {
    it('should preserve data through Label Studio -> PPOCR -> Label Studio', async () => {
      const fileContent = await readFile(
        './test/fixtures/label_studio_full_one_rect.json',
        'utf-8',
      );
      const rawData = JSON.parse(fileContent);
      const originalInput: LabelStudioTask[] = rawData.map((task: unknown) =>
        FullOCRLabelStudioSchema.parse(task),
      );

      // Convert to PPOCR
      const ppocrResults = await fullLabelStudioToPPOCRConverters(
        originalInput,
        'test/fixtures/label_studio_full_one_rect.json',
        'test/fixtures',
        {
          sortVertical: 'none',
          sortHorizontal: 'none',
          normalizeShape: 'none',
          widthIncrement: 0,
          heightIncrement: 0,
          precision: 0, // Round to avoid floating point issues
        },
      );

      // Convert back to Label Studio
      const labelStudioResults = await ppocrToFullLabelStudioConverters(
        ppocrResults,
        'test/fixtures/ppocr_label_diamond.txt',
        {
          sortVertical: 'none',
          sortHorizontal: 'none',
          normalizeShape: 'none',
          widthIncrement: 0,
          heightIncrement: 0,
          precision: 0,
        },
      );

      // Should have same number of tasks
      expect(labelStudioResults).toHaveLength(originalInput.length);

      // Check transcription is preserved
      const originalTextArea = originalInput[0]!.annotations[0]!.result.find(
        (r) => r.type === 'textarea',
      );
      const originalText =
        originalTextArea &&
        'text' in originalTextArea.value &&
        originalTextArea.value.text
          ? originalTextArea.value.text[0]
          : undefined;

      const finalTextArea = labelStudioResults[0]!.annotations[0]!.result.find(
        (r) => r.type === 'textarea',
      );
      const finalText =
        finalTextArea &&
        'text' in finalTextArea.value &&
        finalTextArea.value.text
          ? finalTextArea.value.text[0]
          : undefined;

      expect(finalText).toBe(originalText);
    });
  });
});
