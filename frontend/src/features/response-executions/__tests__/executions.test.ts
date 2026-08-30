import { describe, it, expect } from "vitest";
import { retryStepSchema, rollbackExecutionSchema } from "../schemas";
import { EXECUTION_STATUSES } from "../constants";

describe("Response Executions Schemas & Constants", () => {
  it("validates step retry payload", () => {
    const payload = {
      step_id: "s-step-02",
      force_override: true,
    };
    expect(retryStepSchema.safeParse(payload).success).toBe(true);
  });

  it("validates execution rollback payload", () => {
    const payload = {
      reason: "False positive beacon verified after triage",
      authorized_by: "SOC Lead Analyst",
    };
    expect(rollbackExecutionSchema.safeParse(payload).success).toBe(true);
  });

  it("exports execution statuses", () => {
    expect(EXECUTION_STATUSES.length).toBeGreaterThanOrEqual(5);
  });
});
