import { describe, it, expect } from "vitest";
import { playbookCreateSchema, playbookExecutionSchema, playbookStepSchema } from "../schemas";
import { PLAYBOOK_CATEGORIES, SOAR_ACTION_TYPES } from "../constants";

describe("Playbooks Schemas & Constants", () => {
  it("validates playbook step schema", () => {
    const step = {
      step_id: "s-01",
      step_number: 1,
      name: "Isolate DMZ Host",
      action_type: "ISOLATE_ASSET",
      target_type: "ASSET",
      requires_approval: true,
      is_high_risk: true,
      timeout_seconds: 30,
    };
    expect(playbookStepSchema.safeParse(step).success).toBe(true);
  });

  it("validates playbook creation schema", () => {
    const pb = {
      name: "Ransomware Ingress Lockdown",
      description: "Automated isolation for ransomware beacons.",
      category: "Ransomware",
      trigger_type: "AUTOMATIC",
      status: "ENABLED",
      steps: [
        {
          step_id: "s1",
          step_number: 1,
          name: "Block IP",
          action_type: "BLOCK_IP",
          timeout_seconds: 15,
        },
      ],
      required_permissions: ["response:execute"],
    };
    expect(playbookCreateSchema.safeParse(pb).success).toBe(true);
  });

  it("validates playbook execution schema", () => {
    const exec = {
      incident_id: "INC-2026-089",
      target_parameters: { BLOCK_IP: "185.220.101.5" },
      dry_run: true,
    };
    expect(playbookExecutionSchema.safeParse(exec).success).toBe(true);
  });

  it("exports playbook categories and action types", () => {
    expect(PLAYBOOK_CATEGORIES.length).toBeGreaterThanOrEqual(8);
    expect(SOAR_ACTION_TYPES.length).toBeGreaterThanOrEqual(10);
  });
});
