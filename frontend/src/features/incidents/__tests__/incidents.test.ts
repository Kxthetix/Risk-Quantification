import { describe, it, expect } from "vitest";
import {
  incidentActionSchema,
  incidentCommentSchema,
  incidentCreateSchema,
  incidentTaskSchema,
} from "../schemas";
import { INCIDENT_STATUSES, INCIDENT_ACTIONS } from "../constants";

describe("Incidents Schemas & Constants", () => {
  it("validates incident creation payload", () => {
    const payload = {
      title: "Critical Ingress Gateway Breach",
      description: "Observed active Cobalt Strike beaconing from payments perimeter.",
      severity: "CRITICAL",
      affected_asset_ids: ["ast-01"],
      owner: "Incident Commander",
    };
    const parsed = incidentCreateSchema.safeParse(payload);
    expect(parsed.success).toBe(true);
  });

  it("validates SOAR containment action schema", () => {
    const actionPayload = {
      action_type: "ISOLATE_ASSET",
      target: "Payments DMZ Gateway",
      reason: "Active C2 beacon containment",
    };
    const parsed = incidentActionSchema.safeParse(actionPayload);
    expect(parsed.success).toBe(true);
  });

  it("validates comment and task schemas", () => {
    expect(incidentCommentSchema.safeParse({ comment: "Forensics complete" }).success).toBe(true);
    expect(incidentTaskSchema.safeParse({ task: "Rotate SSH keys", priority: "CRITICAL" }).success).toBe(true);
  });

  it("exports incident statuses and response actions", () => {
    expect(INCIDENT_STATUSES.length).toBeGreaterThanOrEqual(6);
    expect(INCIDENT_ACTIONS.length).toBeGreaterThanOrEqual(4);
  });
});
