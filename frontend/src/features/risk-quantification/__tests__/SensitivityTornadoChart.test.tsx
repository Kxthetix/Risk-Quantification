import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { SensitivityTornadoChart } from "../components/SensitivityTornadoChart";

describe("SensitivityTornadoChart", () => {
  it("renders tornado variables and impact bounds", () => {
    render(<SensitivityTornadoChart />);

    expect(screen.getByText(/Sensitivity Analysis & Tornado Impact Chart/i)).toBeInTheDocument();
    expect(screen.getByText(/Outage Downtime Duration/i)).toBeInTheDocument();
    expect(screen.getByText(/Annual Occurrence Frequency \(ARO\)/i)).toBeInTheDocument();
  });
});
