import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AssetRiskCard } from "../components/AssetRiskCard";
import { AssetRiskSummary } from "../types";

describe("AssetRiskCard", () => {
  const mockRisk: AssetRiskSummary = {
    asset_id: "asset-123",
    risk_score: 84.5,
    risk_level: "CRITICAL",
    vulnerability_count: 8,
    critical_vulnerabilities: 3,
    high_vulnerabilities: 4,
    expected_loss: 4200000,
    attack_path_count: 5,
    top_factors: [
      { factor: "Vulnerability Severity & KEV", percentage: 40 },
      { factor: "Internet Edge Exposure", percentage: 30 },
      { factor: "Criticality Tier", percentage: 20 },
      { factor: "Lateral Attack Paths", percentage: 10 },
    ],
  };

  it("renders risk score gauge and contributing factors", () => {
    render(<AssetRiskCard riskSummary={mockRisk} assetCriticality="CRITICAL" />);

    expect(screen.getByText("Asset Cyber Risk Score")).toBeInTheDocument();
    expect(screen.getByText("84.5")).toBeInTheDocument();
    expect(screen.getAllByText("CRITICAL").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Vulnerability Severity & KEV")).toBeInTheDocument();
    expect(screen.getByText("40%")).toBeInTheDocument();
  });
});
