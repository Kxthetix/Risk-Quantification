import { describe, expect, it } from "vitest";
import { UserInvitationSchema, ApiKeyCreateSchema, AnnouncementCreateSchema } from "../schemas";

describe("Admin schemas validation", () => {
  it("should validate a valid user invitation payload", () => {
    const payload = {
      email: "ciso@enterprise.com",
      role: "MANAGER" as const,
      expiration_hours: 48,
      message: "Join the executive risk review workspace",
    };
    const res = UserInvitationSchema.safeParse(payload);
    expect(res.success).toBe(true);
  });

  it("should fail validation on invalid email for invitation", () => {
    const payload = {
      email: "invalid-email-string",
      role: "VIEWER" as const,
      expiration_hours: 24,
    };
    const res = UserInvitationSchema.safeParse(payload);
    expect(res.success).toBe(false);
  });

  it("should validate an API key creation payload", () => {
    const payload = {
      name: "Splunk Heavy Forwarder Ingestion Key",
      expiration_days: 90,
    };
    const res = ApiKeyCreateSchema.safeParse(payload);
    expect(res.success).toBe(true);
  });

  it("should fail API key creation if name is too short", () => {
    const payload = {
      name: "A",
      expiration_days: 30,
    };
    const res = ApiKeyCreateSchema.safeParse(payload);
    expect(res.success).toBe(false);
  });

  it("should validate announcement create schema", () => {
    const payload = {
      title: "Scheduled Maintenance Tonight",
      message: "Database cluster failover testing from 23:00 to 01:00 UTC",
      is_active: true,
    };
    const res = AnnouncementCreateSchema.safeParse(payload);
    expect(res.success).toBe(true);
  });
});
