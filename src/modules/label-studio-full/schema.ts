import z from 'zod';

// Reusable result item schemas
const RectangleResultSchema = z.union([
  // Value from <TextArea /> of <Rectangle />
  z.object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
    rotation: z.number(),
    text: z.array(z.string()),
  }),
  // Value from <Label />
  z.object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
    rotation: z.number(),
    labels: z.array(z.string()),
  }),
  // Value from <Rectangle />
  z.object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
    rotation: z.number(),
  }),
]);

const PolygonResultSchema = z.union([
  // Value from <TextArea /> of <Polygon />
  z.object({
    points: z.array(z.array(z.number())),
    closed: z.boolean(),
    text: z.array(z.string()),
  }),
  // Value from <Label /> of <Polygon />
  z.object({
    points: z.array(z.array(z.number())),
    closed: z.boolean(),
    labels: z.array(z.string()),
  }),
  // Value from <Polygon />
  z.object({
    points: z.array(z.array(z.number())),
    closed: z.boolean(),
  }),
]);

const ResultItemSchema = z.object({
  original_width: z.number(),
  original_height: z.number(),
  image_rotation: z.number(),
  value: z.union([RectangleResultSchema, PolygonResultSchema]),
  id: z.string(),
  from_name: z.string(),
  to_name: z.string(),
  type: z.string(),
  origin: z.string(),
  score: z.number().optional(), // Confidence score for predictions
  readonly: z.boolean().optional(),
  hidden: z.boolean().optional(),
});

// Reusable annotation schema (for annotations field)
const AnnotationSchema = z.object({
  id: z.number(),
  completed_by: z.number(),
  result: z.array(ResultItemSchema),
  was_cancelled: z.boolean(),
  ground_truth: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
  draft_created_at: z.string(),
  lead_time: z.number(),
  prediction: z.object({}),
  result_count: z.number(),
  unique_id: z.string(),
  import_id: z.null(),
  last_action: z.null(),
  bulk_created: z.boolean(),
  task: z.number(),
  project: z.number(),
  updated_by: z.number(),
  parent_prediction: z.null(),
  parent_annotation: z.null(),
  last_created_by: z.null(),
});

// Reusable prediction schema (for predictions field)
const PredictionSchema = z.object({
  id: z.number().optional(),
  model_version: z.string().optional(),
  result: z.array(ResultItemSchema),
  created_ago: z.string().optional(),
  task: z.number().optional(),
  score: z.number().optional(), // Overall prediction score (optional)
});

export const FullOCRLabelStudioSchema = z.object({
  id: z.number(),
  annotations: z.array(AnnotationSchema),
  file_upload: z.string(),
  drafts: z.array(
    z.object({
      id: z.number(),
      user: z.string(),
      created_username: z.string(),
      created_ago: z.string(),
      result: z.array(ResultItemSchema),
      lead_time: z.number(),
      was_postponed: z.boolean(),
      import_id: z.null(),
      created_at: z.string(),
      updated_at: z.string(),
      task: z.number(),
      annotation: z.number(),
    }),
  ),
  predictions: z.array(PredictionSchema),
  data: z.object({ ocr: z.string() }),
  meta: z.record(z.string(), z.any()),
  created_at: z.string(),
  updated_at: z.string(),
  allow_skip: z.boolean(),
  inner_id: z.number(),
  total_annotations: z.number(),
  cancelled_annotations: z.number(),
  total_predictions: z.number(),
  comment_count: z.number(),
  unresolved_comment_count: z.number(),
  last_comment_updated_at: z.null(),
  project: z.number(),
  updated_by: z.number(),
  comment_authors: z.array(z.unknown()),
});

export type RectangleResult = z.infer<typeof RectangleResultSchema>;
export type PolygonResult = z.infer<typeof PolygonResultSchema>;
export type FullOCRLabelStudio = z.infer<typeof FullOCRLabelStudioSchema>;

// Extract nested types for better reusability
export type LabelStudioTask = FullOCRLabelStudio;
export type LabelStudioAnnotation = LabelStudioTask['annotations'][number];
export type LabelStudioPrediction = NonNullable<
  LabelStudioTask['predictions']
>[number];
export type LabelStudioResultItem = LabelStudioAnnotation['result'][number];
