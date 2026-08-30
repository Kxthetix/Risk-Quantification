import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ExecutiveFinancialSummary } from "../components/ExecutiveFinancialSummary";

describe("ExecutiveFinancialSummary", () => {
  it("renders key financial quantification metrics correctly", () => {
    render(
      <ExecutiveFinancialSummary
        summary={{
          currency: "INR",
          total_expected_annual_loss: 48200000,
          total_potential_loss: 183000000,
          expected_downtime_cost: 18400000,
          expected_recovery_cost: 14200000,
          expected_data_impact: 8600000,
          expected_regulatory_cost: 7000000,
          assessed_vulnerabilities_count: 84,
          top_losses: [],
        }}
        scenarioCount={14}
      />
    );

    expect(screen.getByText(/Expected Annual Loss/i)).toBeInTheDocument();
    expect(screen.getByText(/95th Percentile Loss/i)).toBeInTheDocument();
    expect(screen.getByText(/Worst-Case/i)).toBeInTheDocument();
    expect(screen.getByText(/Downtime Loss/i)).toBeInTheDocument();
    expect(screen.getByText(/Modeled Scenarios/i)).toBeInTheDocument();
    expect(screen.getByText("14")).toBeInTheDocument();
  });
});
