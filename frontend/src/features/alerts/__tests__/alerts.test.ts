import { describe, it, expect } from "vitest";
import { alertAssignSchema, alertResolveSchema, alertFalsePositiveSchema } from "../schemas";
import { ALERT_STATUSES, ALERT_SEVERITIES } from "../constants";

describe("Alerts Schemas & Constants", () => {
  it("validates alert assignment payload", () => {
    const payload = {
      assigned_to: "SOC Lead Analyst",
      notes: "High priority review",
    };
    const parsed = alertAssignSchema.safeParse(payload);
    expect(parsed.success).toBe(true);
  });

  it("validates alert resolution schema", () => {
    const payload = {
      resolution_notes: "WAF blocked the source IP and verified system integrity.",
      root_cause: "External Recon",
    };
    const parsed = alertResolveSchema.safeParse(payload);
    expect(parsed.success).toBe(true);
  });

  it("rejects alert resolution without adequate notes", () => {
    const payload = {
      resolution_notes: "Done",
    };
    const parsed = alertResolveSchema.safeParse(payload);
    expect(parsed.success).toBe(false);
  });

  it("validates false positive schema", () => {
    const payload = {
      reason: "Internal vulnerability scanner run",
    };
    const parsed = alertFalsePositiveSchema.safeParse(payload);
    expect(parsed.success).toBe(true);
  });

  it("exports alert statuses and severities", () => {
    expect(ALERT_STATUSES.length).toBeGreaterThanOrEqual(5);
    expect(ALERT_SEVERITIES.length).toBeGreaterThanOrEqual(4);
  });
});
