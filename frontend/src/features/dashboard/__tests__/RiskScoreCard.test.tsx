import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RiskScoreCard } from "../components/RiskScoreCard";

describe("RiskScoreCard", () => {
  it("renders score, qualitative risk level, and classification bounds", () => {
    render(
      <RiskScoreCard
        score={78.4}
        level="CRITICAL"
        previousScore={74.6}
        change={3.8}
        trend="WORSENING"
      />
    );

    expect(screen.getByText("78.4")).toBeDefined();
    expect(screen.getByText("CRITICAL")).toBeDefined();
    expect(screen.getByText("+3.8% vs prior")).toBeDefined();
    expect(screen.getByText("0-25")).toBeDefined();
    expect(screen.getByText("76-100")).toBeDefined();
  });
});
