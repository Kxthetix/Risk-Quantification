import { describe, expect, it } from "vitest";
import { RISK_LEVEL_COLORS, RISK_LEVEL_BG } from "../constants";
import { RiskScoreCardSchema } from "../schemas";

describe("Executive constants and schemas", () => {
  it("should have correct colors mapped to risk levels", () => {
    expect(RISK_LEVEL_COLORS.Critical).toBe("#ef4444");
    expect(RISK_LEVEL_COLORS.High).toBe("#f97316");
    expect(RISK_LEVEL_COLORS.Medium).toBe("#eab308");
    expect(RISK_LEVEL_COLORS.Low).toBe("#22c55e");
    expect(RISK_LEVEL_COLORS.Minimal).toBe("#6b7280");
  });

  it("should have correct CSS classes mapped to risk levels", () => {
    expect(RISK_LEVEL_BG.Critical).toContain("bg-red-500/10");
    expect(RISK_LEVEL_BG.High).toContain("bg-orange-500/10");
  });

  it("should validate valid RiskScoreCard", () => {
    const payload = {
      current_score: 75.5,
      level: "High",
      last_updated: "2026-08-30T00:00:00Z",
    };
    const res = RiskScoreCardSchema.safeParse(payload);
    expect(res.success).toBe(true);
  });

  it("should fail validation on invalid RiskScoreCard", () => {
    const payload = {
      current_score: "not-a-number",
      level: "InvalidLevel",
    };
    const res = RiskScoreCardSchema.safeParse(payload);
    expect(res.success).toBe(false);
  });
});
