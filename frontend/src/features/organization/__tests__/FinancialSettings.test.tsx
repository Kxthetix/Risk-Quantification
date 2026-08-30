import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { FinancialSettings } from "../components/FinancialSettings";

describe("FinancialSettings", () => {
  it("renders currency options and live preview for INR", () => {
    const onChange = vi.fn();
    render(<FinancialSettings selectedCurrency="INR" onChange={onChange} />);

    expect(screen.getByText("Base Financial Currency")).toBeInTheDocument();
    expect(screen.getByText("Live Formatting Preview")).toBeInTheDocument();
    expect(screen.getByText("₹82.4 L")).toBeInTheDocument();
    expect(screen.getByText("₹2.5 Cr")).toBeInTheDocument();
  });

  it("renders currency options and live preview for USD", () => {
    const onChange = vi.fn();
    render(<FinancialSettings selectedCurrency="USD" onChange={onChange} />);

    expect(screen.getByText("$8.2M")).toBeInTheDocument();
    expect(screen.getByText("$24.5M")).toBeInTheDocument();
  });
});
