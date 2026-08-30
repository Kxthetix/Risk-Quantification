import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { LossDistributionChart } from "../components/LossDistributionChart";

describe("LossDistributionChart", () => {
  it("renders chart and switches between PDF and LEC modes", () => {
    render(
      <LossDistributionChart
        percentiles={{
          expected_loss: 7450000,
          p10: 1200000,
          p50: 6200000,
          p90: 14800000,
          p95: 18300000,
        }}
      />
    );

    expect(screen.getByText(/Monte Carlo Simulated Loss Distribution/i)).toBeInTheDocument();
    expect(screen.getByText(/Density \(PDF\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Exceedance \(LEC\)/i)).toBeInTheDocument();

    const lecBtn = screen.getByRole("button", { name: /Exceedance \(LEC\)/i });
    fireEvent.click(lecBtn);
    expect(screen.getByText(/Probability of Exceedance/i)).toBeInTheDocument();
  });
});
