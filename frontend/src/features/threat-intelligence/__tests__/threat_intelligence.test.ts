import { describe, it, expect } from "vitest";
import { threatFeedCreateSchema, threatWatchlistCreateSchema } from "../schemas";
import { THREAT_FEED_TYPES, IOC_TYPES } from "../constants";

describe("Threat Intelligence Schemas & Constants", () => {
  it("validates a valid threat feed creation payload", () => {
    const validData = {
      name: "CISA Known Exploited Vulns",
      provider: "CISA",
      feed_type: "VULNERABILITY",
      endpoint_url: "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json",
      polling_interval_minutes: 30,
      enabled: true,
    };
    const parsed = threatFeedCreateSchema.safeParse(validData);
    expect(parsed.success).toBe(true);
  });

  it("fails validation for an invalid threat feed", () => {
    const invalidData = {
      name: "C",
      provider: "",
      feed_type: "",
    };
    const parsed = threatFeedCreateSchema.safeParse(invalidData);
    expect(parsed.success).toBe(false);
  });

  it("validates watchlist creation schema", () => {
    const watchlistData = {
      name: "High-Priority IP Watchlist",
      item_type: "IP",
      indicators: ["185.220.101.5", "45.154.255.88"],
      description: "Critical ingress probes",
    };
    const parsed = threatWatchlistCreateSchema.safeParse(watchlistData);
    expect(parsed.success).toBe(true);
  });

  it("exports valid feed types and IOC categories", () => {
    expect(THREAT_FEED_TYPES.length).toBeGreaterThanOrEqual(4);
    expect(IOC_TYPES.length).toBeGreaterThanOrEqual(4);
  });
});
