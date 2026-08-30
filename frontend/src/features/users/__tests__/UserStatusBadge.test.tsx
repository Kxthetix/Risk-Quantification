import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { UserStatusBadge } from "../components/UserStatusBadge";

describe("UserStatusBadge", () => {
  it("renders Active status badge", () => {
    render(<UserStatusBadge status="ACTIVE" />);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("renders Invited status badge", () => {
    render(<UserStatusBadge status="INVITED" />);
    expect(screen.getByText("Invited")).toBeInTheDocument();
  });

  it("renders Suspended status badge", () => {
    render(<UserStatusBadge status="SUSPENDED" />);
    expect(screen.getByText("Suspended")).toBeInTheDocument();
  });

  it("renders Deactivated status badge", () => {
    render(<UserStatusBadge status="DEACTIVATED" />);
    expect(screen.getByText("Deactivated")).toBeInTheDocument();
  });
});
