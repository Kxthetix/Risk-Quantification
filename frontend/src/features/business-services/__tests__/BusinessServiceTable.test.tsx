import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BusinessServiceTable } from "../components/BusinessServiceTable";
import { BusinessService } from "../types";

describe("BusinessServiceTable", () => {
  const mockServices: BusinessService[] = [
    {
      id: "srv-1",
      organization_id: "org-1",
      name: "Core Payment Gateway",
      description: "Processes all customer checkout credit card payments",
      revenue_dependency: 0.95,
      criticality: "CRITICAL",
      daily_transaction_count: 50000,
      average_transaction_value: 1200,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  it("renders business service rows with revenue dependency and transaction velocity", () => {
    render(<BusinessServiceTable services={mockServices} />);

    expect(screen.getByText("Core Payment Gateway")).toBeInTheDocument();
    expect(screen.getByText("CRITICAL")).toBeInTheDocument();
    expect(screen.getByText("95%")).toBeInTheDocument();
    expect(screen.getByText("50,000")).toBeInTheDocument();
  });
});
