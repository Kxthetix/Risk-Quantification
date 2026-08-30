import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { KpiGrid } from "../components/KpiGrid";

describe("KpiGrid", () => {
  it("renders all 6 primary executive KPI cards with formatted values", () => {
    render(
      <KpiGrid
        riskScore={78.4}
        riskLevel="HIGH"
        expectedAnnualLoss={8240000}
        criticalAssets={84}
        criticalVulns={14}
        criticalAttackPaths={12}
        overdueRemediations={37}
        scoreChange={3.8}
      />
    );

    expect(screen.getByText("Cyber Risk")).toBeDefined();
    expect(screen.getByText("78.4")).toBeDefined();
    expect(screen.getByText("HIGH")).toBeDefined();

    expect(screen.getByText("Expected Loss")).toBeDefined();
    expect(screen.getByText("Critical Assets")).toBeDefined();
    expect(screen.getByText("84")).toBeDefined();

    expect(screen.getByText("Critical Vulns")).toBeDefined();
    expect(screen.getByText("14")).toBeDefined();

    expect(screen.getByText("Attack Paths")).toBeDefined();
    expect(screen.getByText("12")).toBeDefined();

    expect(screen.getByText("Overdue SLA")).toBeDefined();
    expect(screen.getByText("37")).toBeDefined();
  });
});
