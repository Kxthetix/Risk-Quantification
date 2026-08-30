import { z } from "zod";

export const organizationSettingsSchema = z.object({
  name: z.string().min(2, "Organization name must be at least 2 characters").max(255),
  description: z.string().max(1000).optional().nullable(),
  industry: z.string().min(2, "Industry is required").max(100),
  country: z.string().min(2, "Country is required").max(100).default("India"),
  timezone: z.string().min(1, "Timezone is required").default("Asia/Kolkata"),
  default_currency: z.enum(["INR", "USD", "EUR", "GBP", "JPY"]).default("INR"),
});

export type OrganizationSettingsFormData = z.infer<typeof organizationSettingsSchema>;
