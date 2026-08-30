import { describe, it, expect } from "vitest";
import { eventFilterSchema } from "../schemas";
import { EVENT_SEVERITIES, EVENT_TYPES } from "../constants";

describe("Security Monitoring Schemas & Constants", () => {
  it("validates event filter inputs", () => {
    const filter = {
      severity: "CRITICAL",
      event_type: "RCE_ATTEMPT",
      search: "185.220.101.5",
      page: 1,
      page_size: 25,
    };
    const parsed = eventFilterSchema.safeParse(filter);
    expect(parsed.success).toBe(true);
  });

  it("handles default page values", () => {
    const parsed = eventFilterSchema.safeParse({});
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.page).toBe(1);
      expect(parsed.data.page_size).toBe(25);
    }
  });

  it("exports valid event severities and types", () => {
    expect(EVENT_SEVERITIES.length).toBeGreaterThanOrEqual(4);
    expect(EVENT_TYPES.length).toBeGreaterThanOrEqual(5);
  });
});
