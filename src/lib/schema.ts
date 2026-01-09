import z from 'zod';

export const FullOCRLabelStudioSchema = z.array(
  z.object({
    id: z.number(),
    annotations: z.array(
      z.object({
        id: z.number(),
        completed_by: z.number(),
        result: z.array(
          z.union([
            // Most specific rectangle variants first (with text or labels)
            z.object({
              original_width: z.number(),
              original_height: z.number(),
              image_rotation: z.number(),
              value: z.object({
                x: z.number(),
                y: z.number(),
                width: z.number(),
                height: z.number(),
                rotation: z.number(),
                text: z.array(z.string()),
              }),
              id: z.string(),
              from_name: z.string(),
              to_name: z.string(),
              type: z.string(),
              origin: z.string(),
            }),
            z.object({
              original_width: z.number(),
              original_height: z.number(),
              image_rotation: z.number(),
              value: z.object({
                x: z.number(),
                y: z.number(),
                width: z.number(),
                height: z.number(),
                rotation: z.number(),
                labels: z.array(z.string()),
              }),
              id: z.string(),
              from_name: z.string(),
              to_name: z.string(),
              type: z.string(),
              origin: z.string(),
            }),
            // Base rectangle without text or labels
            z.object({
              original_width: z.number(),
              original_height: z.number(),
              image_rotation: z.number(),
              value: z.object({
                x: z.number(),
                y: z.number(),
                width: z.number(),
                height: z.number(),
                rotation: z.number(),
              }),
              id: z.string(),
              from_name: z.string(),
              to_name: z.string(),
              type: z.string(),
              origin: z.string(),
            }),
            // Most specific polygon variants first (with text or labels)
            z.object({
              original_width: z.number(),
              original_height: z.number(),
              image_rotation: z.number(),
              value: z.object({
                points: z.array(z.array(z.number())),
                closed: z.boolean(),
                text: z.array(z.string()),
              }),
              id: z.string(),
              from_name: z.string(),
              to_name: z.string(),
              type: z.string(),
              origin: z.string(),
            }),
            z.object({
              original_width: z.number(),
              original_height: z.number(),
              image_rotation: z.number(),
              value: z.object({
                points: z.array(z.array(z.number())),
                closed: z.boolean(),
                labels: z.array(z.string()),
              }),
              id: z.string(),
              from_name: z.string(),
              to_name: z.string(),
              type: z.string(),
              origin: z.string(),
            }),
            // Base polygon without text or labels
            z.object({
              original_width: z.number(),
              original_height: z.number(),
              image_rotation: z.number(),
              value: z.object({
                points: z.array(z.array(z.number())),
                closed: z.boolean(),
              }),
              id: z.string(),
              from_name: z.string(),
              to_name: z.string(),
              type: z.string(),
              origin: z.string(),
            }),
          ]),
        ),
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
      }),
    ),
    file_upload: z.string(),
    drafts: z.array(
      z.object({
        id: z.number(),
        user: z.string(),
        created_username: z.string(),
        created_ago: z.string(),
        result: z.array(
          z.union([
            // Most specific rectangle variants first (with text or labels)
            z.object({
              original_width: z.number(),
              original_height: z.number(),
              image_rotation: z.number(),
              value: z.object({
                x: z.number(),
                y: z.number(),
                width: z.number(),
                height: z.number(),
                rotation: z.number(),
                text: z.array(z.string()),
              }),
              id: z.string(),
              from_name: z.string(),
              to_name: z.string(),
              type: z.string(),
              origin: z.string(),
            }),
            z.object({
              original_width: z.number(),
              original_height: z.number(),
              image_rotation: z.number(),
              value: z.object({
                x: z.number(),
                y: z.number(),
                width: z.number(),
                height: z.number(),
                rotation: z.number(),
                labels: z.array(z.string()),
              }),
              id: z.string(),
              from_name: z.string(),
              to_name: z.string(),
              type: z.string(),
              origin: z.string(),
            }),
            // Base rectangle without text or labels
            z.object({
              original_width: z.number(),
              original_height: z.number(),
              image_rotation: z.number(),
              value: z.object({
                x: z.number(),
                y: z.number(),
                width: z.number(),
                height: z.number(),
                rotation: z.number(),
              }),
              id: z.string(),
              from_name: z.string(),
              to_name: z.string(),
              type: z.string(),
              origin: z.string(),
            }),
            // Most specific polygon variants first (with text or labels)
            z.object({
              original_width: z.number(),
              original_height: z.number(),
              image_rotation: z.number(),
              value: z.object({
                points: z.array(z.array(z.number())),
                closed: z.boolean(),
                text: z.array(z.string()),
              }),
              id: z.string(),
              from_name: z.string(),
              to_name: z.string(),
              type: z.string(),
              origin: z.string(),
            }),
            z.object({
              original_width: z.number(),
              original_height: z.number(),
              image_rotation: z.number(),
              value: z.object({
                points: z.array(z.array(z.number())),
                closed: z.boolean(),
                labels: z.array(z.string()),
              }),
              id: z.string(),
              from_name: z.string(),
              to_name: z.string(),
              type: z.string(),
              origin: z.string(),
            }),
            // Base polygon without text or labels
            z.object({
              original_width: z.number(),
              original_height: z.number(),
              image_rotation: z.number(),
              value: z.object({
                points: z.array(z.array(z.number())),
                closed: z.boolean(),
              }),
              id: z.string(),
              from_name: z.string(),
              to_name: z.string(),
              type: z.string(),
              origin: z.string(),
            }),
          ]),
        ),
        lead_time: z.number(),
        was_postponed: z.boolean(),
        import_id: z.null(),
        created_at: z.string(),
        updated_at: z.string(),
        task: z.number(),
        annotation: z.number(),
      }),
    ),
    predictions: z.array(z.unknown()),
    data: z.object({ ocr: z.string() }),
    meta: z.object({}),
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
  }),
);

export const MinOCRLabelStudioSchema = z.array(
  z.object({
    ocr: z.string(),
    id: z.number(),
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
      .optional()
      .default([]),
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
    transcription: z
      .union([z.string(), z.array(z.string())])
      .optional()
      .transform((val) => {
        if (!val) return [];
        return Array.isArray(val) ? val : [val];
      }),
    poly: z
      .array(
        z.object({
          points: z.array(z.array(z.number())),
          closed: z.boolean(),
          original_width: z.number(),
          original_height: z.number(),
        }),
      )
      .optional()
      .default([]),
    annotator: z.number(),
    annotation_id: z.number(),
    created_at: z.string(),
    updated_at: z.string(),
    lead_time: z.number(),
  }),
);

export const PPOCRLabelSchema = z.array(
  z.object({
    transcription: z.string(),
    points: z.array(z.array(z.number())),
    dt_score: z.number(),
  }),
);

export type FullOCRLabelStudio = z.infer<typeof FullOCRLabelStudioSchema>;
export type MinOCRLabelStudio = z.infer<typeof MinOCRLabelStudioSchema>;
export type PPOCRLabel = z.infer<typeof PPOCRLabelSchema>;
