import { z } from "zod";

export const AssessmentFormSchema = z.object({
  framework_id: z.string().min(1, "Framework is required"),
  control_id: z.string().min(1, "Control is required"),
  effectiveness_score: z.number().min(0).max(100),
  finding: z.string().optional(),
  recommendation: z.string().optional(),
  status: z.enum(["Draft", "In Progress", "Submitted", "Under Review", "Approved", "Rejected", "Closed"]).default("Draft"),
  notes: z.string().optional(),
});

export type AssessmentFormData = z.infer<typeof AssessmentFormSchema>;

export const EvidenceUploadSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  control_id: z.string().min(1, "Control is required"),
  evidence_type: z.enum([
    "Policy",
    "Procedure",
    "Screenshot",
    "Configuration",
    "Log",
    "Audit Report",
    "Certificate",
    "Document",
    "Ticket",
    "System Record",
  ]),
  expiration_date: z.string().optional(),
});

export type EvidenceUploadData = z.infer<typeof EvidenceUploadSchema>;

export const RemediationActionSchema = z.object({
  finding: z.string().min(5, "Finding summary is required"),
  control_code: z.string().min(1, "Control code is required"),
  owner: z.string().min(2, "Owner is required"),
  priority: z.enum(["Critical", "High", "Medium", "Low"]),
  due_date: z.string().min(1, "Due date is required"),
  status: z.enum(["Open", "Assigned", "In Progress", "Blocked", "Completed", "Verified", "Closed"]).default("Open"),
});

export type RemediationActionData = z.infer<typeof RemediationActionSchema>;
