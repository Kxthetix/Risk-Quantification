import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AttackPathSummary } from "../components/AttackPathSummary";

describe("AttackPathSummary", () => {
  it("renders critical attack paths and choke point previews", () => {
    render(
      <AttackPathSummary
        totalPaths={28}
        criticalPaths={12}
        topPaths={[
          {
            path_id: "path-1",
            entry_point: "Internet Edge WAF",
            target: "Payment DB Cluster",
            target_asset_name: "Customer Cardholder Data Store",
            path_length: 4,
            likelihood: 0.88,
            impact: 0.95,
            path_score: 94.2,
            financial_exposure: 2400000,
          },
        ]}
      />
    );

    expect(screen.getByText("12 Critical Attack Paths")).toBeDefined();
    expect(screen.getByText("Customer Cardholder Data Store")).toBeDefined();
    expect(screen.getByText("Internet Edge WAF")).toBeDefined();
    expect(screen.getByText("Payment DB Cluster")).toBeDefined();
  });
});
