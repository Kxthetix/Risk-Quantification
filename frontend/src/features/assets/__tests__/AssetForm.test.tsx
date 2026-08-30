import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AssetForm } from "../components/AssetForm";

describe("AssetForm", () => {
  it("renders all form sections correctly", () => {
    const handleSubmit = vi.fn();
    render(<AssetForm onSubmit={handleSubmit} />);

    expect(screen.getByText("1. Basic Identification")).toBeInTheDocument();
    expect(screen.getByText("2. Technical & Network Attributes")).toBeInTheDocument();
    expect(screen.getByText("3. Ownership & Criticality")).toBeInTheDocument();
    expect(screen.getByText("4. Financial Asset Valuation")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Register Asset/i })).toBeInTheDocument();
  });
});
