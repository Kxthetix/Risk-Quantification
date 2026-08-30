import { z } from "zod";

export const assetSchema = z.object({
  name: z.string().min(1, "Asset name is required").max(255),
  description: z.string().max(2000).optional().or(z.literal("")),
  asset_type: z.enum([
    "SERVER",
    "WORKSTATION",
    "LAPTOP",
    "DESKTOP",
    "DATABASE",
    "WEB_APPLICATION",
    "API",
    "NETWORK_DEVICE",
    "FIREWALL",
    "ROUTER",
    "SWITCH",
    "IOT_DEVICE",
    "CLOUD_RESOURCE",
    "CONTAINER",
    "VIRTUAL_MACHINE",
    "OTHER",
  ]),
  hostname: z.string().max(255).optional().or(z.literal("")),
  ip_address: z
    .string()
    .max(45)
    .optional()
    .or(z.literal(""))
    .refine(
      (val) => {
        if (!val) return true;
        // Basic IPv4 / IPv6 regex
        const ipv4 = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        const ipv6 = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4})$/;
        return ipv4.test(val) || ipv6.test(val) || val.includes(":");
      },
      { message: "Must be a valid IPv4 or IPv6 address" }
    ),
  mac_address: z.string().max(17).optional().or(z.literal("")),
  operating_system: z.string().max(100).optional().or(z.literal("")),
  os_version: z.string().max(50).optional().or(z.literal("")),
  environment: z.enum([
    "PRODUCTION",
    "STAGING",
    "DEVELOPMENT",
    "TESTING",
    "DISASTER_RECOVERY",
    "OTHER",
  ]),
  criticality: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  business_value: z.coerce.number().min(0, "Business value cannot be negative").optional(),
  data_classification: z.enum(["PUBLIC", "INTERNAL", "CONFIDENTIAL", "RESTRICTED"]),
  internet_exposed: z.boolean().default(false),
  status: z.enum(["ACTIVE", "INACTIVE", "MAINTENANCE", "DECOMMISSIONED", "UNKNOWN"]),
  location: z.string().max(255).optional().or(z.literal("")),
  owner: z.string().max(255).optional().or(z.literal("")),
});

export type AssetFormData = z.infer<typeof assetSchema>;

export const networkRelationshipSchema = z.object({
  destination_asset_id: z.string().uuid("Please select a destination asset"),
  relationship_type: z.enum([
    "NETWORK_REACHABILITY",
    "DEPENDS_ON",
    "CONNECTS_TO",
    "TRUSTS",
    "AUTHENTICATES_TO",
    "HOSTS",
    "COMMUNICATES_WITH",
  ]),
  protocol: z.string().max(32).default("TCP"),
  port: z.coerce.number().int().min(1).max(65535).optional(),
  direction: z.enum(["INBOUND", "OUTBOUND", "BIDIRECTIONAL"]).default("OUTBOUND"),
});

export type NetworkRelationshipFormData = z.infer<typeof networkRelationshipSchema>;
