import z from 'zod'
import {
  AnnotationSchema,
  FullOCRLabelStudioSchema,
} from '@/modules/label-studio-full/schema'

export const OutputLabelStudioSchema = AnnotationSchema.extend({
  created_username: z.string(),
  created_ago: z.string().optional(),
  completed_by: z.object({
    id: z.number(),
    first_name: z.string(),
    last_name: z.string(),
    email: z.string(),
  }),
  task: FullOCRLabelStudioSchema.omit({
    annotations: true,
    predictions: true,
    drafts: true,
  }).extend({
    overlap: z.number(),
  }),
})

export type OutputLabelStudioTask = z.infer<typeof OutputLabelStudioSchema>
