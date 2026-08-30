import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AssetSummaryCards } from "../components/AssetSummaryCards";
import { AssetStatistics } from "@/types/asset";

describe("AssetSummaryCards", () => {
  const mockStats: AssetStatistics = {
    total_assets: 142,
    active_assets: 130,
    critical_assets: 24,
    internet_exposed_assets: 18,
    production_assets: 98,
    servers: 65,
    databases: 22,
    network_devices: 15,
    by_type: { SERVER: 65, DATABASE: 22 },
    by_criticality: { CRITICAL: 24, HIGH: 36, MEDIUM: 50, LOW: 32 },
    by_environment: { PRODUCTION: 98 },
    by_status: { ACTIVE: 130 },
  };

  it("renders all summary metric cards accurately", () => {
    render(<AssetSummaryCards statistics={mockStats} />);

    expect(screen.getByText("Total Assets")).toBeInTheDocument();
    expect(screen.getByText("142")).toBeInTheDocument();
    expect(screen.getByText("Critical Assets")).toBeInTheDocument();
    expect(screen.getByText("24")).toBeInTheDocument();
    expect(screen.getByText("Internet Exposed")).toBeInTheDocument();
    expect(screen.getByText("18")).toBeInTheDocument();
  });
});
