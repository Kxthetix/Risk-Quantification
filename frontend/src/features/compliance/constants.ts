export const FRAMEWORK_CODES = {
  ISO_27001: "ISO-27001",
  NIST_CSF: "NIST-CSF",
  SOC_2: "SOC-2",
  PCI_DSS: "PCI-DSS",
  CIS_V8: "CIS-v8",
  GDPR: "GDPR",
} as const;

export const ISO_27001_CATEGORIES = [
  { id: "A.5", name: "Organizational Controls", count: 37, description: "Information security policies, asset management, access control, supplier security." },
  { id: "A.6", name: "People Controls", count: 8, description: "Screening, terms of employment, awareness training, remote working." },
  { id: "A.7", name: "Physical Controls", count: 14, description: "Physical security perimeters, entry controls, equipment protection, clear desk." },
  { id: "A.8", name: "Technological Controls", count: 34, description: "Privileged access, secure coding, WAF, malware defense, network segmentation." },
] as const;

export const IMPLEMENTATION_STATUSES = [
  "Not Implemented",
  "Planned",
  "Partially Implemented",
  "Implemented",
  "Effective",
  "Not Applicable",
] as const;

export const GAP_SEVERITIES = [
  "Critical",
  "High",
  "Medium",
  "Low",
  "Informational",
] as const;

export const EVIDENCE_TYPES = [
  "Policy",
  "Procedure",
  "Screenshot",
  "Configuration",
  "Log",
  "Audit Report",
  "Certificate",
  "Document",
  "Ticket",
  "System Record",
] as const;

export const ASSESSMENT_STATUSES = [
  "Draft",
  "In Progress",
  "Submitted",
  "Under Review",
  "Approved",
  "Rejected",
  "Closed",
] as const;

export const REMEDIATION_STATUSES = [
  "Open",
  "Assigned",
  "In Progress",
  "Blocked",
  "Completed",
  "Verified",
  "Closed",
] as const;
