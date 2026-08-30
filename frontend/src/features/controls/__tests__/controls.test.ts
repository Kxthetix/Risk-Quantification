import { describe, it, expect } from "vitest";
import { controlCreateSchema, controlEffectivenessCreateSchema } from "../schemas";
import { CONTROL_TYPES, CONTROL_TYPE_BADGE_COLORS } from "../constants";

describe("Phase 8 Security Controls Schemas & Constants", () => {
  it("should define standard enterprise control types", () => {
    expect(CONTROL_TYPES.length).toBeGreaterThanOrEqual(9);
    const types = CONTROL_TYPES.map((t) => t.value);
    expect(types).toContain("WAF");
    expect(types).toContain("EDR");
    expect(types).toContain("MFA");
    expect(types).toContain("NETWORK_SEGMENTATION");
    expect(types).toContain("PAM");
    expect(types).toContain("BACKUP");
  });

  it("should have color mappings for all control types", () => {
    CONTROL_TYPES.forEach((type) => {
      expect(CONTROL_TYPE_BADGE_COLORS[type.value]).toBeDefined();
    });
  });

  it("should validate a valid control payload", () => {
    const valid = {
      code: "WAF-01",
      name: "Cloudflare WAF",
      description: "Layer 7 inspection",
      control_type: "WAF",
      effectiveness_score: 92,
      coverage_percentage: 95,
      annual_cost: 600000,
      implementation_cost: 150000,
      is_active: true,
    };
    const parsed = controlCreateSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
  });

  it("should reject control with out-of-range effectiveness score", () => {
    const invalid = {
      code: "WAF-01",
      name: "Cloudflare WAF",
      control_type: "WAF",
      effectiveness_score: 150,
      coverage_percentage: 95,
    };
    const parsed = controlCreateSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it("should validate targeted control effectiveness mapping", () => {
    const validEff = {
      threat_scenario_type: "RANSOMWARE",
      risk_factor_type: "LATERAL_MOVEMENT",
      attenuation_factor: 0.85,
      confidence: 0.9,
    };
    const parsed = controlEffectivenessCreateSchema.safeParse(validEff);
    expect(parsed.success).toBe(true);
  });
});
