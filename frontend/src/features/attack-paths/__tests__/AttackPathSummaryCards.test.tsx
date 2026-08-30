import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { AttackPathSummaryCards } from "../components/AttackPathSummaryCards";

describe("AttackPathSummaryCards", () => {
  it("renders summary metric titles and values accurately", () => {
    render(
      <AttackPathSummaryCards
        summary={{
          total_paths: 24,
          critical_paths_count: 8,
          high_risk_paths_count: 14,
          exposed_entry_points_count: 6,
          critical_assets_exposed_count: 12,
          mitre_techniques_count: 9,
          business_services_exposed_count: 4,
          total_financial_exposure: 48000000,
          highest_risk_score: 96.0,
          average_risk_score: 72.4,
        }}
      />
    );

    expect(screen.getByText("Critical Attack Paths")).toBeInTheDocument();
    expect(screen.getByText("High Risk Paths")).toBeInTheDocument();
    expect(screen.getByText("Exposed Entry Points")).toBeInTheDocument();
    expect(screen.getByText("Critical Assets Exposed")).toBeInTheDocument();
    expect(screen.getByText("MITRE Techniques")).toBeInTheDocument();
  });
});
