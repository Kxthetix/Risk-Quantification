import { z } from "zod";

export const UserInvitationSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["ADMIN", "SECURITY_ANALYST", "MANAGER", "VIEWER"]),
  expiration_hours: z.number().int().min(1).max(168).default(24),
  message: z.string().max(500).optional(),
});

export const ApiKeyCreateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  expiration_days: z.number().int().min(1).max(365).optional(),
});

export const AnnouncementCreateSchema = z.object({
  title: z.string().min(2, "Title is required").max(255),
  message: z.string().min(1, "Message is required"),
  is_active: z.boolean().default(true),
  scheduled_start: z.string().optional(),
  scheduled_end: z.string().optional(),
});
