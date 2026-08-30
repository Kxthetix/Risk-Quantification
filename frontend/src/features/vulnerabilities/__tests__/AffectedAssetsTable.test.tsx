import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AffectedAssetsTable } from "../components/AffectedAssetsTable";
import { AssetVulnerability } from "@/types/vulnerability";

describe("AffectedAssetsTable", () => {
  const mockAssets: AssetVulnerability[] = [
    {
      id: "av-1",
      asset_id: "asset-1",
      asset_name: "Payment API Gateway",
      asset_type: "API",
      environment: "PRODUCTION",
      criticality: "CRITICAL",
      internet_exposed: true,
      business_service: "Payment Processing",
      vulnerability_id: "v-1",
      software_name: "liblzma",
      installed_version: "5.6.0",
      cve_id: "CVE-2024-3094",
      description: "XZ Utils backdoor",
      severity: "CRITICAL",
      cvss_score: 10.0,
      match_method: "VENDOR_PRODUCT_VERSION",
      match_confidence: 1.0,
      status: "OPEN",
      known_exploited: true,
      exploit_available: "YES",
      first_detected_at: new Date().toISOString(),
      last_detected_at: new Date().toISOString(),
      risk_score: 95.0,
    },
  ];

  it("renders affected asset row with classification and risk metrics", () => {
    render(<AffectedAssetsTable affectedAssets={mockAssets} cveId="CVE-2024-3094" />);

    expect(screen.getByText("Payment API Gateway")).toBeInTheDocument();
    expect(screen.getByText("Payment Processing")).toBeInTheDocument();
    expect(screen.getAllByText("CRITICAL").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("95")).toBeInTheDocument();
  });
});
