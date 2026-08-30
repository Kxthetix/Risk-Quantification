import { describe, it, expect } from "vitest";
import { caseCreateSchema, caseUpdateSchema } from "../schemas";
import { CASE_STATUSES } from "../constants";

describe("Case Management Schemas & Constants", () => {
  it("validates case creation payload", () => {
    const payload = {
      title: "Operation FIN7 Payment Gateway Intrusion",
      description: "Coordinated credit card skimming and beaconing activity across retail stores.",
      severity: "CRITICAL",
      lead_investigator: "Marcus Vance",
      incident_ids: ["INC-001", "INC-002"],
      tags: ["FIN7", "Payment Gateway"],
      hypothesis: "Initial compromise via exposed RDP endpoint.",
    };
    expect(caseCreateSchema.safeParse(payload).success).toBe(true);
  });

  it("validates case update payload", () => {
    const payload = {
      status: "CLOSED",
    };
    expect(caseUpdateSchema.safeParse(payload).success).toBe(true);
  });

  it("exports case statuses", () => {
    expect(CASE_STATUSES.length).toBeGreaterThanOrEqual(4);
  });
});
