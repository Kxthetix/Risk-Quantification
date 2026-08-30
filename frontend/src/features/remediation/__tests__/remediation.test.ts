import { describe, it, expect } from "vitest";
import {
  remediationCreateSchema,
  remediationVerifySchema,
  riskAcceptanceSchema,
} from "../schemas";
import { REMEDIATION_TYPES, PRIORITY_BADGE_COLORS, STATUS_BADGE_COLORS } from "../constants";

describe("Phase 8 Contextual Remediation Schemas & Constants", () => {
  it("should define standard remediation types and workflows", () => {
    expect(REMEDIATION_TYPES.length).toBeGreaterThanOrEqual(10);
    const types = REMEDIATION_TYPES.map((t) => t.value);
    expect(types).toContain("PATCH");
    expect(types).toContain("UPGRADE");
    expect(types).toContain("CONFIGURATION_CHANGE");
    expect(types).toContain("NETWORK_SEGMENTATION");
    expect(types).toContain("VIRTUAL_PATCH");
    expect(types).toContain("ASSET_RETIREMENT");
  });

  it("should have color mappings for all priority levels and statuses", () => {
    expect(PRIORITY_BADGE_COLORS.CRITICAL).toBeDefined();
    expect(PRIORITY_BADGE_COLORS.HIGH).toBeDefined();
    expect(PRIORITY_BADGE_COLORS.MEDIUM).toBeDefined();
    expect(PRIORITY_BADGE_COLORS.LOW).toBeDefined();

    expect(STATUS_BADGE_COLORS.OPEN).toBeDefined();
    expect(STATUS_BADGE_COLORS.IN_PROGRESS).toBeDefined();
    expect(STATUS_BADGE_COLORS.COMPLETED).toBeDefined();
    expect(STATUS_BADGE_COLORS.VERIFIED).toBeDefined();
    expect(STATUS_BADGE_COLORS.ACCEPTED_RISK).toBeDefined();
  });

  it("should validate a valid remediation creation payload", () => {
    const valid = {
      title: "Apply Security Patch for Spring RCE",
      description: "Upgrades package to 3.2.4",
      remediation_type: "PATCH",
      estimated_cost: 150000,
      estimated_duration_hours: 6,
    };
    const parsed = remediationCreateSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
  });

  it("should validate empirical verification evidence payload", () => {
    const validVerify = {
      evidence: {
        scan_id: "QUALYS-20260830-01",
        result: "PATCH_CONFIRMED",
      },
      verification_notes: "Automated scan confirmed clean",
    };
    const parsed = remediationVerifySchema.safeParse(validVerify);
    expect(parsed.success).toBe(true);
  });

  it("should validate formal risk acceptance payload", () => {
    const validAccept = {
      business_justification: "Legacy system migration planned for Q4, cannot take downtime now",
      accepted_by: "Chief Information Security Officer",
      expiration_date: "2026-12-31",
      compensating_controls: "WAF rate limit rule active",
    };
    const parsed = riskAcceptanceSchema.safeParse(validAccept);
    expect(parsed.success).toBe(true);
  });
});
