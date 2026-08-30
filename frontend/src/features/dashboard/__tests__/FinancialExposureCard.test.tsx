import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FinancialExposureCard } from "../components/FinancialExposureCard";

describe("FinancialExposureCard", () => {
  it("renders expected annual loss and P10-P95 percentiles", () => {
    render(
      <FinancialExposureCard
        expectedAnnualLoss={8240000}
        p10={2100000}
        p50={6800000}
        p90={15400000}
        p95={21200000}
      />
    );

    expect(screen.getByText("Expected Annual Loss (ALE)")).toBeDefined();
    expect(screen.getByText("P10")).toBeDefined();
    expect(screen.getByText("P50")).toBeDefined();
    expect(screen.getByText("P90")).toBeDefined();
    expect(screen.getByText("P95")).toBeDefined();
  });
});
