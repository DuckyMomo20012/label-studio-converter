import { z } from 'zod';

// Unified OCR Instance type
export const UnifiedPointSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export const UnifiedOCRBoxSchema = z.object({
  id: z.string().optional(), // Optional unique box id
  points: z.array(UnifiedPointSchema), // Polygon or rectangle points
  text: z.string().optional(), // Recognized text
  score: z.number().optional(), // Confidence score
  metadata: z.record(z.string(), z.any()).optional(), // Extra info from source
});

export const UnifiedOCRTaskSchema = z.object({
  id: z.string().optional(), // Unique instance id
  imagePath: z.string(), // Path or URL to image
  width: z.number(), // Image width
  height: z.number(), // Image height
  boxes: z.array(UnifiedOCRBoxSchema), // All boxes/annotations for this image
  metadata: z.record(z.string(), z.any()).optional(), // Extra info from source
});

export type UnifiedPoint = z.infer<typeof UnifiedPointSchema>;
export type UnifiedOCRBox = z.infer<typeof UnifiedOCRBoxSchema>;
export type UnifiedOCRTask = z.infer<typeof UnifiedOCRTaskSchema>;
