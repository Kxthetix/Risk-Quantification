import { describe, it, expect } from "vitest";
import { approvalActionSchema } from "../schemas";
import { APPROVAL_STATUSES } from "../constants";

describe("Approvals Schemas & Constants", () => {
  it("validates approval decision payload", () => {
    const payload = {
      decision: "APPROVE",
      justification: "Authorized emergency isolation of gateway.",
      approver_name: "SOC Incident Commander",
      confirmed_destructive_risk: true,
    };
    expect(approvalActionSchema.safeParse(payload).success).toBe(true);
  });

  it("validates rejection payload", () => {
    const payload = {
      decision: "REJECT",
      justification: "Server is critical; alternate path requested.",
      confirmed_destructive_risk: false,
    };
    expect(approvalActionSchema.safeParse(payload).success).toBe(true);
  });

  it("exports approval statuses", () => {
    expect(APPROVAL_STATUSES.length).toBeGreaterThanOrEqual(4);
  });
});
