import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MitigationRecommendationsPanel } from "../components/MitigationRecommendationsPanel";

describe("MitigationRecommendationsPanel", () => {
  it("renders mitigation options and calculates simulated risk reduction", () => {
    render(
      <MitigationRecommendationsPanel
        chokepoints={[
          {
            asset_id: "ast-1",
            node_id: "node-vpn",
            node_label: "VPN Gateway",
            node_type: "ENTRY_POINT",
            affected_paths: 8,
            critical_paths: 4,
            risk_reduction_potential: 45.0,
          },
        ]}
        baselineLoss={48000000}
      />
    );

    expect(
      screen.getByText(/High-Leverage Mitigation & Residual Risk Simulation/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Patch Perimeter VPN Vulnerability/i)).toBeInTheDocument();
  });
});
