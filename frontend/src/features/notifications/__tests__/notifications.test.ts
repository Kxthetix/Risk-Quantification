import { describe, expect, it } from "vitest";
import { NotificationPreferencesSchema, NotificationRuleSchema } from "../schemas";

describe("Notifications schemas validation", () => {
  it("should validate a valid notification preferences payload", () => {
    const payload = {
      email_alerts_enabled: true,
      in_app_alerts_enabled: true,
      webhook_alerts_enabled: true,
      webhook_url: "https://hooks.slack.com/services/T00/B00/X00",
      critical_only: false,
    };
    const res = NotificationPreferencesSchema.safeParse(payload);
    expect(res.success).toBe(true);
  });

  it("should fail validation if webhook_url is invalid", () => {
    const payload = {
      email_alerts_enabled: true,
      in_app_alerts_enabled: true,
      webhook_alerts_enabled: true,
      webhook_url: "not-a-valid-url",
      critical_only: false,
    };
    const res = NotificationPreferencesSchema.safeParse(payload);
    expect(res.success).toBe(false);
  });

  it("should validate a valid notification rule payload", () => {
    const payload = {
      event_type: "Critical Incident",
      condition_operator: "EQ",
      condition_value: "Critical",
      recipients: ["SOC Team Lead", "CISO"],
      channel: "Email + In-App",
      frequency: "Immediate",
      is_active: true,
    };
    const res = NotificationRuleSchema.safeParse(payload);
    expect(res.success).toBe(true);
  });

  it("should fail validation if recipients list is empty", () => {
    const payload = {
      event_type: "Critical Incident",
      condition_operator: "EQ",
      condition_value: "Critical",
      recipients: [],
    };
    const res = NotificationRuleSchema.safeParse(payload);
    expect(res.success).toBe(false);
  });
});
