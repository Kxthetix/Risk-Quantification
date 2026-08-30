import { z } from "zod";

export const inviteUserSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .transform((v) => v.toLowerCase().trim()),
  full_name: z.string().min(2, "Full name must be at least 2 characters").max(255),
  role: z.enum(["ADMIN", "SECURITY_ANALYST", "MANAGER", "VIEWER"], {
    required_error: "Please select a user role",
  }),
  message: z.string().max(500).optional(),
});

export type InviteUserFormData = z.infer<typeof inviteUserSchema>;

export const updateUserRoleSchema = z.object({
  role: z.enum(["ADMIN", "SECURITY_ANALYST", "MANAGER", "VIEWER"]),
});

export type UpdateUserRoleFormData = z.infer<typeof updateUserRoleSchema>;

export const suspendUserSchema = z.object({
  reason: z.string().min(5, "Please provide a reason for suspension (at least 5 characters)").max(500),
});

export type SuspendUserFormData = z.infer<typeof suspendUserSchema>;

export const deleteUserSchema = (userEmail: string) =>
  z.object({
    confirmEmail: z.literal(userEmail, {
      errorMap: () => ({ message: "Email does not match exactly" }),
    }),
  });
