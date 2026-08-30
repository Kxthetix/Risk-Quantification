import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { PermissionMatrix } from "../components/PermissionMatrix";

describe("PermissionMatrix", () => {
  it("renders matrix table headers and capabilities", () => {
    render(<PermissionMatrix />);
    expect(screen.getByText("Matrix Grid")).toBeInTheDocument();
    expect(screen.getByText("Role Explorer")).toBeInTheDocument();
    expect(screen.getByText("View Executive Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Manage Organization Users")).toBeInTheDocument();
  });
});
