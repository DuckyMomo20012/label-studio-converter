import z from 'zod';

export const MinOCRLabelStudioSchema = z.object({
  ocr: z.string(),
  id: z.number(),
  label: z
    .array(
      z.union([
        z.object({
          x: z.number(),
          y: z.number(),
          width: z.number(),
          height: z.number(),
          rotation: z.number(),
          labels: z.array(z.string()),
          original_width: z.number(),
          original_height: z.number(),
        }),
        z.object({
          points: z.array(z.array(z.number())),
          closed: z.boolean(),
          labels: z.array(z.string()),
          original_width: z.number(),
          original_height: z.number(),
        }),
      ]),
    )
    .optional()
    .default([]),
  poly: z
    .array(
      z.object({
        points: z.array(z.array(z.number())),
        closed: z.boolean(),
        original_width: z.number(),
        original_height: z.number(),
      }),
    )
    .default([])
    .optional(),
  bbox: z
    .array(
      z.object({
        x: z.number(),
        y: z.number(),
        width: z.number(),
        height: z.number(),
        rotation: z.number(),
        original_width: z.number(),
        original_height: z.number(),
      }),
    )
    .default([])
    .optional(),
  transcription: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((val) => {
      if (!val) return [];
      return Array.isArray(val) ? val : [val];
    }),

  annotator: z.number(),
  annotation_id: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
  lead_time: z.number(),
});

export type MinOCRLabelStudio = z.infer<typeof MinOCRLabelStudioSchema>;

// Extract nested types for better reusability
export type LabelStudioTaskMin = MinOCRLabelStudio;
