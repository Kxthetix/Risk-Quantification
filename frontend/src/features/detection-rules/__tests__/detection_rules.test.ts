import { describe, it, expect } from "vitest";
import { detectionRuleCreateSchema, detectionRuleTestSchema } from "../schemas";
import { DETECTION_RULE_SOURCES, MITRE_TACTICS } from "../constants";

describe("Detection Rules Schemas & Constants", () => {
  it("validates rule creation payload", () => {
    const payload = {
      name: "RCE Injection Rule",
      description: "Detects unauthenticated command injection",
      severity: "CRITICAL",
      source: "WAF",
      mitre_technique: "T1190",
      mitre_tactic: "Initial Access",
      detection_logic: "http_method == 'POST' and payload contains 'cmd.exe'",
      data_sources: ["WAF Logs"],
      enabled: true,
    };
    const parsed = detectionRuleCreateSchema.safeParse(payload);
    expect(parsed.success).toBe(true);
  });

  it("validates rule test simulation payload", () => {
    const testPayload = {
      sample_event_payload: {
        process_name: "powershell.exe",
        source_ip: "185.220.101.5",
      },
    };
    const parsed = detectionRuleTestSchema.safeParse(testPayload);
    expect(parsed.success).toBe(true);
  });

  it("exports valid detection sources and MITRE tactics", () => {
    expect(DETECTION_RULE_SOURCES.length).toBeGreaterThanOrEqual(4);
    expect(MITRE_TACTICS.length).toBeGreaterThanOrEqual(10);
  });
});
