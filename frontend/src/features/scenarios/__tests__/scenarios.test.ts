import { describe, expect, it } from "vitest";
import { ScenarioCreateSchema } from "../index";

describe("What-if scenarios schemas", () => {
  it("should validate a valid scenario creation payload", () => {
    const payload = {
      name: "Patch Critical Vulnerabilities",
      description: "Upgrade database servers and perimeter gateway",
      scenario_type: "remediation",
      parameters: {
        reduction_factor: 0.25,
        cost: 45000,
      },
    };
    const res = ScenarioCreateSchema.safeParse(payload);
    expect(res.success).toBe(true);
  });

  it("should fail validation on invalid scenario types", () => {
    const payload = {
      name: "Patch Critical Vulnerabilities",
      scenario_type: "invalid_type",
      parameters: {},
    };
    const res = ScenarioCreateSchema.safeParse(payload);
    expect(res.success).toBe(false);
  });

  it("should fail validation on empty name", () => {
    const payload = {
      name: "",
      scenario_type: "remediation",
      parameters: {},
    };
    const res = ScenarioCreateSchema.safeParse(payload);
    expect(res.success).toBe(false);
  });
});
