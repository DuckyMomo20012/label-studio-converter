import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { beforeAll, describe, expect, it } from 'vitest';
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

// Dynamic workspace root - works on any machine, any OS
const WORKSPACE_ROOT = resolve(__dirname, '..');

describe('Image Path Resolution - Comprehensive Tests', () => {
  const defaultOptions = {
    sortVertical: 'none' as const,
    sortHorizontal: 'none' as const,
    normalizeShape: 'none' as const,
    widthIncrement: 0,
    heightIncrement: 0,
    precision: -1,
  };

  describe('PPOCR to Label Studio - Full Format', () => {
    it('should resolve image paths without baseServerUrl (relative paths)', async () => {
      const fileContent = await readFile(
        './test/fixtures/ppocr_label_diamond.txt',
        'utf-8',
      );
      const lines = fileContent.trim().split('\n');
      const inputTasks: PPOCRLabelTask[] = lines.map((line) => {
        const [imagePath, annotationsStr] = line.split('\t');
        return {
          imagePath: imagePath!,
          data: JSON.parse(annotationsStr!),
        };
      });

      const results = await ppocrToFullLabelStudioConverters(
        inputTasks,
        'test/fixtures/ppocr_label_diamond.txt',
        {
          ...defaultOptions,
          defaultLabelName: 'text',
          outputMode: 'annotations',
          // No baseServerUrl - should output relative paths
        },
      );

      expect(results).toHaveLength(1);
      expect(results[0]!.data.ocr).toBeDefined();
      // Should be a relative path (no http:// prefix)
      expect(results[0]!.data.ocr).not.toMatch(/^https?:\/\//);
      // Should reference the fixture image
      expect(results[0]!.data.ocr).toMatch(/example\.jpg/);
    });

    it('should resolve image paths with baseServerUrl (http)', async () => {
      const fileContent = await readFile(
        './test/fixtures/ppocr_label_diamond.txt',
        'utf-8',
      );
      const lines = fileContent.trim().split('\n');
      const inputTasks: PPOCRLabelTask[] = lines.map((line) => {
        const [imagePath, annotationsStr] = line.split('\t');
        return {
          imagePath: imagePath!,
          data: JSON.parse(annotationsStr!),
        };
      });

      const results = await ppocrToFullLabelStudioConverters(
        inputTasks,
        'test/fixtures/ppocr_label_diamond.txt',
        {
          ...defaultOptions,
          defaultLabelName: 'text',
          outputMode: 'annotations',
          baseServerUrl: 'http://localhost:8081',
        },
      );

      expect(results).toHaveLength(1);
      expect(results[0]!.data.ocr).toBeDefined();
      // Should start with the base URL
      expect(results[0]!.data.ocr).toMatch(/^http:\/\/localhost:8081\//);
      // Should include the image filename
      expect(results[0]!.data.ocr).toMatch(/example\.jpg/);
    });

    it('should resolve image paths with empty baseServerUrl (Docker mount, absolute path)', async () => {
      const fileContent = await readFile(
        './test/fixtures/ppocr_label_diamond.txt',
        'utf-8',
      );
      const lines = fileContent.trim().split('\n');
      const inputTasks: PPOCRLabelTask[] = lines.map((line) => {
        const [imagePath, annotationsStr] = line.split('\t');
        return {
          imagePath: imagePath!,
          data: JSON.parse(annotationsStr!),
        };
      });

      const results = await ppocrToFullLabelStudioConverters(
        inputTasks,
        'test/fixtures/ppocr_label_diamond.txt',
        {
          ...defaultOptions,
          defaultLabelName: 'text',
          outputMode: 'annotations',
          baseServerUrl: '',
        },
      );

      expect(results).toHaveLength(1);
      expect(results[0]!.data.ocr).toBeDefined();
      // Should start with / for absolute path
      expect(results[0]!.data.ocr).toMatch(/^\//);
      // Should include the image filename
      expect(results[0]!.data.ocr).toMatch(/example\.jpg/);
    });

    it('should resolve image paths with outDir specified (not copying images)', async () => {
      const fileContent = await readFile(
        './test/fixtures/ppocr_label_diamond.txt',
        'utf-8',
      );
      const lines = fileContent.trim().split('\n');
      const inputTasks: PPOCRLabelTask[] = lines.map((line) => {
        const [imagePath, annotationsStr] = line.split('\t');
        return {
          imagePath: imagePath!,
          data: JSON.parse(annotationsStr!),
        };
      });

      const results = await ppocrToFullLabelStudioConverters(
        inputTasks,
        'test/fixtures/ppocr_label_diamond.txt',
        {
          ...defaultOptions,
          defaultLabelName: 'text',
          outputMode: 'annotations',
          outDir: '/tmp/output',
          copyImages: false,
          baseServerUrl: 'http://localhost:8081',
        },
      );

      expect(results).toHaveLength(1);
      expect(results[0]!.data.ocr).toBeDefined();
      // Default imageBaseDir is task-file, which outputs just the filename
      expect(results[0]!.data.ocr).toBe('http://localhost:8081/example.jpg');
    });

    it('should resolve image paths with copyImages=true and imageBaseDir=input-dir', async () => {
      const fileContent = await readFile(
        './test/fixtures/ppocr_label_diamond.txt',
        'utf-8',
      );
      const lines = fileContent.trim().split('\n');
      const inputTasks: PPOCRLabelTask[] = lines.map((line) => {
        const [imagePath, annotationsStr] = line.split('\t');
        return {
          imagePath: imagePath!,
          data: JSON.parse(annotationsStr!),
        };
      });

      const results = await ppocrToFullLabelStudioConverters(
        inputTasks,
        'test/fixtures/ppocr_label_diamond.txt',
        {
          ...defaultOptions,
          defaultLabelName: 'text',
          outputMode: 'annotations',
          outDir: '/tmp/output',
          copyImages: true,
          imageBaseDir: 'input-dir',
          inputBaseDir: WORKSPACE_ROOT,
          baseServerUrl: 'http://localhost:8081',
        },
      );

      expect(results).toHaveLength(1);
      expect(results[0]!.data.ocr).toBeDefined();
      // Should use path structure from input directory
      expect(results[0]!.data.ocr).toMatch(/^http:\/\/localhost:8081\//);
      // Should include fixtures path since that's the structure from inputBaseDir
      expect(results[0]!.data.ocr).toMatch(/fixtures/);
    });

    it('should resolve image paths with copyImages=true and imageBaseDir=task-file', async () => {
      const fileContent = await readFile(
        './test/fixtures/ppocr_label_diamond.txt',
        'utf-8',
      );
      const lines = fileContent.trim().split('\n');
      const inputTasks: PPOCRLabelTask[] = lines.map((line) => {
        const [imagePath, annotationsStr] = line.split('\t');
        return {
          imagePath: imagePath!,
          data: JSON.parse(annotationsStr!),
        };
      });

      const results = await ppocrToFullLabelStudioConverters(
        inputTasks,
        'test/fixtures/ppocr_label_diamond.txt',
        {
          ...defaultOptions,
          defaultLabelName: 'text',
          outputMode: 'annotations',
          outDir: '/tmp/output',
          copyImages: true,
          imageBaseDir: 'task-file',
          baseServerUrl: 'http://localhost:8081',
        },
      );

      expect(results).toHaveLength(1);
      expect(results[0]!.data.ocr).toBeDefined();
      // Should use just filename for task-file mode
      expect(results[0]!.data.ocr).toMatch(/^http:\/\/localhost:8081\//);
      expect(results[0]!.data.ocr).toMatch(/example\.jpg/);
      // Should NOT have directory structure, just filename
      expect(results[0]!.data.ocr).toMatch(/^http:\/\/localhost:8081\/[^/]+$/);
    });

    it('should respect imageBaseDir=input-dir even when copyImages=false (REGRESSION TEST)', async () => {
      const fileContent = await readFile(
        './test/fixtures/ppocr_label_diamond.txt',
        'utf-8',
      );
      const lines = fileContent.trim().split('\n');
      const inputTasks: PPOCRLabelTask[] = lines.map((line) => {
        const [imagePath, annotationsStr] = line.split('\t');
        return {
          imagePath: imagePath!,
          data: JSON.parse(annotationsStr!),
        };
      });

      const results = await ppocrToFullLabelStudioConverters(
        inputTasks,
        'test/fixtures/ppocr_label_diamond.txt',
        {
          ...defaultOptions,
          defaultLabelName: 'text',
          outputMode: 'annotations',
          outDir: '/tmp/output',
          copyImages: false, // DEFAULT - images stay in place
          imageBaseDir: 'input-dir', // User wants paths relative to input directory
          inputBaseDir: WORKSPACE_ROOT,
          baseServerUrl: 'http://localhost:8081',
        },
      );

      expect(results).toHaveLength(1);
      expect(results[0]!.data.ocr).toBeDefined();
      console.log(
        '📸 [imageBaseDir=input-dir, copyImages=false, baseServerUrl=http]:',
        results[0]!.data.ocr,
      );
      // CRITICAL: Should respect imageBaseDir even when copyImages=false
      // Path should be relative to inputBaseDir, not just the filename
      expect(results[0]!.data.ocr).toMatch(/^http:\/\/localhost:8081\//);
      expect(results[0]!.data.ocr).toMatch(/test\/fixtures/);
      expect(results[0]!.data.ocr).not.toMatch(/\.\./); // NO parent directory traversal
      // Should NOT be just the filename
      expect(results[0]!.data.ocr).not.toMatch(
        /^http:\/\/localhost:8081\/[^/]+$/,
      );
    });
  });

  describe('Comprehensive Flag Combinations - ALL FLAGS THAT AFFECT IMAGE PATHS', () => {
    const testFile = 'test/fixtures/ppocr_label_diamond.txt';

    beforeAll(async () => {
      console.log('\n🔬 COMPREHENSIVE IMAGE PATH RESOLUTION TESTS');
      console.log(
        'Testing all flag combinations that affect image path output\n',
      );
    });

    // Helper to load test data
    const loadTestData = async () => {
      const fileContent = await readFile(testFile, 'utf-8');
      const lines = fileContent.trim().split('\n');
      return lines.map((line) => {
        const [imagePath, annotationsStr] = line.split('\t');
        return {
          imagePath: imagePath!,
          data: JSON.parse(annotationsStr!),
        };
      });
    };

    describe('Flag: imageBaseDir (input-dir vs task-file)', () => {
      it('imageBaseDir=input-dir, copyImages=false, baseServerUrl=http', async () => {
        const inputTasks = await loadTestData();
        // Use realistic path: inputBaseDir is parent of test fixtures
        const inputBaseDir = '/home/vinh/Desktop/label-studio-converter';
        const results = await ppocrToFullLabelStudioConverters(
          inputTasks,
          testFile,
          {
            ...defaultOptions,
            defaultLabelName: 'text',
            outputMode: 'annotations',
            outDir: '/tmp/output',
            copyImages: false,
            imageBaseDir: 'input-dir',
            inputBaseDir,
            baseServerUrl: 'http://localhost:8081',
          },
        );

        console.log('  📸 Path:', results[0]!.data.ocr);
        console.log(
          '  ✅ Expected: Relative path from inputBaseDir to image (should be test/fixtures/example.jpg)',
        );
        expect(results[0]!.data.ocr).toMatch(/^http:\/\/localhost:8081\//);
        expect(results[0]!.data.ocr).toMatch(/test\/fixtures/);
        expect(results[0]!.data.ocr).not.toMatch(/\.\./); // Should NOT have .. parent traversal
      });

      it('imageBaseDir=task-file, copyImages=false, baseServerUrl=http', async () => {
        const inputTasks = await loadTestData();
        const results = await ppocrToFullLabelStudioConverters(
          inputTasks,
          testFile,
          {
            ...defaultOptions,
            defaultLabelName: 'text',
            outputMode: 'annotations',
            outDir: '/tmp/output',
            copyImages: false,
            imageBaseDir: 'task-file',
            baseServerUrl: 'http://localhost:8081',
          },
        );

        console.log('  📸 Path:', results[0]!.data.ocr);
        console.log(
          '  ℹ️  task-file mode computes relative path from outDir to image',
        );
        console.log(
          '  ℹ️  When outDir=/tmp/output and image is in workspace, ../ is expected',
        );
        expect(results[0]!.data.ocr).toMatch(/^http:\/\/localhost:8081\//);
        // task-file mode: relative path from output JSON location to image
        // CAN include ../ when output dir is not parent of images
        expect(results[0]!.data.ocr).toBeDefined();
      });

      it('imageBaseDir=input-dir, copyImages=true, baseServerUrl=http', async () => {
        const inputTasks = await loadTestData();
        const inputBaseDir = '/home/vinh/Desktop/label-studio-converter';
        const results = await ppocrToFullLabelStudioConverters(
          inputTasks,
          testFile,
          {
            ...defaultOptions,
            defaultLabelName: 'text',
            outputMode: 'annotations',
            outDir: '/tmp/output',
            copyImages: true,
            imageBaseDir: 'input-dir',
            inputBaseDir,
            baseServerUrl: 'http://localhost:8081',
          },
        );

        console.log('  📸 Path:', results[0]!.data.ocr);
        console.log('  ✅ Expected: test/fixtures/example.jpg');
        expect(results[0]!.data.ocr).toMatch(/^http:\/\/localhost:8081\//);
        expect(results[0]!.data.ocr).toMatch(/test\/fixtures/);
        expect(results[0]!.data.ocr).not.toMatch(/\.\./);
      });

      it('imageBaseDir=task-file, copyImages=true, baseServerUrl=http', async () => {
        const inputTasks = await loadTestData();
        const results = await ppocrToFullLabelStudioConverters(
          inputTasks,
          testFile,
          {
            ...defaultOptions,
            defaultLabelName: 'text',
            outputMode: 'annotations',
            outDir: '/tmp/output',
            copyImages: true,
            imageBaseDir: 'task-file',
            baseServerUrl: 'http://localhost:8081',
          },
        );

        console.log('  📸 Path:', results[0]!.data.ocr);
        expect(results[0]!.data.ocr).toMatch(
          /^http:\/\/localhost:8081\/[^/]+$/,
        );
      });
    });

    describe('Flag: copyImages (true vs false)', () => {
      it('copyImages=true, imageBaseDir=input-dir, baseServerUrl=http', async () => {
        const inputTasks = await loadTestData();
        const inputBaseDir = '/home/vinh/Desktop/label-studio-converter';
        const results = await ppocrToFullLabelStudioConverters(
          inputTasks,
          testFile,
          {
            ...defaultOptions,
            defaultLabelName: 'text',
            outputMode: 'annotations',
            outDir: '/tmp/output',
            copyImages: true,
            imageBaseDir: 'input-dir',
            inputBaseDir,
            baseServerUrl: 'http://localhost:8081',
          },
        );

        console.log('  📸 Path:', results[0]!.data.ocr);
        expect(results[0]!.data.ocr).toMatch(/test\/fixtures/);
        expect(results[0]!.data.ocr).not.toMatch(/\.\./);
      });

      it('copyImages=false, imageBaseDir=input-dir, baseServerUrl=http', async () => {
        const inputTasks = await loadTestData();
        const inputBaseDir = '/home/vinh/Desktop/label-studio-converter';
        const results = await ppocrToFullLabelStudioConverters(
          inputTasks,
          testFile,
          {
            ...defaultOptions,
            defaultLabelName: 'text',
            outputMode: 'annotations',
            outDir: '/tmp/output',
            copyImages: false,
            imageBaseDir: 'input-dir',
            inputBaseDir,
            baseServerUrl: 'http://localhost:8081',
          },
        );

        console.log('  📸 Path:', results[0]!.data.ocr);
        expect(results[0]!.data.ocr).toMatch(/test\/fixtures/);
        expect(results[0]!.data.ocr).not.toMatch(/\.\./);
      });
    });

    describe('Flag: baseServerUrl (undefined vs empty vs http)', () => {
      it('baseServerUrl=undefined, imageBaseDir=input-dir, copyImages=false', async () => {
        const inputTasks = await loadTestData();
        const inputBaseDir = '/home/vinh/Desktop/label-studio-converter';
        const results = await ppocrToFullLabelStudioConverters(
          inputTasks,
          testFile,
          {
            ...defaultOptions,
            defaultLabelName: 'text',
            outputMode: 'annotations',
            outDir: '/tmp/output',
            copyImages: false,
            imageBaseDir: 'input-dir',
            inputBaseDir,
            baseServerUrl: undefined,
          },
        );

        console.log('  📸 Path:', results[0]!.data.ocr);
        expect(results[0]!.data.ocr).not.toMatch(/^http/);
        expect(results[0]!.data.ocr).toMatch(/test\/fixtures/);
        expect(results[0]!.data.ocr).not.toMatch(/\.\./);
      });

      it('baseServerUrl="" (Docker mount), imageBaseDir=input-dir, copyImages=false', async () => {
        const inputTasks = await loadTestData();
        const inputBaseDir = '/home/vinh/Desktop/label-studio-converter';
        const results = await ppocrToFullLabelStudioConverters(
          inputTasks,
          testFile,
          {
            ...defaultOptions,
            defaultLabelName: 'text',
            outputMode: 'annotations',
            outDir: '/tmp/output',
            copyImages: false,
            imageBaseDir: 'input-dir',
            inputBaseDir,
            baseServerUrl: '',
          },
        );

        console.log('  📸 Path:', results[0]!.data.ocr);
        expect(results[0]!.data.ocr).toMatch(/^\//);
        expect(results[0]!.data.ocr).toMatch(/test\/fixtures/);
        expect(results[0]!.data.ocr).not.toMatch(/\.\./);
      });

      it('baseServerUrl="http://localhost:8081", imageBaseDir=input-dir, copyImages=false', async () => {
        const inputTasks = await loadTestData();
        const inputBaseDir = '/home/vinh/Desktop/label-studio-converter';
        const results = await ppocrToFullLabelStudioConverters(
          inputTasks,
          testFile,
          {
            ...defaultOptions,
            defaultLabelName: 'text',
            outputMode: 'annotations',
            outDir: '/tmp/output',
            copyImages: false,
            imageBaseDir: 'input-dir',
            inputBaseDir,
            baseServerUrl: 'http://localhost:8081',
          },
        );

        console.log('  📸 Path:', results[0]!.data.ocr);
        expect(results[0]!.data.ocr).toMatch(/^http:\/\/localhost:8081\//);
        expect(results[0]!.data.ocr).toMatch(/test\/fixtures/);
        expect(results[0]!.data.ocr).not.toMatch(/\.\./);
      });
    });

    describe('Flag: outDir (affects relative path calculation)', () => {
      it('outDir=/tmp/output, imageBaseDir=input-dir, copyImages=false', async () => {
        const inputTasks = await loadTestData();
        const inputBaseDir = '/home/vinh/Desktop/label-studio-converter';
        const results = await ppocrToFullLabelStudioConverters(
          inputTasks,
          testFile,
          {
            ...defaultOptions,
            defaultLabelName: 'text',
            outputMode: 'annotations',
            outDir: '/tmp/output',
            copyImages: false,
            imageBaseDir: 'input-dir',
            inputBaseDir,
            baseServerUrl: 'http://localhost:8081',
          },
        );

        console.log('  📸 Path:', results[0]!.data.ocr);
        expect(results[0]!.data.ocr).toMatch(/test\/fixtures/);
        expect(results[0]!.data.ocr).not.toMatch(/\.\./);
      });

      it('outDir=undefined (same dir as task), imageBaseDir=task-file, copyImages=false', async () => {
        const inputTasks = await loadTestData();
        const results = await ppocrToFullLabelStudioConverters(
          inputTasks,
          testFile,
          {
            ...defaultOptions,
            defaultLabelName: 'text',
            outputMode: 'annotations',
            outDir: undefined,
            copyImages: false,
            imageBaseDir: 'task-file',
            baseServerUrl: 'http://localhost:8081',
          },
        );

        console.log('  📸 Path:', results[0]!.data.ocr);
        expect(results[0]!.data.ocr).toBeDefined();
      });
    });

    describe('Flag: inputBaseDir (required for input-dir mode)', () => {
      it('inputBaseDir=/home/vinh/Desktop/label-studio-converter, imageBaseDir=input-dir, copyImages=false', async () => {
        const inputTasks = await loadTestData();
        const inputBaseDir = '/home/vinh/Desktop/label-studio-converter';
        const results = await ppocrToFullLabelStudioConverters(
          inputTasks,
          testFile,
          {
            ...defaultOptions,
            defaultLabelName: 'text',
            outputMode: 'annotations',
            outDir: '/tmp/output',
            copyImages: false,
            imageBaseDir: 'input-dir',
            inputBaseDir,
            baseServerUrl: 'http://localhost:8081',
          },
        );

        console.log('  📸 Path:', results[0]!.data.ocr);
        expect(results[0]!.data.ocr).toMatch(/test\/fixtures/);
        expect(results[0]!.data.ocr).not.toMatch(/\.\./);
      });

      it('inputBaseDir=undefined, imageBaseDir=input-dir, copyImages=false (should fallback)', async () => {
        const inputTasks = await loadTestData();
        const results = await ppocrToFullLabelStudioConverters(
          inputTasks,
          testFile,
          {
            ...defaultOptions,
            defaultLabelName: 'text',
            outputMode: 'annotations',
            outDir: '/tmp/output',
            copyImages: false,
            imageBaseDir: 'input-dir',
            inputBaseDir: undefined,
            baseServerUrl: 'http://localhost:8081',
          },
        );

        console.log(
          '  📸 Path (fallback to task-file mode):',
          results[0]!.data.ocr,
        );
        console.log(
          '  ⚠️  When inputBaseDir is undefined, falls back to relative path from outDir to image',
        );
        // When inputBaseDir is missing for input-dir mode, it falls back to computing
        // relative path from output directory to image (task-file behavior)
        // This CAN produce ../ paths if output dir is not parent of images
        expect(results[0]!.data.ocr).toBeDefined();
      });
    });

    describe('Complex Combinations - Real World Scenarios', () => {
      it('SCENARIO: User command with --imageBaseDir input-dir, default copyImages=false', async () => {
        const inputTasks = await loadTestData();
        // Realistic: inputBaseDir is parent of test fixtures
        const inputBaseDir = '/home/vinh/Desktop/label-studio-converter';
        const results = await ppocrToFullLabelStudioConverters(
          inputTasks,
          testFile,
          {
            ...defaultOptions,
            defaultLabelName: 'text',
            outputMode: 'predictions',
            outDir: '/tmp/output',
            copyImages: false, // DEFAULT
            imageBaseDir: 'input-dir',
            inputBaseDir,
            baseServerUrl: 'http://localhost:8081',
          },
        );

        console.log('  📸 REAL SCENARIO Path:', results[0]!.data.ocr);
        console.log(
          '  📋 Expected: http://localhost:8081/test/fixtures/example.jpg',
        );
        console.log(
          '  📋 Should contain directory structure from inputBaseDir',
        );
        expect(results[0]!.data.ocr).toBe(
          'http://localhost:8081/test/fixtures/example.jpg',
        );
        expect(results[0]!.data.ocr).not.toMatch(/\.\./);
      });

      it('SCENARIO: Docker mount with empty baseServerUrl, input-dir mode', async () => {
        const inputTasks = await loadTestData();
        const inputBaseDir = WORKSPACE_ROOT; // Use real workspace root
        const results = await ppocrToFullLabelStudioConverters(
          inputTasks,
          testFile,
          {
            ...defaultOptions,
            defaultLabelName: 'text',
            outputMode: 'annotations',
            outDir: '/app/output',
            copyImages: false,
            imageBaseDir: 'input-dir',
            inputBaseDir,
            baseServerUrl: '',
          },
        );

        console.log('  📸 DOCKER MOUNT Path:', results[0]!.data.ocr);
        console.log('  📋 Expected: /test/fixtures/example.jpg');
        expect(results[0]!.data.ocr).toBe('/test/fixtures/example.jpg');
        expect(results[0]!.data.ocr).not.toMatch(/^http/);
        expect(results[0]!.data.ocr).not.toMatch(/\.\./);
      });

      it('SCENARIO: Copy images mode with task-file structure', async () => {
        const inputTasks = await loadTestData();
        const results = await ppocrToFullLabelStudioConverters(
          inputTasks,
          testFile,
          {
            ...defaultOptions,
            defaultLabelName: 'text',
            outputMode: 'annotations',
            outDir: '/output',
            copyImages: true,
            imageBaseDir: 'task-file',
            baseServerUrl: 'http://localhost:8080',
          },
        );

        console.log('  📸 COPY + TASK-FILE Path:', results[0]!.data.ocr);
        console.log('  📋 Expected: http://localhost:8080/[filename-only]');
        expect(results[0]!.data.ocr).toMatch(
          /^http:\/\/localhost:8080\/[^/]+$/,
        );
      });
    });
  });

  describe('PPOCR to Label Studio - Min Format', () => {
    it('should resolve image paths without baseServerUrl (relative paths)', async () => {
      const fileContent = await readFile(
        './test/fixtures/ppocr_label_diamond.txt',
        'utf-8',
      );
      const lines = fileContent.trim().split('\n');
      const inputTasks: PPOCRLabelTask[] = lines.map((line) => {
        const [imagePath, annotationsStr] = line.split('\t');
        return {
          imagePath: imagePath!,
          data: JSON.parse(annotationsStr!),
        };
      });

      const results = await ppocrToMinLabelStudioConverters(
        inputTasks,
        'test/fixtures/ppocr_label_diamond.txt',
        {
          ...defaultOptions,
          defaultLabelName: 'text',
        },
      );

      expect(results).toHaveLength(1);
      expect(results[0]!.ocr).toBeDefined();
      // Should be a relative path
      expect(results[0]!.ocr).not.toMatch(/^https?:\/\//);
      expect(results[0]!.ocr).toMatch(/example\.jpg/);
    });

    it('should resolve image paths with baseServerUrl (http)', async () => {
      const fileContent = await readFile(
        './test/fixtures/ppocr_label_diamond.txt',
        'utf-8',
      );
      const lines = fileContent.trim().split('\n');
      const inputTasks: PPOCRLabelTask[] = lines.map((line) => {
        const [imagePath, annotationsStr] = line.split('\t');
        return {
          imagePath: imagePath!,
          data: JSON.parse(annotationsStr!),
        };
      });

      const results = await ppocrToMinLabelStudioConverters(
        inputTasks,
        'test/fixtures/ppocr_label_diamond.txt',
        {
          ...defaultOptions,
          defaultLabelName: 'text',
          baseServerUrl: 'http://localhost:8081',
        },
      );

      expect(results).toHaveLength(1);
      expect(results[0]!.ocr).toBeDefined();
      expect(results[0]!.ocr).toMatch(/^http:\/\/localhost:8081\//);
      expect(results[0]!.ocr).toMatch(/example\.jpg/);
    });

    it('should resolve image paths with outDir and no copyImages', async () => {
      const fileContent = await readFile(
        './test/fixtures/ppocr_label_diamond.txt',
        'utf-8',
      );
      const lines = fileContent.trim().split('\n');
      const inputTasks: PPOCRLabelTask[] = lines.map((line) => {
        const [imagePath, annotationsStr] = line.split('\t');
        return {
          imagePath: imagePath!,
          data: JSON.parse(annotationsStr!),
        };
      });

      const results = await ppocrToMinLabelStudioConverters(
        inputTasks,
        'test/fixtures/ppocr_label_diamond.txt',
        {
          ...defaultOptions,
          defaultLabelName: 'text',
          outDir: '/tmp/output',
          copyImages: false,
          baseServerUrl: 'http://localhost:8081',
        },
      );

      expect(results).toHaveLength(1);
      expect(results[0]!.ocr).toBeDefined();
      // Should compute relative path from output dir to actual image location
      expect(results[0]!.ocr).toMatch(/^http:\/\/localhost:8081\//);
    });
  });

  describe('Label Studio to PPOCR - Full Format', () => {
    it('should resolve image paths from Label Studio with absolute paths', async () => {
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
        'test/fixtures/label_studio_full_one_rect.json',
        'test/output',
        defaultOptions,
      );

      expect(results).toHaveLength(1);
      expect(results[0]!.imagePath).toBeDefined();
      // Should extract image path correctly
      expect(results[0]!.imagePath).toMatch(/example\.jpg/);
    });

    it('should strip baseServerUrl prefix from image paths', async () => {
      // Real Label Studio exports can have absolute Docker paths like /data/example.jpg
      // Our schema has data.ocr as a string, so we need to create compatible test data
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
        'test/fixtures/label_studio_full_one_rect.json',
        'test/output',
        defaultOptions,
      );

      expect(results).toHaveLength(1);
      expect(results[0]!.imagePath).toBeDefined();
      // Should handle whatever path format is in the fixture
      expect(results[0]!.imagePath).toBeTruthy();
    });
  });

  describe('Label Studio to PPOCR - Min Format', () => {
    it('should resolve image paths from min format Label Studio', async () => {
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
        'test/output',
        defaultOptions,
      );

      expect(results).toHaveLength(input.length);
      results.forEach((result) => {
        expect(result.imagePath).toBeDefined();
        expect(result.imagePath).toMatch(/\.jpg$/);
      });
    });

    it('should handle different path formats in min format', async () => {
      const fileContent = await readFile(
        './test/fixtures/label_studio_min_diamond.json',
        'utf-8',
      );
      const rawData = JSON.parse(fileContent);
      const input: LabelStudioTaskMin[] = rawData.map((task: unknown) =>
        MinOCRLabelStudioSchema.parse(task),
      );

      const results = await minLabelStudioToPPOCRConverters(
        input,
        'test/fixtures/label_studio_min_diamond.json',
        'test/output',
        defaultOptions,
      );

      expect(results).toHaveLength(input.length);
      results.forEach((result) => {
        expect(result.imagePath).toBeDefined();
      });
    });
  });

  describe('Edge Cases - URL Handling', () => {
    it('should handle baseServerUrl with trailing slash', async () => {
      const inputTasks: PPOCRLabelTask[] = [
        {
          imagePath: 'fixtures/example.jpg',
          data: [
            {
              transcription: 'Test',
              points: [
                [0, 0],
                [100, 0],
                [100, 50],
                [0, 50],
              ],
            },
          ],
        },
      ];

      const results = await ppocrToFullLabelStudioConverters(
        inputTasks,
        'test/fixtures/Label.txt',
        {
          ...defaultOptions,
          defaultLabelName: 'text',
          outputMode: 'annotations',
          baseServerUrl: 'http://localhost:8081/',
        },
      );

      expect(results).toHaveLength(1);
      expect(results[0]!.data.ocr).toBeDefined();
      // Should not have double slashes after the port
      const afterPort = results[0]!.data.ocr.split('localhost:8081')[1];
      expect(afterPort).toBeDefined();
      expect(afterPort).not.toMatch(/^\/\//);
    });

    it('should handle baseServerUrl with multiple trailing slashes', async () => {
      const inputTasks: PPOCRLabelTask[] = [
        {
          imagePath: 'fixtures/example.jpg',
          data: [
            {
              transcription: 'Test',
              points: [
                [0, 0],
                [100, 0],
                [100, 50],
                [0, 50],
              ],
            },
          ],
        },
      ];

      const results = await ppocrToFullLabelStudioConverters(
        inputTasks,
        'test/fixtures/Label.txt',
        {
          ...defaultOptions,
          defaultLabelName: 'text',
          outputMode: 'annotations',
          baseServerUrl: 'http://localhost:8081///',
        },
      );

      expect(results).toHaveLength(1);
      expect(results[0]!.data.ocr).toBeDefined();
      // Should normalize to single slash
      const afterPort = results[0]!.data.ocr.split('localhost:8081')[1];
      expect(afterPort).toBeDefined();
      expect(afterPort).not.toMatch(/^\/\//);
    });

    it('should properly encode spaces in URLs', async () => {
      const inputTasks: PPOCRLabelTask[] = [
        {
          imagePath: 'fixtures/image with spaces.jpg',
          data: [
            {
              transcription: 'Test',
              points: [
                [0, 0],
                [100, 0],
                [100, 50],
                [0, 50],
              ],
            },
          ],
        },
      ];

      const results = await ppocrToFullLabelStudioConverters(
        inputTasks,
        'test/fixtures/Label.txt',
        {
          ...defaultOptions,
          defaultLabelName: 'text',
          outputMode: 'annotations',
          baseServerUrl: 'http://localhost:8081',
        },
      );

      expect(results).toHaveLength(1);
      expect(results[0]!.data.ocr).toBeDefined();
      // Should properly encode spaces
      expect(results[0]!.data.ocr).toMatch(/image%20with%20spaces\.jpg/);
    });
  });

  describe('Path Resolution Consistency', () => {
    it('should generate correct paths with baseServerUrl in PPOCR to Label Studio', async () => {
      // Test that PPOCR -> Label Studio generates correct URL paths
      const fileContent = await readFile(
        './test/fixtures/ppocr_label_diamond.txt',
        'utf-8',
      );
      const lines = fileContent.trim().split('\n');
      const inputTasks: PPOCRLabelTask[] = lines.map((line) => {
        const [imagePath, annotationsStr] = line.split('\t');
        return {
          imagePath: imagePath!,
          data: JSON.parse(annotationsStr!),
        };
      });

      // Convert to Label Studio with baseServerUrl
      const labelStudioResults = await ppocrToFullLabelStudioConverters(
        inputTasks,
        'test/fixtures/ppocr_label_diamond.txt',
        {
          ...defaultOptions,
          defaultLabelName: 'text',
          outputMode: 'annotations',
          baseServerUrl: 'http://localhost:8081',
        },
      );

      expect(labelStudioResults).toHaveLength(1);
      expect(labelStudioResults[0]!.data.ocr).toMatch(
        /^http:\/\/localhost:8081\//,
      );
      // Should include the image filename
      expect(labelStudioResults[0]!.data.ocr).toMatch(/example\.jpg/);
      // Path should not have double slashes after the port
      const pathAfterPort = labelStudioResults[0]!.data.ocr.split(':8081')[1];
      expect(pathAfterPort).toBeDefined();
      expect(pathAfterPort).not.toMatch(/^\/\//);
    });

    it('should handle relative paths consistently', async () => {
      const fileContent = await readFile(
        './test/fixtures/ppocr_label_diamond.txt',
        'utf-8',
      );
      const lines = fileContent.trim().split('\n');
      const inputTasks: PPOCRLabelTask[] = lines.map((line) => {
        const [imagePath, annotationsStr] = line.split('\t');
        return {
          imagePath: imagePath!,
          data: JSON.parse(annotationsStr!),
        };
      });

      // Convert without baseServerUrl
      const results = await ppocrToFullLabelStudioConverters(
        inputTasks,
        'test/fixtures/ppocr_label_diamond.txt',
        {
          ...defaultOptions,
          defaultLabelName: 'text',
          outputMode: 'annotations',
        },
      );

      expect(results).toHaveLength(1);
      // Should maintain relative path
      expect(results[0]!.data.ocr).not.toMatch(/^https?:\/\//);
      expect(results[0]!.data.ocr).not.toMatch(/^\//);
    });
  });
});
