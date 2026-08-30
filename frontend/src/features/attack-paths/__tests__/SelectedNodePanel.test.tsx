import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { SelectedNodePanel } from "../components/SelectedNodePanel";

describe("SelectedNodePanel", () => {
  it("renders node attributes, risk score, and action links", () => {
    render(
      <SelectedNodePanel
        node={{
          id: "node-1",
          label: "Production Payment DB",
          type: "DATABASE",
          risk_score: 95.0,
          criticality: "CRITICAL",
          is_entry_point: false,
          asset_id: "ast-123",
        }}
      />
    );

    expect(screen.getByText("Production Payment DB")).toBeInTheDocument();
    expect(screen.getByText("Crown Jewel Database")).toBeInTheDocument();
    expect(screen.getByText(/Open Asset Details/i)).toBeInTheDocument();
    expect(screen.getByText(/View Financial Loss Model/i)).toBeInTheDocument();
  });
});
