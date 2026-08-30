import { z } from "zod";

export const threatFeedCreateSchema = z.object({
  name: z.string().min(2, "Feed name must be at least 2 characters"),
  description: z.string().optional(),
  provider: z.string().min(2, "Provider is required"),
  feed_type: z.string().min(1, "Feed type is required"),
  endpoint_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  api_key: z.string().optional(),
  polling_interval_minutes: z.number().int().min(1).default(60),
  enabled: z.boolean().default(true),
});

export type ThreatFeedCreateInput = z.infer<typeof threatFeedCreateSchema>;

export const threatWatchlistCreateSchema = z.object({
  name: z.string().min(2, "Watchlist name must be at least 2 characters"),
  description: z.string().optional(),
  item_type: z.string().min(1, "Item type is required"),
  indicators: z.array(z.string()).default([]),
});

export type ThreatWatchlistCreateInput = z.infer<typeof threatWatchlistCreateSchema>;

export const iocUpdateSchema = z.object({
  status: z.string().optional(),
  confidence: z.string().optional(),
  severity: z.string().optional(),
  threat_classification: z.string().optional(),
});

export type IOCUpdateInput = z.infer<typeof iocUpdateSchema>;
