import { z } from "zod";

export const IntegrationCreateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(255),
  category: z.string().min(2, "Category is required"),
  connector_type: z.string().min(2, "Connector type is required"),
  auth_method: z.enum([
    "API_KEY",
    "OAUTH2",
    "BASIC_AUTH",
    "BEARER_TOKEN",
    "CERTIFICATE",
    "CLOUD_ROLE",
    "WEBHOOK_SECRET",
  ]),
  endpoint_url: z.string().url("Must be a valid HTTP/HTTPS URL").optional().or(z.literal("")),
  sync_frequency: z.enum(["EVERY_15_MINUTES", "HOURLY", "DAILY", "WEEKLY", "MANUAL"]),
  sync_mode: z.enum(["INCREMENTAL", "FULL"]),
  is_enabled: z.boolean().default(true),
});

export const IntegrationUpdateSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  endpoint_url: z.string().url().optional().or(z.literal("")),
  sync_frequency: z.enum(["EVERY_15_MINUTES", "HOURLY", "DAILY", "WEEKLY", "MANUAL"]).optional(),
  sync_mode: z.enum(["INCREMENTAL", "FULL"]).optional(),
  is_enabled: z.boolean().optional(),
});

export const WebhookCreateSchema = z.object({
  name: z.string().min(2, "Name is required").max(255),
  event_types: z.array(z.string()).min(1, "Select at least one event type"),
});
