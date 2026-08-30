import { z } from "zod";

export const incidentCreateSchema = z.object({
  title: z.string().min(3, "Incident title must be at least 3 characters"),
  description: z.string().min(5, "Description is required"),
  severity: z.string().default("HIGH"),
  affected_asset_ids: z.array(z.string()).default([]),
  business_service_id: z.string().optional(),
  owner: z.string().optional(),
});

export type IncidentCreateInput = z.infer<typeof incidentCreateSchema>;

export const incidentUpdateSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  severity: z.string().optional(),
  status: z.string().optional(),
  owner: z.string().optional(),
});

export type IncidentUpdateInput = z.infer<typeof incidentUpdateSchema>;

export const incidentCommentSchema = z.object({
  comment: z.string().min(1, "Comment cannot be empty"),
});

export type IncidentCommentInput = z.infer<typeof incidentCommentSchema>;

export const incidentTaskSchema = z.object({
  task: z.string().min(2, "Task description is required"),
  owner: z.string().optional(),
  priority: z.string().default("HIGH"),
  due_date: z.string().optional(),
});

export type IncidentTaskInput = z.infer<typeof incidentTaskSchema>;

export const incidentActionSchema = z.object({
  action_type: z.string().min(1, "Action type is required"),
  target: z.string().min(1, "Target is required"),
  reason: z.string().min(3, "Reason must be at least 3 characters"),
});

export type IncidentActionInput = z.infer<typeof incidentActionSchema>;
