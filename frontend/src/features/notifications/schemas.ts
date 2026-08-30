import { z } from "zod";

export const NotificationPreferencesSchema = z.object({
  email_alerts_enabled: z.boolean(),
  in_app_alerts_enabled: z.boolean(),
  webhook_alerts_enabled: z.boolean(),
  webhook_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  critical_only: z.boolean(),
});

export const NotificationRuleSchema = z.object({
  event_type: z.string().min(1, "Event type is required"),
  condition_operator: z.string().default("EQ"),
  condition_value: z.string().min(1, "Condition value is required"),
  recipients: z.array(z.string()).min(1, "At least one recipient is required"),
  channel: z.string().default("Email + In-App"),
  frequency: z.string().default("Immediate"),
  is_active: z.boolean().default(true),
});
