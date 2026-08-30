import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { AttackPathTable } from "../components/AttackPathTable";

describe("AttackPathTable", () => {
  it("renders attack path table headers and path rows", () => {
    const mockPaths = [
      {
        id: "path-1",
        source_node: "Internet Gateway",
        target_node: "Primary Payment DB",
        target_asset_name: "Primary Payment DB",
        business_service_name: "Payment Processing",
        path_score: 94.2,
        likelihood: 0.88,
        impact: 0.95,
        confidence: 0.9,
        path_length: 4,
        status: "ACTIVE" as const,
        is_blocked: false,
        financial_exposure: 18400000,
        created_at: new Date().toISOString(),
        nodes: [],
        edges: [],
      },
    ];

    render(<AttackPathTable paths={mockPaths} />);

    expect(screen.getByText("Attack Path Traversal Chain")).toBeInTheDocument();
    expect(screen.getByText("Target Asset")).toBeInTheDocument();
    expect(screen.getByText("Internet Gateway")).toBeInTheDocument();
    expect(screen.getAllByText("Primary Payment DB").length).toBeGreaterThan(0);
  });
});
