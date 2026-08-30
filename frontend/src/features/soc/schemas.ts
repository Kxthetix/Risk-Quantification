import { z } from "zod";

export const incidentTriageSchema = z.object({
  decision: z.enum(["CONFIRMED", "FALSE_POSITIVE", "ESCALATED", "ASSIGNED"]),
  reason: z.string().min(3, "Triage justification must be at least 3 characters"),
  assigned_to: z.string().optional(),
  severity: z.string().optional(),
});

export type IncidentTriageInput = z.infer<typeof incidentTriageSchema>;

export const incidentAssignmentSchema = z.object({
  assigned_to: z.string().min(2, "Assignee name is required"),
  assigned_team: z.string().optional(),
  role: z.enum(["ANALYST", "INCIDENT_COMMANDER", "RESPONSE_TEAM", "REVIEWER"]).default("ANALYST"),
  notes: z.string().optional(),
});

export type IncidentAssignmentInput = z.infer<typeof incidentAssignmentSchema>;

export const incidentNoteSchema = z.object({
  note_type: z.enum(["FINDING", "HYPOTHESIS", "OBSERVATION", "RECOMMENDATION"]).default("FINDING"),
  content: z.string().min(1, "Note content cannot be empty"),
});

export type IncidentNoteInput = z.infer<typeof incidentNoteSchema>;

export const incidentReviewSchema = z.object({
  root_cause_category: z.string().min(2, "Root cause category is required"),
  root_cause_description: z.string().min(5, "Root cause description is required"),
  contributing_factors: z.array(z.string()).default([]),
  affected_controls: z.array(z.string()).default([]),
  detection_gaps: z.string().optional(),
  response_gaps: z.string().optional(),
  lessons_learned: z.string().min(5, "Lessons learned are required"),
  corrective_actions: z.array(z.string()).default([]),
});

export type IncidentReviewInput = z.infer<typeof incidentReviewSchema>;

export const incidentCommunicationSchema = z.object({
  communication_type: z.enum(["INTERNAL_UPDATE", "STAKEHOLDER_NOTIFICATION", "EXECUTIVE_BRIEF", "EXTERNAL_STATUS"]),
  subject: z.string().min(3, "Subject is required"),
  message: z.string().min(5, "Message must be at least 5 characters"),
  recipients: z.array(z.string()).default([]),
});

export type IncidentCommunicationInput = z.infer<typeof incidentCommunicationSchema>;

export const socTaskCreateSchema = z.object({
  incident_id: z.string().min(1, "Incident ID is required"),
  task: z.string().min(2, "Task description is required"),
  owner: z.string().min(2, "Task owner is required"),
  priority: z.string().default("HIGH"),
  due_date: z.string().optional(),
});

export type SOCTaskCreateInput = z.infer<typeof socTaskCreateSchema>;
