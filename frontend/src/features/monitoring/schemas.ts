import { z } from "zod";

export const eventFilterSchema = z.object({
  severity: z.string().optional(),
  event_type: z.string().optional(),
  source: z.string().optional(),
  asset_id: z.string().optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  page_size: z.number().int().min(1).max(100).default(25),
});

export type EventFilterInput = z.input<typeof eventFilterSchema>;
export type EventFilterOutput = z.infer<typeof eventFilterSchema>;
