import { describe, it, expect } from "vitest";
import {
  incidentAssignmentSchema,
  incidentCommunicationSchema,
  incidentNoteSchema,
  incidentReviewSchema,
  incidentTriageSchema,
  socTaskCreateSchema,
} from "../schemas";
import { NOTE_TYPES, ROOT_CAUSE_CATEGORIES, TASK_SLA_STATUSES } from "../constants";

describe("SOC Module Schemas & Constants", () => {
  it("validates incident triage decision schema", () => {
    const triage = {
      decision: "CONFIRMED",
      reason: "Confirmed C2 beaconing on port 443",
      assigned_to: "Marcus Vance",
      severity: "CRITICAL",
    };
    expect(incidentTriageSchema.safeParse(triage).success).toBe(true);
  });

  it("validates incident assignment schema", () => {
    const assignment = {
      assigned_to: "Sarah Chen",
      role: "INCIDENT_COMMANDER",
      notes: "Directing containment",
    };
    expect(incidentAssignmentSchema.safeParse(assignment).success).toBe(true);
  });

  it("validates investigation notes schema", () => {
    const note = {
      note_type: "FINDING",
      content: "Found beacon payload in memory dump.",
    };
    expect(incidentNoteSchema.safeParse(note).success).toBe(true);
  });

  it("validates post-incident review schema", () => {
    const review = {
      root_cause_category: "Vulnerability",
      root_cause_description: "Unauthenticated perimeter gateway buffer overflow.",
      lessons_learned: "Automate emergency patch deployment.",
      contributing_factors: ["Direct internet exposure"],
      affected_controls: ["NIST PR.IP-1"],
      corrective_actions: ["Microsegmentation"],
    };
    expect(incidentReviewSchema.safeParse(review).success).toBe(true);
  });

  it("exports root cause categories and SLA statuses", () => {
    expect(ROOT_CAUSE_CATEGORIES.length).toBeGreaterThanOrEqual(5);
    expect(NOTE_TYPES.length).toBe(4);
    expect(TASK_SLA_STATUSES.length).toBe(3);
  });
});
