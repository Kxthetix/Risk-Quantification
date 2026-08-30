import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { RiskBadge, SeverityBadge, StatusBadge } from "../badge";

describe("Domain Badges", () => {
  it("renders RiskBadge with correct text", () => {
    render(<RiskBadge level="CRITICAL" />);
    expect(screen.getByText("CRITICAL")).toBeInTheDocument();
  });

  it("renders SeverityBadge with correct text", () => {
    render(<SeverityBadge severity="HIGH" />);
    expect(screen.getByText("HIGH")).toBeInTheDocument();
  });

  it("renders StatusBadge with formatted text", () => {
    render(<StatusBadge status="IN_PROGRESS" />);
    expect(screen.getByText("IN PROGRESS")).toBeInTheDocument();
  });
});
