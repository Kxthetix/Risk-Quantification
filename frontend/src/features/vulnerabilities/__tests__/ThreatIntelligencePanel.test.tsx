import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThreatIntelligencePanel } from "../components/ThreatIntelligencePanel";
import { ThreatIntelligenceSummary } from "../types";

describe("ThreatIntelligencePanel", () => {
  const mockIntel: ThreatIntelligenceSummary = {
    cve_id: "CVE-2024-3094",
    threat_activity_tier: "ACTIVE",
    exploit_maturity: "ACTIVE_EXPLOITATION",
    cisa_kev: true,
    cisa_due_date: "2024-04-22T00:00:00Z",
    epss_score: 0.95,
    epss_percentile: 0.99,
    threat_actors: [
      {
        name: "UNC3886 (Cozy Bear)",
        type: "Nation-State Advanced Persistent Threat",
        confidence: 0.95,
      },
    ],
    campaigns: [],
    malware: [
      { name: "BlackCat / ALPHV", category: "Ransomware" },
    ],
    mitre_attack_techniques: [
      { technique_id: "T1190", name: "Exploit Public-Facing Application", tactic: "Initial Access" },
    ],
  };

  it("renders CISA KEV status, EPSS score, and threat actor details", () => {
    render(<ThreatIntelligencePanel threatIntel={mockIntel} cveId="CVE-2024-3094" />);

    expect(screen.getByText("CISA Known Exploited (KEV)")).toBeInTheDocument();
    expect(screen.getByText("95.0%")).toBeInTheDocument();
    expect(screen.getByText("UNC3886 (Cozy Bear)")).toBeInTheDocument();
    expect(screen.getByText("BlackCat / ALPHV")).toBeInTheDocument();
    expect(screen.getByText("T1190")).toBeInTheDocument();
  });
});
