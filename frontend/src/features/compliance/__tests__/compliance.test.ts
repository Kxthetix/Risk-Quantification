import { describe, it, expect } from "vitest";
import { ISO_27001_CATEGORIES, FRAMEWORK_CODES } from "../constants";
import { AssessmentFormSchema, EvidenceUploadSchema } from "../schemas";

describe("Phase 8 Compliance & Security Controls Constants & Schemas", () => {
  it("should have all 4 ISO/IEC 27001:2022 Annex A categories", () => {
    expect(ISO_27001_CATEGORIES.length).toBe(4);
    const codes = ISO_27001_CATEGORIES.map((c) => c.id);
    expect(codes).toContain("A.5");
    expect(codes).toContain("A.6");
    expect(codes).toContain("A.7");
    expect(codes).toContain("A.8");
  });

  it("should define standard enterprise framework codes", () => {
    expect(FRAMEWORK_CODES.ISO_27001).toBe("ISO-27001");
    expect(FRAMEWORK_CODES.NIST_CSF).toBe("NIST-CSF");
    expect(FRAMEWORK_CODES.SOC_2).toBe("SOC-2");
    expect(FRAMEWORK_CODES.PCI_DSS).toBe("PCI-DSS");
  });

  it("should validate valid AssessmentForm data", () => {
    const validData = {
      framework_id: "iso-27001-2022",
      control_id: "ctrl-a8-20",
      effectiveness_score: 85,
      finding: "Segmentation rules in place",
      recommendation: "Review quarterly",
      status: "Approved",
    };
    const result = AssessmentFormSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("should reject invalid effectiveness score out of bounds", () => {
    const invalidData = {
      framework_id: "iso-27001-2022",
      control_id: "ctrl-a8-20",
      effectiveness_score: 150,
    };
    const result = AssessmentFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("should validate EvidenceUpload schema", () => {
    const validEvidence = {
      title: "AWS VPC Security Group Export",
      control_id: "ctrl-a8-20",
      evidence_type: "Configuration",
    };
    const result = EvidenceUploadSchema.safeParse(validEvidence);
    expect(result.success).toBe(true);
  });
});
