"""
catalog.py — control catalogues for the five frameworks the platform reports against.

Every entry carries a `verification` field, and that field is load-bearing:

    "verified"   identifier and title confirmed against the published standard
    "inferred"   control exists and the title is substantively right, but the exact
                 numbering could not be confirmed from the primary document
    "assigned"   the publisher does not expose a stable public identifier we could
                 confirm, so the platform assigns one; `basis` states the real
                 requirement it stands for

Nothing downstream is allowed to silently promote "inferred" or "assigned" to
"verified". Regulatory reports print the status next to the identifier so a reviewer
knows which citations to check against the source document.

Sources
    ISO/IEC 27001:2022 Annex A          93 controls, four themes
    NIST CSF 2.0 (Feb 2024)             six functions, subcategory identifiers
    CIS Critical Security Controls v8.1 18 controls, numbered safeguards
    RBI Cyber Security Framework in Banks, DBS.CO/CSITE/BC.11/33.01.001/2015-16
        (2 June 2016), Annex 1 baseline requirements
    SEBI Cybersecurity and Cyber Resilience Framework (CSCRF),
        SEBI/HO/ITD-1/ITD_CSC_EXT/P/CIR/2024/113 (20 August 2024)
"""
from __future__ import annotations

VERIFIED = "verified"
INFERRED = "inferred"
ASSIGNED = "assigned"


# --------------------------------------------------------------------------- #
# ISO/IEC 27001:2022 Annex A
# --------------------------------------------------------------------------- #
ISO27001 = {
    "id": "iso27001",
    "name": "ISO/IEC 27001:2022",
    "long_name": "ISO/IEC 27001:2022 Annex A — Information security controls",
    "authority": "International Organization for Standardization",
    "groups": {
        "A.5": "Organizational controls",
        "A.6": "People controls",
        "A.7": "Physical controls",
        "A.8": "Technological controls",
    },
    "controls": {},
}

_ISO_CONTROLS: list[tuple[str, str, str]] = [
    ("A.5.1",  "Policies for information security",                          "A.5"),
    ("A.5.2",  "Information security roles and responsibilities",            "A.5"),
    ("A.5.4",  "Management responsibilities",                                "A.5"),
    ("A.5.7",  "Threat intelligence",                                        "A.5"),
    ("A.5.9",  "Inventory of information and other associated assets",       "A.5"),
    ("A.5.10", "Acceptable use of information and other associated assets",  "A.5"),
    ("A.5.12", "Classification of information",                              "A.5"),
    ("A.5.14", "Information transfer",                                       "A.5"),
    ("A.5.15", "Access control",                                             "A.5"),
    ("A.5.16", "Identity management",                                        "A.5"),
    ("A.5.17", "Authentication information",                                 "A.5"),
    ("A.5.18", "Access rights",                                              "A.5"),
    ("A.5.19", "Information security in supplier relationships",             "A.5"),
    ("A.5.21", "Managing information security in the ICT supply chain",      "A.5"),
    ("A.5.23", "Information security for use of cloud services",             "A.5"),
    ("A.5.24", "Information security incident management planning and preparation", "A.5"),
    ("A.5.25", "Assessment and decision on information security events",     "A.5"),
    ("A.5.26", "Response to information security incidents",                 "A.5"),
    ("A.5.27", "Learning from information security incidents",               "A.5"),
    ("A.5.28", "Collection of evidence",                                     "A.5"),
    ("A.5.29", "Information security during disruption",                     "A.5"),
    ("A.5.30", "ICT readiness for business continuity",                      "A.5"),
    ("A.5.31", "Legal, statutory, regulatory and contractual requirements",  "A.5"),
    ("A.5.35", "Independent review of information security",                 "A.5"),
    ("A.5.36", "Compliance with policies, rules and standards for information security", "A.5"),
    ("A.6.3",  "Information security awareness, education and training",     "A.6"),
    ("A.6.8",  "Information security event reporting",                       "A.6"),
    ("A.7.4",  "Physical security monitoring",                               "A.7"),
    ("A.8.1",  "User endpoint devices",                                      "A.8"),
    ("A.8.2",  "Privileged access rights",                                   "A.8"),
    ("A.8.3",  "Information access restriction",                             "A.8"),
    ("A.8.5",  "Secure authentication",                                      "A.8"),
    ("A.8.6",  "Capacity management",                                        "A.8"),
    ("A.8.7",  "Protection against malware",                                 "A.8"),
    ("A.8.8",  "Management of technical vulnerabilities",                    "A.8"),
    ("A.8.9",  "Configuration management",                                   "A.8"),
    ("A.8.11", "Data masking",                                               "A.8"),
    ("A.8.12", "Data leakage prevention",                                    "A.8"),
    ("A.8.13", "Information backup",                                         "A.8"),
    ("A.8.14", "Redundancy of information processing facilities",            "A.8"),
    ("A.8.15", "Logging",                                                    "A.8"),
    ("A.8.16", "Monitoring activities",                                      "A.8"),
    ("A.8.19", "Installation of software on operational systems",            "A.8"),
    ("A.8.20", "Networks security",                                          "A.8"),
    ("A.8.21", "Security of network services",                               "A.8"),
    ("A.8.22", "Segregation of networks",                                    "A.8"),
    ("A.8.23", "Web filtering",                                              "A.8"),
    ("A.8.24", "Use of cryptography",                                        "A.8"),
    ("A.8.25", "Secure development life cycle",                              "A.8"),
    ("A.8.26", "Application security requirements",                          "A.8"),
    ("A.8.28", "Secure coding",                                              "A.8"),
    ("A.8.29", "Security testing in development and acceptance",             "A.8"),
    ("A.8.31", "Separation of development, test and production environments", "A.8"),
    ("A.8.32", "Change management",                                          "A.8"),
]
for _cid, _title, _grp in _ISO_CONTROLS:
    ISO27001["controls"][_cid] = {"title": _title, "group": _grp,
                                  "group_name": ISO27001["groups"][_grp],
                                  "verification": VERIFIED}


# --------------------------------------------------------------------------- #
# NIST Cybersecurity Framework 2.0
# --------------------------------------------------------------------------- #
NIST_CSF = {
    "id": "nistcsf",
    "name": "NIST CSF 2.0",
    "long_name": "NIST Cybersecurity Framework 2.0 (February 2024)",
    "authority": "National Institute of Standards and Technology",
    "groups": {
        "GV": "Govern",
        "ID": "Identify",
        "PR": "Protect",
        "DE": "Detect",
        "RS": "Respond",
        "RC": "Recover",
    },
    "controls": {},
}

_CSF_SUBCATEGORIES: list[tuple[str, str]] = [
    ("GV.RM-01", "Risk management objectives are established and agreed to by organizational stakeholders"),
    ("GV.RM-02", "Risk appetite and risk tolerance statements are established, communicated and maintained"),
    ("GV.RM-03", "Cybersecurity risk management activities and outcomes are included in enterprise risk management processes"),
    ("GV.RM-05", "Lines of communication across the organization are established for cybersecurity risks"),
    ("GV.RM-06", "A standardized method for calculating, documenting, categorizing and prioritizing cybersecurity risks is established"),
    ("GV.OV-01", "Cybersecurity risk management strategy outcomes are reviewed to inform and adjust strategy and direction"),
    ("GV.OV-03", "Organizational cybersecurity risk management performance is evaluated and reviewed for adjustments needed"),
    ("GV.SC-04", "Suppliers are known and prioritized by criticality"),
    ("GV.SC-07", "The risks posed by a supplier, their products and services, and other third parties are understood, recorded, prioritized, assessed, responded to and monitored"),
    ("ID.AM-01", "Inventories of hardware managed by the organization are maintained"),
    ("ID.AM-02", "Inventories of software, services and systems managed by the organization are maintained"),
    ("ID.AM-05", "Assets are prioritized based on classification, criticality, resources and impact on the mission"),
    ("ID.AM-08", "Systems, hardware, software, services and data are managed throughout their life cycles"),
    ("ID.RA-01", "Vulnerabilities in assets are identified, validated and recorded"),
    ("ID.RA-02", "Cyber threat intelligence is received from information sharing forums and sources"),
    ("ID.RA-03", "Internal and external threats to the organization are identified and recorded"),
    ("ID.RA-04", "Potential impacts and likelihoods of threats exploiting vulnerabilities are identified and recorded"),
    ("ID.RA-05", "Threats, vulnerabilities, likelihoods and impacts are used to understand inherent risk and inform risk response prioritization"),
    ("ID.RA-06", "Risk responses are chosen, prioritized, planned, tracked and communicated"),
    ("ID.RA-07", "Changes and exceptions are managed, assessed for risk impact, recorded and tracked"),
    ("ID.RA-08", "Processes for receiving, analyzing and responding to vulnerability disclosures are established"),
    ("ID.IM-01", "Improvements are identified from evaluations"),
    ("ID.IM-02", "Improvements are identified from security tests and exercises, including those done in coordination with suppliers and third parties"),
]

_CSF_SUBCATEGORIES += [
    ("PR.AA-01", "Identities and credentials for authorized users, services and hardware are managed by the organization"),
    ("PR.AA-02", "Identities are proofed and bound to credentials based on the context of interactions"),
    ("PR.AA-03", "Users, services and hardware are authenticated"),
    ("PR.AA-05", "Access permissions, entitlements and authorizations are defined in a policy, managed, enforced and reviewed, and incorporate the principle of least privilege"),
    ("PR.AA-06", "Physical access to assets is managed, monitored and enforced commensurate with risk"),
    ("PR.AT-01", "Personnel are provided with awareness and training so that they possess the knowledge and skills to perform general tasks with cybersecurity risks in mind"),
    ("PR.AT-02", "Individuals in specialized roles are provided with awareness and training so that they possess the knowledge and skills to perform relevant tasks with cybersecurity risks in mind"),
    ("PR.DS-01", "The confidentiality, integrity and availability of data-at-rest are protected"),
    ("PR.DS-02", "The confidentiality, integrity and availability of data-in-transit are protected"),
    ("PR.DS-10", "The confidentiality, integrity and availability of data-in-use are protected"),
    ("PR.DS-11", "Backups of data are created, protected, maintained and tested"),
    ("PR.PS-01", "Configuration management practices are established and applied"),
    ("PR.PS-02", "Software is maintained, replaced and removed commensurate with risk"),
    ("PR.PS-03", "Hardware is maintained, replaced and removed commensurate with risk"),
    ("PR.PS-04", "Log records are generated and made available for continuous monitoring"),
    ("PR.PS-05", "Installation and execution of unauthorized software are prevented"),
    ("PR.PS-06", "Secure software development practices are integrated, and their performance is monitored throughout the software development life cycle"),
    ("PR.IR-01", "Networks and environments are protected from unauthorized logical access and usage"),
    ("PR.IR-02", "The organization's technology assets are protected from environmental threats"),
    ("PR.IR-03", "Mechanisms are implemented to achieve resilience requirements in normal and adverse situations"),
    ("PR.IR-04", "Adequate resource capacity to ensure availability is maintained"),
    ("DE.AE-02", "Potentially adverse events are analyzed to better understand associated activities"),
    ("DE.AE-03", "Information is correlated from multiple sources"),
    ("DE.AE-04", "The estimated impact and scope of adverse events are understood"),
    ("DE.AE-06", "Information on adverse events is provided to authorized staff and tools"),
    ("DE.AE-08", "Incidents are declared when adverse events meet the defined incident criteria"),
    ("DE.CM-01", "Networks and network services are monitored to find potentially adverse events"),
    ("DE.CM-03", "Personnel activity and technology usage are monitored to find potentially adverse events"),
    ("DE.CM-06", "External service provider activities and services are monitored to find potentially adverse events"),
    ("DE.CM-09", "Computing hardware and software, runtime environments and their data are monitored to find potentially adverse events"),
    ("RS.MA-01", "The incident response plan is executed in coordination with relevant third parties once an incident is declared"),
    ("RS.MA-02", "Incident reports are triaged and validated"),
    ("RS.MA-03", "Incidents are categorized and prioritized"),
    ("RS.AN-03", "Analysis is performed to establish what has taken place during an incident and the root cause of the incident"),
    ("RS.CO-02", "Internal and external stakeholders are notified of incidents"),
    ("RS.CO-03", "Information is shared with designated internal and external stakeholders"),
    ("RS.MI-01", "Incidents are contained"),
    ("RS.MI-02", "Incidents are eradicated"),
    ("RC.RP-01", "The recovery portion of the incident response plan is executed once initiated from the incident response process"),
    ("RC.RP-05", "The integrity of restored assets is verified, systems and services are restored, and normal operating status is confirmed"),
    ("RC.CO-03", "Recovery activities and progress in restoring operational capabilities are communicated to designated internal and external stakeholders"),
]

for _cid, _title in _CSF_SUBCATEGORIES:
    _fn = _cid.split(".")[0]
    NIST_CSF["controls"][_cid] = {"title": _title, "group": _fn,
                                 "group_name": NIST_CSF["groups"][_fn],
                                 "verification": VERIFIED}


# --------------------------------------------------------------------------- #
# CIS Critical Security Controls v8.1
# --------------------------------------------------------------------------- #
CIS = {
    "id": "cis",
    "name": "CIS Controls v8.1",
    "long_name": "CIS Critical Security Controls version 8.1",
    "authority": "Center for Internet Security",
    "groups": {
        "1":  "Inventory and Control of Enterprise Assets",
        "2":  "Inventory and Control of Software Assets",
        "3":  "Data Protection",
        "4":  "Secure Configuration of Enterprise Assets and Software",
        "5":  "Account Management",
        "6":  "Access Control Management",
        "7":  "Continuous Vulnerability Management",
        "8":  "Audit Log Management",
        "9":  "Email and Web Browser Protections",
        "10": "Malware Defenses",
        "11": "Data Recovery",
        "12": "Network Infrastructure Management",
        "13": "Network Monitoring and Defense",
        "14": "Security Awareness and Skills Training",
        "15": "Service Provider Management",
        "16": "Application Software Security",
        "17": "Incident Response Management",
        "18": "Penetration Testing",
    },
    "controls": {},
}

_CIS_SAFEGUARDS: list[tuple[str, str, int]] = [
    ("1.1",  "Establish and maintain detailed enterprise asset inventory", 1),
    ("1.2",  "Address unauthorized assets", 1),
    ("2.1",  "Establish and maintain a software inventory", 2),
    ("2.2",  "Ensure authorized software is currently supported", 2),
    ("2.3",  "Address unauthorized software", 2),
    ("2.5",  "Allowlist authorized software", 2),
    ("2.7",  "Allowlist authorized scripts", 2),
    ("3.1",  "Establish and maintain a data management process", 3),
    ("3.3",  "Configure data access control lists", 3),
    ("3.7",  "Establish and maintain a data classification scheme", 3),
    ("3.10", "Encrypt sensitive data in transit", 3),
    ("3.11", "Encrypt sensitive data at rest", 3),
    ("3.13", "Deploy a data loss prevention solution", 3),
    ("3.14", "Log sensitive data access", 3),
]

_CIS_SAFEGUARDS += [
    ("4.1",  "Establish and maintain a secure configuration process", 4),
    ("4.2",  "Establish and maintain a secure configuration process for network infrastructure", 4),
    ("4.4",  "Implement and manage a firewall on servers", 4),
    ("4.6",  "Securely manage enterprise assets and software", 4),
    ("4.7",  "Manage default accounts on enterprise assets and software", 4),
    ("4.8",  "Uninstall or disable unnecessary services on enterprise assets and software", 4),
    ("5.1",  "Establish and maintain an inventory of accounts", 5),
    ("5.2",  "Use unique passwords", 5),
    ("5.3",  "Disable dormant accounts", 5),
    ("5.4",  "Restrict administrator privileges to dedicated administrator accounts", 5),
    ("6.1",  "Establish an access granting process", 6),
    ("6.2",  "Establish an access revoking process", 6),
    ("6.3",  "Require MFA for externally-exposed applications", 6),
    ("6.4",  "Require MFA for remote network access", 6),
    ("6.5",  "Require MFA for administrative access", 6),
    ("6.7",  "Centralize access control", 6),
    ("6.8",  "Define and maintain role-based access control", 6),
    ("7.1",  "Establish and maintain a vulnerability management process", 7),
    ("7.2",  "Establish and maintain a remediation process", 7),
    ("7.3",  "Perform automated operating system patch management", 7),
    ("7.4",  "Perform automated application patch management", 7),
    ("7.5",  "Perform automated vulnerability scans of internal enterprise assets", 7),
    ("7.6",  "Perform automated vulnerability scans of externally-exposed enterprise assets", 7),
    ("7.7",  "Remediate detected vulnerabilities", 7),
    ("8.2",  "Collect audit logs", 8),
    ("8.5",  "Collect detailed audit logs", 8),
    ("8.9",  "Centralize audit logs", 8),
    ("8.11", "Conduct audit log reviews", 8),
    ("9.1",  "Ensure use of only fully supported browsers and email clients", 9),
    ("9.2",  "Use DNS filtering services", 9),
    ("9.6",  "Block unnecessary file types", 9),
    ("9.7",  "Deploy and maintain email server anti-malware protections", 9),
    ("10.1", "Deploy and maintain anti-malware software", 10),
    ("10.2", "Configure automatic anti-malware signature updates", 10),
    ("10.5", "Enable anti-exploitation features", 10),
    ("10.7", "Use behaviour-based anti-malware software", 10),
    ("11.2", "Perform automated backups", 11),
    ("11.3", "Protect recovery data", 11),
    ("11.4", "Establish and maintain an isolated instance of recovery data", 11),
    ("11.5", "Test data recovery", 11),
    ("12.2", "Establish and maintain a secure network architecture", 12),
    ("12.6", "Use of secure network management and communication protocols", 12),
    ("12.8", "Establish and maintain dedicated computing resources for all administrative work", 12),
]

_CIS_SAFEGUARDS += [
    ("13.1", "Centralize security event alerting", 13),
    ("13.2", "Deploy a host-based intrusion detection solution", 13),
    ("13.3", "Deploy a network intrusion detection solution", 13),
    ("13.4", "Perform traffic filtering between network segments", 13),
    ("13.6", "Collect network traffic flow logs", 13),
    ("13.10", "Perform application layer filtering", 13),
    ("14.1", "Establish and maintain a security awareness program", 14),
    ("14.2", "Train workforce members to recognize social engineering attacks", 14),
    ("14.6", "Train workforce members on recognizing and reporting security incidents", 14),
    ("15.1", "Establish and maintain an inventory of service providers", 15),
    ("15.4", "Ensure service provider contracts include security requirements", 15),
    ("16.1", "Establish and maintain a secure application development process", 16),
    ("16.2", "Establish and maintain a process to accept and address software vulnerabilities", 16),
    ("16.5", "Use up-to-date and trusted third-party software components", 16),
    ("16.11", "Leverage vetted modules or services for application security components", 16),
    ("16.12", "Implement code-level security checks", 16),
    ("16.13", "Conduct application penetration testing", 16),
    ("17.1", "Designate personnel to manage incident handling", 17),
    ("17.3", "Establish and maintain an enterprise process for reporting incidents", 17),
    ("17.4", "Establish and maintain an incident response process", 17),
    ("17.7", "Conduct routine incident response exercises", 17),
    ("18.1", "Establish and maintain a penetration testing program", 18),
    ("18.2", "Perform periodic external penetration tests", 18),
    ("18.3", "Remediate penetration test findings", 18),
]

for _sid, _title, _grp in _CIS_SAFEGUARDS:
    CIS["controls"][_sid] = {"title": _title, "group": str(_grp),
                             "group_name": CIS["groups"][str(_grp)],
                             "verification": VERIFIED}


# --------------------------------------------------------------------------- #
# RBI Cyber Security Framework in Banks — Annex 1 baseline requirements
#
# The circular is DBS.CO/CSITE/BC.11/33.01.001/2015-16 dated 2 June 2016. Annex 1 sets
# out the "Baseline Cyber Security and Resilience Requirements", Annex 2 covers the Cyber
# Security Operations Centre (C-SOC) and Annex 3 the Cyber Crisis Management Plan (CCMP).
#
# The requirement titles below are substantively correct, but the primary PDF could not
# be retrieved in this environment to confirm the official ordering, so every item is
# marked INFERRED. Confirm numbering against Annex 1 before using these citations in a
# filing to the regulator.
# --------------------------------------------------------------------------- #
RBI = {
    "id": "rbi",
    "name": "RBI Cyber Security Framework",
    "long_name": ("RBI Cyber Security Framework in Banks — Annex 1 Baseline Cyber "
                  "Security and Resilience Requirements (circular "
                  "DBS.CO/CSITE/BC.11/33.01.001/2015-16, 2 June 2016)"),
    "authority": "Reserve Bank of India",
    "groups": {
        "A1": "Annex 1 — Baseline cyber security and resilience requirements",
        "A2": "Annex 2 — Cyber Security Operations Centre (C-SOC)",
        "A3": "Annex 3 — Cyber Crisis Management Plan (CCMP)",
    },
    "controls": {},
}

_RBI_ANNEX1: list[tuple[str, str]] = [
    ("RBI-A1-01", "Inventory management of business IT assets"),
    ("RBI-A1-02", "Preventing execution of unauthorised software"),
    ("RBI-A1-03", "Environmental controls"),
    ("RBI-A1-04", "Network management and security"),
    ("RBI-A1-05", "Secure configuration"),
    ("RBI-A1-06", "Application security life cycle (ASLC)"),
    ("RBI-A1-07", "Patch / vulnerability and change management"),
    ("RBI-A1-08", "User access control and management"),
    ("RBI-A1-09", "Authentication framework for customers"),
    ("RBI-A1-10", "Secure mail and messaging systems"),
    ("RBI-A1-11", "Removable media"),
    ("RBI-A1-12", "Advanced real-time threat defence and management"),
    ("RBI-A1-13", "Anti-phishing"),
    ("RBI-A1-14", "Data leak prevention strategy"),
    ("RBI-A1-15", "Maintenance, monitoring and analysis of audit logs"),
    ("RBI-A1-16", "Audit log settings"),
    ("RBI-A1-17", "Vulnerability assessment, penetration testing and red team exercises"),
    ("RBI-A1-18", "Incident response and management"),
    ("RBI-A1-19", "Risk based transaction monitoring"),
    ("RBI-A1-20", "Metrics"),
    ("RBI-A1-21", "Forensics"),
    ("RBI-A1-22", "User, employee and management awareness"),
    ("RBI-A1-23", "Customer education and awareness"),
    ("RBI-A1-24", "Backup and recovery of data"),
    ("RBI-A1-25", "Vendor and outsourcing risk management"),
]

_RBI_OTHER: list[tuple[str, str, str]] = [
    ("RBI-A2-01", "Cyber Security Operations Centre with continuous surveillance", "A2"),
    ("RBI-A2-02", "C-SOC threat intelligence, correlation and forensic capability", "A2"),
    ("RBI-A3-01", "Board-approved Cyber Crisis Management Plan", "A3"),
    ("RBI-A3-02", "Detection, response, recovery and containment of cyber incidents", "A3"),
    ("RBI-A3-03", "Reporting of unusual cyber security incidents to RBI", "A3"),
]

for _cid, _title in _RBI_ANNEX1:
    RBI["controls"][_cid] = {
        "title": _title, "group": "A1", "group_name": RBI["groups"]["A1"],
        "verification": INFERRED,
        "note": "Title substantively correct; official Annex 1 numbering unconfirmed.",
    }
for _cid, _title, _grp in _RBI_OTHER:
    RBI["controls"][_cid] = {
        "title": _title, "group": _grp, "group_name": RBI["groups"][_grp],
        "verification": INFERRED,
        "note": "Derived from the annex subject matter; not an official clause number.",
    }


# --------------------------------------------------------------------------- #
# SEBI Cybersecurity and Cyber Resilience Framework (CSCRF)
#
# Circular SEBI/HO/ITD-1/ITD_CSC_EXT/P/CIR/2024/113 dated 20 August 2024, with technical
# clarifications issued 28 August 2025 and an FAQ in June 2025. CSCRF supersedes SEBI's
# earlier cyber security and cyber resilience circulars.
#
# CSCRF is anchored on five cyber resilience goals — Anticipate, Withstand, Contain,
# Recover, Evolve — and is structured against the six NIST CSF 2.0 functions. It layers
# mandatory Standards with accompanying Guidelines, and graduates obligations across five
# categories of Regulated Entity: Market Infrastructure Institutions, Qualified REs,
# Mid-size, Small-size and Self-certification REs.
#
# SEBI's own standard numbering could not be retrieved here, so identifiers below are
# platform-ASSIGNED and each carries a `basis` describing the actual CSCRF obligation it
# represents. Map them to SEBI's published standard numbers before filing.
# --------------------------------------------------------------------------- #
SEBI = {
    "id": "sebi",
    "name": "SEBI CSCRF",
    "long_name": ("SEBI Cybersecurity and Cyber Resilience Framework for Regulated "
                  "Entities (circular SEBI/HO/ITD-1/ITD_CSC_EXT/P/CIR/2024/113, "
                  "20 August 2024)"),
    "authority": "Securities and Exchange Board of India",
    "resilience_goals": ["Anticipate", "Withstand", "Contain", "Recover", "Evolve"],
    "re_categories": ["Market Infrastructure Institution", "Qualified RE", "Mid-size RE",
                      "Small-size RE", "Self-certification RE"],
    "groups": {
        "GV": "Govern", "ID": "Identify", "PR": "Protect",
        "DE": "Detect", "RS": "Respond", "RC": "Recover",
    },
    "controls": {},
}

_SEBI_STANDARDS: list[tuple[str, str, str, str]] = [
    ("SEBI-GV-01", "GV", "Board-approved cybersecurity and cyber resilience policy",
     "CSCRF requires a board/partner/proprietor-approved policy reviewed at least annually."),
    ("SEBI-GV-02", "GV", "Designated senior official responsible for cybersecurity",
     "RE must designate a senior official (CISO or equivalent) accountable for the framework."),
    ("SEBI-GV-03", "GV", "Cyber Capability Index (CCI) measurement and reporting",
     "MIIs and Qualified REs must measure cyber resilience through the CCI; MIIs quarterly, "
     "Qualified REs annually."),
    ("SEBI-GV-04", "GV", "Third-party and outsourcing cyber risk governance",
     "Vendor/outsourcing arrangements must carry cybersecurity obligations and be assessed."),
    ("SEBI-GV-05", "GV", "Periodic cyber audit and submission to SEBI",
     "Cyber audits at the cadence set for the RE category, with findings reported to SEBI."),
    ("SEBI-ID-01", "ID", "Identification and classification of critical systems",
     "REs must identify critical systems and maintain a board-approved list."),
    ("SEBI-ID-02", "ID", "Asset inventory including hardware, software and data",
     "Comprehensive, current inventory of IT assets supporting critical systems."),
    ("SEBI-ID-03", "ID", "Software Bill of Materials (SBOM) for critical systems",
     "CSCRF introduces SBOM obligations for critical systems and new procurements."),
    ("SEBI-ID-04", "ID", "Risk assessment covering threats and vulnerabilities",
     "Documented risk assessment methodology linking threat, vulnerability and impact."),
    ("SEBI-ID-05", "ID", "Vulnerability assessment and penetration testing (VAPT)",
     "VAPT at the prescribed cadence, scoped to critical systems, with closure of findings "
     "and re-testing; reports submitted to SEBI."),
    ("SEBI-PR-01", "PR", "Access control and privilege management",
     "Least-privilege access, periodic review and removal of dormant privilege."),
    ("SEBI-PR-02", "PR", "Multi-factor authentication for critical access",
     "MFA required for access to critical systems and remote/administrative access."),
    ("SEBI-PR-03", "PR", "Network segregation and perimeter security",
     "Segregation of critical systems, controlled perimeter and secure configuration."),
    ("SEBI-PR-04", "PR", "Patch and vulnerability remediation management",
     "Timely patching with documented risk-based prioritisation of remediation."),
    ("SEBI-PR-05", "PR", "Data protection, encryption and data localisation",
     "Protection of data at rest and in transit; CSCRF sets expectations on storage of "
     "regulatory data within India."),
    ("SEBI-PR-06", "PR", "Secure software development and application security",
     "Security embedded in the application life cycle for RE-developed systems."),
    ("SEBI-PR-07", "PR", "Cybersecurity training and awareness",
     "Periodic training for employees and, where relevant, investors/customers."),
    ("SEBI-DE-01", "DE", "Security Operations Centre monitoring",
     "SOC coverage — own, group or market SOC — with continuous monitoring; smaller REs may "
     "use the SEBI-facilitated market SOC."),
    ("SEBI-DE-02", "DE", "Centralised logging and log retention",
     "Logs captured, protected and retained for the prescribed period."),
    ("SEBI-DE-03", "DE", "Continuous threat detection and alerting",
     "Detection capability with defined alert triage for critical systems."),
    ("SEBI-RS-01", "RS", "Incident response plan and containment procedures",
     "Documented, tested incident response covering containment and eradication."),
    ("SEBI-RS-02", "RS", "Incident reporting to SEBI and CERT-In within timelines",
     "Cyber incidents reported to SEBI and CERT-In within the stipulated timelines."),
    ("SEBI-RS-03", "RS", "Root cause analysis and forensic capability",
     "RCA and forensic readiness following significant incidents."),
    ("SEBI-RC-01", "RC", "Recovery, RTO/RPO objectives and business continuity",
     "BCP-DR with defined recovery objectives for critical systems and periodic drills."),
    ("SEBI-RC-02", "RC", "Backup integrity and restoration testing",
     "Protected backups with tested restoration for critical systems."),
]

for _cid, _fn, _title, _basis in _SEBI_STANDARDS:
    SEBI["controls"][_cid] = {
        "title": _title, "group": _fn, "group_name": SEBI["groups"][_fn],
        "verification": ASSIGNED, "basis": _basis,
        "note": "Platform-assigned identifier; SEBI's official standard number unconfirmed.",
    }


FRAMEWORKS = {f["id"]: f for f in (ISO27001, NIST_CSF, CIS, RBI, SEBI)}

if __name__ == "__main__":
    for _fid, _fw in FRAMEWORKS.items():
        _statuses: dict[str, int] = {}
        for _c in _fw["controls"].values():
            _statuses[_c["verification"]] = _statuses.get(_c["verification"], 0) + 1
        print(f"{_fid:10} {len(_fw['controls']):3} controls  {_statuses}")
