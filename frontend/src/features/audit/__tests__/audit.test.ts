import { describe, expect, it } from "vitest";
import { AuditFilterSchema } from "../schemas";

describe("Audit filter schema validation", () => {
  it("should validate a valid audit filter payload", () => {
    const payload = {
      action: "ASSET_CREATED",
      resource_type: "Asset",
      skip: 0,
      limit: 25,
    };
    const res = AuditFilterSchema.safeParse(payload);
    expect(res.success).toBe(true);
  });

  it("should fail validation if skip is negative", () => {
    const payload = {
      skip: -5,
      limit: 25,
    };
    const res = AuditFilterSchema.safeParse(payload);
    expect(res.success).toBe(false);
  });

  it("should fail validation if limit exceeds 100", () => {
    const payload = {
      limit: 500,
    };
    const res = AuditFilterSchema.safeParse(payload);
    expect(res.success).toBe(false);
  });
});
