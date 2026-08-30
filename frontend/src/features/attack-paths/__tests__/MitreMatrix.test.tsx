import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MitreMatrix } from "../components/MitreMatrix";

describe("MitreMatrix", () => {
  it("renders MITRE tactics columns and technique items", () => {
    const techniques = [
      {
        technique_id: "T1190",
        name: "Exploit Public-Facing Application",
        tactic: "Initial Access",
        attack_paths_count: 8,
        affected_assets_count: 4,
        risk_level: "CRITICAL" as const,
        financial_exposure: 24000000,
      },
    ];

    render(<MitreMatrix techniques={techniques} />);

    expect(screen.getByText(/MITRE ATT&CK Matrix Traversal/i)).toBeInTheDocument();
    expect(screen.getByText("Initial Access")).toBeInTheDocument();
    expect(screen.getByText("T1190")).toBeInTheDocument();
    expect(screen.getByText("Exploit Public-Facing Application")).toBeInTheDocument();
  });
});
