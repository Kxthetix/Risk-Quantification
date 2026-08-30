import { describe, expect, it } from "vitest";
import { IntegrationCreateSchema, WebhookCreateSchema } from "../schemas";

describe("Integrations schemas validation", () => {
  it("should validate a valid integration creation payload", () => {
    const payload = {
      name: "Splunk Heavy Forwarder",
      category: "SIEM",
      connector_type: "splunk",
      auth_method: "API_KEY" as const,
      endpoint_url: "https://splunk.corp.internal:8089",
      sync_frequency: "HOURLY" as const,
      sync_mode: "INCREMENTAL" as const,
      is_enabled: true,
    };
    const res = IntegrationCreateSchema.safeParse(payload);
    expect(res.success).toBe(true);
  });

  it("should fail validation if endpoint URL is malformed", () => {
    const payload = {
      name: "Invalid Connector",
      category: "SIEM",
      connector_type: "splunk",
      auth_method: "API_KEY" as const,
      endpoint_url: "not-a-valid-url",
      sync_frequency: "HOURLY" as const,
      sync_mode: "INCREMENTAL" as const,
      is_enabled: true,
    };
    const res = IntegrationCreateSchema.safeParse(payload);
    expect(res.success).toBe(false);
  });

  it("should validate a valid webhook creation payload", () => {
    const payload = {
      name: "CrowdStrike Incident Hook",
      event_types: ["INCIDENT", "DETECTION"],
    };
    const res = WebhookCreateSchema.safeParse(payload);
    expect(res.success).toBe(true);
  });

  it("should fail webhook validation if event types array is empty", () => {
    const payload = {
      name: "Empty Webhook",
      event_types: [],
    };
    const res = WebhookCreateSchema.safeParse(payload);
    expect(res.success).toBe(false);
  });
});
