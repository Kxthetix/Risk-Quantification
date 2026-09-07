/**
 * DEAD FILE — INVENTED DATA. Imported by nothing; verified 2026-09-02 with
 * `grep -rn "mockData" src/`, which returns only this file.
 *
 * This is the last of the original mock prototype: hand-written CVEs, hand-written risk scores and
 * hand-written "aiExplanation" strings from before any of the numbers were computed. Every figure in
 * the running app now comes from `processScanData` in src/utils/riskUtils.ts, driven by the scan JSON
 * and — once public/model/ exists — the trained artefact.
 *
 * It is kept only because deleting it is not reversible here (this project has no git repository).
 * Nothing should import it: the interfaces below duplicate the real ones in riskUtils.ts, and an
 * import would put fabricated rupee figures on a screen alongside computed ones with nothing to tell
 * them apart. Safe to delete outright.
 */
export interface AssetVuln {
  id: string;
  asset: string;
  category: 'Database' | 'Identity' | 'Network' | 'Application' | 'Infrastructure';
  cve: string;
  cveTitle: string;
  cvss: number; // 0.0 - 10.0
  epss: number; // 0.0 - 1.0 (Exploit Prediction Scoring System)
  criticality: 'Critical' | 'High' | 'Medium' | 'Low';
  assetValue: number; // in INR (₹)
  compensatingControl: string;
  aiExplanation: {
    verdict: string;
    keyDrivers: string[];
    recommendation: string;
  };
}

export interface SecurityControl {
  id: string;
  name: string;
  category: string;
  cost: number; // INR ₹
  riskReductionPct: number; // e.g. 28%
  implementationWeeks: number;
  description: string;
  targetAssets: string[];
}

export interface TrendPoint {
  day: string;
  date: string;
  riskScore: number;
  financialExposure: number; // in Lakhs/Crores
  criticalCount: number;
}

export const mockAssets: AssetVuln[] = [
  {
    id: 'ASSET-01',
    asset: 'Student Information & Records DB',
    category: 'Database',
    cve: 'CVE-2023-38606',
    cveTitle: 'Remote Code Execution in Database Engine',
    cvss: 9.8,
    epss: 0.89,
    criticality: 'Critical',
    assetValue: 125000000, // ₹12.5 Cr
    compensatingControl: 'Basic network subnet firewall; no real-time behavioral monitoring',
    aiExplanation: {
      verdict: 'IMMEDIATE SEVERE THREAT: High likelihood of mass PII exfiltration and regulatory penalty.',
      keyDrivers: [
        'Active in-the-wild exploitation detected (EPSS 0.89 puts it in the top 1% of exploited CVEs globally)',
        'Houses 45,000+ student Aadhaar/ID records and academic transcripts (Business Criticality: Tier 1)',
        'Lacks database activity monitoring (DAM) and transparent column-level encryption'
      ],
      recommendation: 'Emergency patch deployment within 24 hours + isolate DB subnet via microsegmentation.'
    }
  },
  {
    id: 'ASSET-02',
    asset: 'Central Active Directory & SSO IdP',
    category: 'Identity',
    cve: 'CVE-2024-21413',
    cveTitle: 'NTLM Relay / Privilege Escalation Flaw',
    cvss: 9.8,
    epss: 0.84,
    criticality: 'Critical',
    assetValue: 95000000, // ₹9.5 Cr
    compensatingControl: 'Standard password policy; MFA enforced only for remote VPN users',
    aiExplanation: {
      verdict: 'CRITICAL DOMAIN BREACH RISK: Threat actor can compromise campus domain controller in 1 hop.',
      keyDrivers: [
        'Extreme CVSS (9.8) combined with high EPSS (0.84) signifies automated weaponized exploit kits',
        'Single point of authentication for 60,000 faculty, students, and administrative endpoints',
        'No Phishing-resistant FIDO2 MFA on internal workstation logins'
      ],
      recommendation: 'Enforce LDAP signing and channel binding; rollout hardware-backed MFA domain-wide.'
    }
  },
  {
    id: 'ASSET-03',
    asset: 'Online Examination & Evaluation Portal',
    category: 'Application',
    cve: 'CVE-2023-46604',
    cveTitle: 'Apache ActiveMQ Untrusted Deserialization RCE',
    cvss: 9.8,
    epss: 0.91,
    criticality: 'Critical',
    assetValue: 80000000, // ₹8.0 Cr
    compensatingControl: 'Reverse proxy with rate limiting',
    aiExplanation: {
      verdict: 'HIGH INTEGRITY TAMPERING RISK: Direct vulnerability during ongoing semester exam cycle.',
      keyDrivers: [
        'EPSS score 0.91 indicates massive botnet scanning and automated exploitation campaigns',
        'Integrity compromise would nullify end-semester grades, causing extreme institutional reputational loss',
        'Exam question repositories accessible through connected backend queue'
      ],
      recommendation: 'Upgrade message broker to version 5.18.3+; implement zero-trust ingress filtering.'
    }
  },
  {
    id: 'ASSET-04',
    asset: 'University Payment & Fee Gateway',
    category: 'Application',
    cve: 'CVE-2023-34362',
    cveTitle: 'SQL Injection leading to Remote Code Execution',
    cvss: 9.8,
    epss: 0.76,
    criticality: 'Critical',
    assetValue: 70000000, // ₹7.0 Cr
    compensatingControl: 'Third-party hosted payment iframe, but local receipt generation server',
    aiExplanation: {
      verdict: 'FINANCIAL & LEGAL LIABILITY: Potential diversion of student tuition fee deposits.',
      keyDrivers: [
        'Direct SQL injection path bypassing web application input sanitization',
        'Handles over ₹35 Cr in annual tuition transactions and banking webhook callbacks',
        'Payment notification endpoints open to public internet without IP whitelisting'
      ],
      recommendation: 'Implement strict parameterized queries and deploy Cloud WAF with virtual patching.'
    }
  },
  {
    id: 'ASSET-05',
    asset: 'Campus Core Gateway & Perimeter Firewall',
    category: 'Network',
    cve: 'CVE-2024-3400',
    cveTitle: 'Palo Alto PAN-OS Command Injection Vulnerability',
    cvss: 10.0,
    epss: 0.94,
    criticality: 'Critical',
    assetValue: 110000000, // ₹11.0 Cr
    compensatingControl: 'Threat prevention subscription enabled, but telemetry feature active',
    aiExplanation: {
      verdict: 'PERIMETER COLLAPSE HAZARD: Maximum CVSS (10.0) with weaponized state-sponsored exploits.',
      keyDrivers: [
        'Global EPSS 0.94 - known active ransomware groups using this for initial foothold',
        'Controls 100% of campus internet traffic across 4 campuses and remote research centers',
        'Device compromise yields full packet capture capabilities including plaintext protocols'
      ],
      recommendation: 'Apply vendor hotfix immediately; disable device telemetry until patched.'
    }
  },
  {
    id: 'ASSET-06',
    asset: 'Learning Management System (LMS - Moodle)',
    category: 'Application',
    cve: 'CVE-2023-50164',
    cveTitle: 'Apache Struts Path Traversal File Upload RCE',
    cvss: 9.8,
    epss: 0.65,
    criticality: 'High',
    assetValue: 45000000, // ₹4.5 Cr
    compensatingControl: 'Antivirus scan on student assignment uploads with 15-minute delay',
    aiExplanation: {
      verdict: 'OPERATIONAL DISRUPTION RISK: Attackers can upload web shells disguised as homework files.',
      keyDrivers: [
        'Widespread student upload privileges make boundary validation critical',
        'EPSS 0.65 indicates public exploit scripts available on GitHub and underground forums',
        'Direct connection to student grades database via internal service account'
      ],
      recommendation: 'Deploy isolated object storage with synchronous sandboxed malware detonation.'
    }
  },
  {
    id: 'ASSET-07',
    asset: 'Faculty Research Supercomputing Cluster (HPC)',
    category: 'Infrastructure',
    cve: 'CVE-2024-1086',
    cveTitle: 'Linux Kernel Netfilter Use-After-Free Privilege Escalation',
    cvss: 7.8,
    epss: 0.58,
    criticality: 'High',
    assetValue: 60000000, // ₹6.0 Cr
    compensatingControl: 'SSH key-only login restricted to campus VPN IP pool',
    aiExplanation: {
      verdict: 'INTELLECTUAL PROPERTY THEFT: Risk to patented defense/biotech grant research datasets.',
      keyDrivers: [
        'Local privilege escalation allows unprivileged graduate students to gain root access',
        'Houses ₹18 Cr worth of funded defense & biotechnology simulation projects',
        'Cluster compute nodes frequently targeted for unauthorized cryptomining'
      ],
      recommendation: 'Update kernel to 6.8+ and implement eBPF-based container runtime isolation.'
    }
  },
  {
    id: 'ASSET-08',
    asset: 'Campus-wide Wi-Fi Controller (Aruba/Cisco)',
    category: 'Network',
    cve: 'CVE-2023-38035',
    cveTitle: 'MobileIron Sentry Apache HTTP Header Authentication Bypass',
    cvss: 8.8,
    epss: 0.42,
    criticality: 'Medium',
    assetValue: 30000000, // ₹3.0 Cr
    compensatingControl: 'WPA2-Enterprise with 802.1X student RADIUS credentials',
    aiExplanation: {
      verdict: 'ROGUE NETWORK INTRUSION: Potential pivoting point for unauthenticated on-campus guests.',
      keyDrivers: [
        'Vulnerability allows bypass of management portal authentication',
        'Connects 18,000 concurrent mobile and laptop endpoints across hostels and classrooms',
        'Lacks client-to-client isolation on student dormitory SSIDs'
      ],
      recommendation: 'Segregate management plane to out-of-band VLAN; enforce 802.1X device compliance.'
    }
  },
  {
    id: 'ASSET-09',
    asset: 'Campus Hospital & Health Clinic Records',
    category: 'Database',
    cve: 'CVE-2023-22515',
    cveTitle: 'Atlassian Confluence Broken Access Control Vulnerability',
    cvss: 9.8,
    epss: 0.72,
    criticality: 'High',
    assetValue: 35000000, // ₹3.5 Cr
    compensatingControl: 'Internal IP whitelist; accessible by 120 medical center doctors and nurses',
    aiExplanation: {
      verdict: 'CONFIDENTIAL MEDICAL PRIVACY BREACH: DISHA & HIPAA compliance exposure.',
      keyDrivers: [
        'Allows creation of unauthorized admin accounts without authentication',
        'Stores health checkups, vaccination histories, and medical disability certificates',
        'EPSS 0.72 shows persistent ransomware targeting of healthcare systems'
      ],
      recommendation: 'Immediate upgrade to LTS version; restrict access behind Zero Trust Network Access (ZTNA).'
    }
  },
  {
    id: 'ASSET-10',
    asset: 'Enterprise ERP & Faculty Payroll System',
    category: 'Application',
    cve: 'CVE-2022-39952',
    cveTitle: 'Fortinet FortiNAC Unauthenticated Remote Code Execution',
    cvss: 9.8,
    epss: 0.68,
    criticality: 'High',
    assetValue: 50000000, // ₹5.0 Cr
    compensatingControl: 'Hosted on internal LAN; no direct internet DNS entry',
    aiExplanation: {
      verdict: 'PAYROLL & SALARY TAMPERING: Threat to monthly faculty disbursements and tax data.',
      keyDrivers: [
        'Direct remote code execution allows lateral traversal from compromised faculty desktops',
        'Contains bank account details, PAN cards, and salary slips of 2,800 staff members',
        'Backup verification frequency is only monthly'
      ],
      recommendation: 'Deploy Privileged Access Management (PAM) with just-in-time session recording.'
    }
  },
  {
    id: 'ASSET-11',
    asset: 'University Public Web Portal & CMS',
    category: 'Application',
    cve: 'CVE-2023-3824',
    cveTitle: 'PHP Buffer Overflow in Phar Deserialization',
    cvss: 7.5,
    epss: 0.35,
    criticality: 'Medium',
    assetValue: 20000000, // ₹2.0 Cr
    compensatingControl: 'CDN caching layer (Cloudflare free tier) with basic rate-limiting',
    aiExplanation: {
      verdict: 'DEVIATION / DEFACEMENT RISK: Threat actors defacing public admissions page.',
      keyDrivers: [
        'Public face of the institution visited by 100k+ applicants during admission cycle',
        'Moderate CVSS with public exploits; potential defacement damages brand credibility',
        'Isolated from internal university databases via DMZ'
      ],
      recommendation: 'Upgrade PHP runtime; enforce read-only container filesystem for web workers.'
    }
  },
  {
    id: 'ASSET-12',
    asset: 'Registrar & Degree Verification Archive',
    category: 'Database',
    cve: 'CVE-2023-29357',
    cveTitle: 'Microsoft SharePoint Privilege Escalation',
    cvss: 8.8,
    epss: 0.54,
    criticality: 'High',
    assetValue: 40000000, // ₹4.0 Cr
    compensatingControl: 'Active Directory domain joined; file backups replicated nightly',
    aiExplanation: {
      verdict: 'ACADEMIC FRAUD EXPOSURE: Risk of counterfeit degree and diploma certificates.',
      keyDrivers: [
        'Allows spoofed JWT token authentication leading to full administrator rights',
        'Used by external employers and embassies to verify genuine graduate credentials',
        'Audit logs not currently forwarded to immutable SIEM storage'
      ],
      recommendation: 'Deploy Microsoft security patch KB5002497; configure cryptographic blockchain notarization.'
    }
  },
  {
    id: 'ASSET-13',
    asset: 'Campus CCTV & Physical Access Controller',
    category: 'Infrastructure',
    cve: 'CVE-2023-28771',
    cveTitle: 'Zyxel IKE Packet Remote Code Execution Flaw',
    cvss: 9.8,
    epss: 0.61,
    criticality: 'Medium',
    assetValue: 25000000, // ₹2.5 Cr
    compensatingControl: 'Isolated physical security VLAN with NVR storage servers',
    aiExplanation: {
      verdict: 'PHYSICAL SECURITY BLIND-SPOT: Threat actors disabling hostel and gate camera feeds.',
      keyDrivers: [
        'Malformed UDP packets trigger root shell execution on IP camera gateways',
        'Covers 1,200 cameras across campus dormitories, perimeter walls, and labs',
        'Potential sabotage or concealment of physical campus incidents'
      ],
      recommendation: 'Block UDP port 500/4500 at perimeter; isolate surveillance VLAN from academic networks.'
    }
  },
  {
    id: 'ASSET-14',
    asset: 'Internal Code Repository (GitLab CE)',
    category: 'Infrastructure',
    cve: 'CVE-2023-7028',
    cveTitle: 'Account Takeover via Password Reset Without Interaction',
    cvss: 10.0,
    epss: 0.79,
    criticality: 'High',
    assetValue: 38000000, // ₹3.8 Cr
    compensatingControl: 'Mandatory 2FA enabled for 70% of accounts, but recovery emails unverified',
    aiExplanation: {
      verdict: 'SUPPLY CHAIN & SECRET LEAKAGE: Hardcoded database credentials inside research repos.',
      keyDrivers: [
        'Attacker can reset admin passwords to arbitrary unverified email addresses',
        'Contains source code for all custom university portals, microservices, and scripts',
        'Over 140 git commits contain hardcoded API keys and internal database passwords'
      ],
      recommendation: 'Upgrade to GitLab 16.7.2 immediately; scan repository history with automated secret detection.'
    }
  },
  {
    id: 'ASSET-15',
    asset: 'Virtual Desktop Infrastructure (VDI Farm)',
    category: 'Infrastructure',
    cve: 'CVE-2023-3519',
    cveTitle: 'Citrix NetScaler Unauthenticated Remote Code Execution',
    cvss: 9.8,
    epss: 0.86,
    criticality: 'High',
    assetValue: 42000000, // ₹4.2 Cr
    compensatingControl: 'Bandwidth throttling per user session',
    aiExplanation: {
      verdict: 'REMOTE ACCESS HIJACKING: Threat actor impersonating engineering lab student desktops.',
      keyDrivers: [
        'Direct memory corruption flaw exploited in the wild for establishing persistent backdoors',
        'Allows remote lab access to licensed CAD, MATLAB, and specialized lab software',
        'Direct connection into university local area network once session established'
      ],
      recommendation: 'Apply emergency Citrix patch; restrict external VDI access behind ZTNA portal.'
    }
  },
  {
    id: 'ASSET-16',
    asset: 'Smart Library Resource & RFID Server',
    category: 'Application',
    cve: 'CVE-2023-27350',
    cveTitle: 'PaperCut MF/NG Authentication Bypass to Remote Code Execution',
    cvss: 9.8,
    epss: 0.74,
    criticality: 'Low',
    assetValue: 12000000, // ₹1.2 Cr
    compensatingControl: 'Local subnet access only; print queues purged nightly',
    aiExplanation: {
      verdict: 'LATERAL PIVOT POINT: Low value asset used as beachhead to jump to critical subnets.',
      keyDrivers: [
        'Easily exploitable authentication bypass on print management system',
        'Direct LDAP integration shares service credentials with core Active Directory',
        'Runs as SYSTEM privileges on a legacy Windows Server 2016 machine'
      ],
      recommendation: 'Patch PaperCut to 22.0.9+; demote service account permissions in Active Directory.'
    }
  },
  {
    id: 'ASSET-17',
    asset: 'Hostel Smart Water & Power SCADA Sensor Gateway',
    category: 'Infrastructure',
    cve: 'CVE-2022-40982',
    cveTitle: 'Intel Processor Downfall Information Disclosure',
    cvss: 6.5,
    epss: 0.15,
    criticality: 'Low',
    assetValue: 8000000, // ₹80 Lakhs
    compensatingControl: 'Dedicated physical copper cabling, no direct internet gateway',
    aiExplanation: {
      verdict: 'MICRO-CONTROLLER PROBING: Low likelihood of exploitation without physical access.',
      keyDrivers: [
        'Speculative execution flaw requires co-located code execution on sensor collector node',
        'Isolated industrial IoT network with strict Modbus communication rules',
        'Minimal threat to core student or financial data'
      ],
      recommendation: 'Apply microcode CPU updates during scheduled annual campus utility maintenance.'
    }
  },
  {
    id: 'ASSET-18',
    asset: 'Alumni Network & Endowment Portal',
    category: 'Application',
    cve: 'CVE-2023-32315',
    cveTitle: 'Openfire Administrative Console Authentication Bypass',
    cvss: 9.8,
    epss: 0.52,
    criticality: 'Medium',
    assetValue: 18000000, // ₹1.8 Cr
    compensatingControl: 'Web Application Firewall active with basic SQLi signatures',
    aiExplanation: {
      verdict: 'DONOR PRIVACY & PHISHING: Potential spear-phishing campaigns against wealthy donors.',
      keyDrivers: [
        'Path traversal vulnerability enables unauthorized admin plugin installations',
        'Houses contact details and donation records of 25,000+ distinguished alumni',
        'Could be leveraged to send fraudulent endowment appeals'
      ],
      recommendation: 'Upgrade Openfire server to 4.7.5+ and review installed admin plugins.'
    }
  }
];

export const mockSecurityControls: SecurityControl[] = [
  {
    id: 'CTRL-01',
    name: 'Deploy Zero-Trust Microsegmentation',
    category: 'Network Architecture',
    cost: 1800000, // ₹18 Lakhs
    riskReductionPct: 32,
    implementationWeeks: 6,
    description: 'Enforces software-defined microsegmentation preventing lateral movement between database, exam, and student networks.',
    targetAssets: ['Student Information & Records DB', 'Campus Core Gateway & Perimeter Firewall', 'Online Examination & Evaluation Portal']
  },
  {
    id: 'CTRL-02',
    name: 'Phishing-Resistant FIDO2/Hardware MFA',
    category: 'Identity Security',
    cost: 1200000, // ₹12 Lakhs
    riskReductionPct: 28,
    implementationWeeks: 4,
    description: 'Hardware tokens & WebAuthn for all 2,800 faculty, IT admins, and examination evaluators, halting credential relay attacks.',
    targetAssets: ['Central Active Directory & SSO IdP', 'Enterprise ERP & Faculty Payroll System', 'Online Examination & Evaluation Portal']
  },
  {
    id: 'CTRL-03',
    name: 'Database Activity Monitoring (DAM) & Column Encryption',
    category: 'Data Protection',
    cost: 1500000, // ₹15 Lakhs
    riskReductionPct: 25,
    implementationWeeks: 5,
    description: 'Real-time SQL query behavior analysis, automated exfiltration blocking, and cryptographic tokenization for student Aadhaar/grades.',
    targetAssets: ['Student Information & Records DB', 'Campus Hospital & Health Clinic Records', 'Registrar & Degree Verification Archive']
  },
  {
    id: 'CTRL-04',
    name: 'AI-Driven Managed XDR / Endpoint Detection',
    category: 'Endpoint Security',
    cost: 1000000, // ₹10 Lakhs
    riskReductionPct: 22,
    implementationWeeks: 3,
    description: 'Autonomous agentic endpoint telemetry and threat isolation on 3,500 lab workstations and administrative laptops.',
    targetAssets: ['Faculty Research Supercomputing Cluster (HPC)', 'Virtual Desktop Infrastructure (VDI Farm)', 'Internal Code Repository (GitLab CE)']
  },
  {
    id: 'CTRL-05',
    name: 'Next-Gen Cloud WAF with Virtual Patching',
    category: 'Application Security',
    cost: 800000, // ₹8 Lakhs
    riskReductionPct: 19,
    implementationWeeks: 2,
    description: 'Instant zero-day exploit shielding at edge reverse proxy before underlying applications can be officially patched.',
    targetAssets: ['University Payment & Fee Gateway', 'Learning Management System (LMS - Moodle)', 'University Public Web Portal & CMS']
  },
  {
    id: 'CTRL-06',
    name: 'Privileged Access Management (PAM) Vault',
    category: 'Identity Security',
    cost: 950000, // ₹9.5 Lakhs
    riskReductionPct: 20,
    implementationWeeks: 4,
    description: 'Ephemeral credential generation, just-in-time privilege elevation, and recorded remote admin terminal sessions.',
    targetAssets: ['Central Active Directory & SSO IdP', 'Enterprise ERP & Faculty Payroll System', 'Campus Core Gateway & Perimeter Firewall']
  },
  {
    id: 'CTRL-07',
    name: 'Immutable Air-Gapped Ransomware Backups',
    category: 'Business Continuity',
    cost: 1400000, // ₹14 Lakhs
    riskReductionPct: 24,
    implementationWeeks: 5,
    description: 'WORM (Write Once Read Many) immutable cloud object backup with 1-hour RTO (Recovery Time Objective) guarantee.',
    targetAssets: ['Student Information & Records DB', 'Enterprise ERP & Faculty Payroll System', 'Registrar & Degree Verification Archive']
  },
  {
    id: 'CTRL-08',
    name: 'Automated Patch & Vulnerability Orchestration (VPO)',
    category: 'Vulnerability Management',
    cost: 650000, // ₹6.5 Lakhs
    riskReductionPct: 16,
    implementationWeeks: 3,
    description: 'Automated scanning, EPSS-prioritized staging, and zero-downtime hot-patching for Linux and Windows server pools.',
    targetAssets: ['Faculty Research Supercomputing Cluster (HPC)', 'Smart Library Resource & RFID Server', 'Alumni Network & Endowment Portal']
  },
  {
    id: 'CTRL-09',
    name: '802.1X Network Access Control (NAC) & Rogue Isolation',
    category: 'Network Security',
    cost: 700000, // ₹7.0 Lakhs
    riskReductionPct: 14,
    implementationWeeks: 3,
    description: 'Cryptographic device fingerprinting preventing unauthorized student laptops from bridging onto internal administrative VLANs.',
    targetAssets: ['Campus-wide Wi-Fi Controller (Aruba/Cisco)', 'Campus CCTV & Physical Access Controller']
  },
  {
    id: 'CTRL-10',
    name: 'Continuous Human Phishing Simulation & Training',
    category: 'Security Culture',
    cost: 400000, // ₹4.0 Lakhs
    riskReductionPct: 10,
    implementationWeeks: 2,
    description: 'Monthly localized bilingual phishing lures to students and faculty with immediate bite-sized corrective tutorials.',
    targetAssets: ['Central Active Directory & SSO IdP', 'University Payment & Fee Gateway']
  }
];

export const mockTrendData: TrendPoint[] = [
  { day: 'Day 1', date: '01 Aug', riskScore: 84.5, financialExposure: 48200000, criticalCount: 9 },
  { day: 'Day 3', date: '03 Aug', riskScore: 83.8, financialExposure: 47900000, criticalCount: 9 },
  { day: 'Day 6', date: '06 Aug', riskScore: 86.2, financialExposure: 49400000, criticalCount: 10 },
  { day: 'Day 9', date: '09 Aug', riskScore: 85.0, financialExposure: 48800000, criticalCount: 9 },
  { day: 'Day 12', date: '12 Aug', riskScore: 81.4, financialExposure: 46200000, criticalCount: 8 },
  { day: 'Day 15', date: '15 Aug', riskScore: 82.3, financialExposure: 46800000, criticalCount: 8 },
  { day: 'Day 18', date: '18 Aug', riskScore: 88.9, financialExposure: 52100000, criticalCount: 11 },
  { day: 'Day 21', date: '21 Aug', riskScore: 87.1, financialExposure: 50400000, criticalCount: 10 },
  { day: 'Day 24', date: '24 Aug', riskScore: 83.5, financialExposure: 47600000, criticalCount: 8 },
  { day: 'Day 27', date: '27 Aug', riskScore: 80.2, financialExposure: 44900000, criticalCount: 7 },
  { day: 'Day 30', date: '30 Aug', riskScore: 78.6, financialExposure: 43800000, criticalCount: 6 }
];
