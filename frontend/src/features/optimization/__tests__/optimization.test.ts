import { describe, it, expect } from "vitest";
import { optimizationRunSchema, whatIfOptimizationSchema } from "../schemas";
import { OPTIMIZATION_ALGORITHMS, STRATEGIC_PORTFOLIO_DESCRIPTIONS } from "../constants";

describe("Phase 8 Investment Optimization Schemas & Constants", () => {
  it("should define optimization algorithms", () => {
    expect(OPTIMIZATION_ALGORITHMS.length).toBe(2);
    const algos = OPTIMIZATION_ALGORITHMS.map((a) => a.value);
    expect(algos).toContain("KNAPSACK");
    expect(algos).toContain("GREEDY");
  });

  it("should have metadata for all 4 strategic alternatives", () => {
    expect(STRATEGIC_PORTFOLIO_DESCRIPTIONS.MAX_RISK_REDUCTION).toBeDefined();
    expect(STRATEGIC_PORTFOLIO_DESCRIPTIONS.HIGHEST_ROSI).toBeDefined();
    expect(STRATEGIC_PORTFOLIO_DESCRIPTIONS.BALANCED).toBeDefined();
    expect(STRATEGIC_PORTFOLIO_DESCRIPTIONS.FAST_WINS).toBeDefined();
  });

  it("should validate a valid optimization run payload", () => {
    const valid = {
      budget: 1000000,
      algorithm: "KNAPSACK",
      horizon_years: 3,
      synchronous: true,
    };
    const parsed = optimizationRunSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
  });

  it("should reject optimization run payload with budget below minimum", () => {
    const invalid = {
      budget: 500,
      algorithm: "KNAPSACK",
    };
    const parsed = optimizationRunSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it("should validate what-if simulation request payload", () => {
    const validWhatIf = {
      remediation_ids: ["rem-01", "rem-02"],
      control_ids: ["ctrl-01"],
      horizon_years: 1,
    };
    const parsed = whatIfOptimizationSchema.safeParse(validWhatIf);
    expect(parsed.success).toBe(true);
  });
});
