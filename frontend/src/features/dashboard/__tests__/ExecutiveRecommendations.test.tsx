import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ExecutiveRecommendations } from "../components/ExecutiveRecommendations";

describe("ExecutiveRecommendations", () => {
  it("renders prioritized recommendations and impact chips", () => {
    render(
      <ExecutiveRecommendations
        overdueCount={37}
        criticalPathsCount={12}
      />
    );

    expect(screen.getByText("Mitigate 12 Internet-Facing Critical RCE Vulnerabilities")).toBeDefined();
    expect(screen.getByText("Resolve 37 Overdue Remediation Work Items")).toBeDefined();
    expect(screen.getByText("Sever 12 Choke Points on Lateral Attack Graph")).toBeDefined();
  });
});
