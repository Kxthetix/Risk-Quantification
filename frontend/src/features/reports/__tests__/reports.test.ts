import { describe, expect, it } from "vitest";
import { ReportScheduleCreateSchema } from "../index";

describe("Report schedules schemas", () => {
  it("should validate a valid report schedule creation payload", () => {
    const payload = {
      report_name: "Weekly CISO Report",
      report_type: "EXECUTIVE_RISK",
      frequency: "weekly",
      recipients: ["ciso@enterprise.com", "ceo@enterprise.com"],
    };
    const res = ReportScheduleCreateSchema.safeParse(payload);
    expect(res.success).toBe(true);
  });

  it("should fail validation if recipients contains invalid emails", () => {
    const payload = {
      report_name: "Weekly CISO Report",
      report_type: "EXECUTIVE_RISK",
      frequency: "weekly",
      recipients: ["not-an-email", "ceo@enterprise.com"],
    };
    const res = ReportScheduleCreateSchema.safeParse(payload);
    expect(res.success).toBe(false);
  });

  it("should fail validation if name is empty", () => {
    const payload = {
      report_name: "",
      report_type: "EXECUTIVE_RISK",
      frequency: "weekly",
      recipients: ["ceo@enterprise.com"],
    };
    const res = ReportScheduleCreateSchema.safeParse(payload);
    expect(res.success).toBe(false);
  });
});
