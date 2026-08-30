export const THREAT_FEED_TYPES = [
  { value: "STIX/TAXII", label: "STIX/TAXII 2.1 Standard Feed" },
  { value: "IOC_FEED", label: "Live Malicious IOC Feed" },
  { value: "MALWARE", label: "Malware Signatures & Hashes" },
  { value: "VULNERABILITY", label: "Exploited Vulnerability Intel (KEV)" },
  { value: "DARK_WEB", label: "Dark Web & Breach Intel" },
  { value: "COMMERCIAL", label: "Commercial Premium Feed" },
];

export const IOC_TYPES = [
  { value: "ALL", label: "All Types" },
  { value: "IP", label: "IP Address" },
  { value: "DOMAIN", label: "Domain Name" },
  { value: "URL", label: "Malicious URL" },
  { value: "HASH_SHA256", label: "SHA-256 Hash" },
  { value: "EMAIL", label: "Email Address" },
];

export const CONFIDENCE_LEVELS = [
  { value: "CONFIRMED", label: "Confirmed (100%)", color: "text-red-400 bg-red-950/40 border-red-800" },
  { value: "HIGH", label: "High (80-99%)", color: "text-amber-400 bg-amber-950/40 border-amber-800" },
  { value: "MEDIUM", label: "Medium (50-79%)", color: "text-yellow-400 bg-yellow-950/40 border-yellow-800" },
  { value: "LOW", label: "Low (<50%)", color: "text-blue-400 bg-blue-950/40 border-blue-800" },
];
