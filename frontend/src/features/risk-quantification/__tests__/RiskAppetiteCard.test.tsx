import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { RiskAppetiteCard } from "../components/RiskAppetiteCard";

describe("RiskAppetiteCard", () => {
  it("renders risk appetite status and breach alert when exceeded", () => {
    render(
      <RiskAppetiteCard
        settings={{
          max_expected_annual_loss: 40000000,
          max_single_loss: 50000000,
          max_p95_loss: 60000000,
          max_service_exposure: 20000000,
          current_eal: 48200000,
          is_breached: true,
          breach_excess: 8200000,
          currency: "INR",
        }}
      />
    );

    expect(screen.getByText(/Board Risk Appetite & Tolerance Thresholds/i)).toBeInTheDocument();
    expect(screen.getByText(/Risk Appetite Exceeded/i)).toBeInTheDocument();
    expect(screen.getByText(/Tolerance Cap:/i)).toBeInTheDocument();
  });
});
