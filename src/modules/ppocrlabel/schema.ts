import z from 'zod';

export const PPOCRLabelSchema = z.array(
  z.object({
    transcription: z.string(),
    points: z.array(z.array(z.number())),
    dt_score: z.number().optional(), // Detection score (from PaddleOCR)
    difficult: z.boolean().optional(), // Difficult flag (from PPOCRLabel tool)
  }),
);

export const PPOCRLabelTaskSchema = z.object({
  imagePath: z.string(),
  data: PPOCRLabelSchema,
});

export type PPOCRLabel = z.infer<typeof PPOCRLabelSchema>;
export type PPOCRLabelTask = z.infer<typeof PPOCRLabelTaskSchema>;
