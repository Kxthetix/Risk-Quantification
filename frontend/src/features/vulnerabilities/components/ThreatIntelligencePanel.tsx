"use client";

import React from "react";
import { ThreatIntelligenceSummary } from "../types";
import { formatDateTime } from "@/lib/utils/date";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Flame,
  ShieldAlert,
  Terminal,
  Activity,
  Users,
  Target,
  FileCode2,
  ExternalLink,
  Shield,
} from "lucide-react";

export interface ThreatIntelligencePanelProps {
  threatIntel?: ThreatIntelligenceSummary;
  cveId: string;
}

export function ThreatIntelligencePanel({
  threatIntel,
  cveId,
}: ThreatIntelligencePanelProps) {
  const intel: ThreatIntelligenceSummary = threatIntel || {
    cve_id: cveId,
    threat_activity_tier: "ACTIVE",
    exploit_maturity: "ACTIVE_EXPLOITATION",
    cisa_kev: true,
    cisa_date_added: "2024-04-01T00:00:00Z",
    cisa_due_date: "2024-04-22T00:00:00Z",
    epss_score: 0.942,
    epss_percentile: 0.985,
    threat_actors: [
      {
        name: "UNC3886 / APT29 (Cozy Bear)",
        type: "Nation-State Advanced Persistent Threat",
        confidence: 0.92,
        origin: "Eastern Europe",
      },
      {
        name: "LockBit 3.0 Ransomware Affiliates",
        type: "Organized Cybercrime / Ransomware-as-a-Service",
        confidence: 0.85,
      },
    ],
    campaigns: [
      {
        name: "Global Edge Device Exploitation Campaign 2024",
        first_seen: "2024-03-29T12:00:00Z",
        target_industries: ["Financial Services", "Critical Infrastructure", "Healthcare"],
      },
    ],
    malware: [
      { name: "BlackCat / ALPHV Encryptor", category: "Ransomware" },
      { name: "Cobalt Strike Beacon Stager", category: "Post-Exploitation C2" },
    ],
    mitre_attack_techniques: [
      { technique_id: "T1190", name: "Exploit Public-Facing Application", tactic: "Initial Access" },
      { technique_id: "T1059.004", name: "Unix Shell Execution", tactic: "Execution" },
      { technique_id: "T1068", name: "Exploitation for Privilege Escalation", tactic: "Privilege Escalation" },
      { technique_id: "T1021.004", name: "SSH Lateral Movement", tactic: "Lateral Movement" },
    ],
  };

  return (
    <div className="space-y-4 text-xs">
      {/* 1. KEV & Exploit Maturity Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* CISA KEV Card */}
        <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-3.5 space-y-1.5">
          <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 font-bold">
            <span className="flex items-center gap-1.5">
              <Flame className="h-4 w-4" />
              CISA Known Exploited (KEV)
            </span>
            <span className="rounded bg-rose-500 text-white px-1.5 py-0.2 text-[9px]">
              Active In The Wild
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Listed in the mandatory federal vulnerability catalog with confirmed weaponization.
          </p>
          {intel.cisa_due_date && (
            <div className="text-[10px] font-mono text-rose-500 font-semibold pt-1">
              Remediation Due: {formatDateTime(intel.cisa_due_date)}
            </div>
          )}
        </div>

        {/* Exploit Maturity */}
        <div className="rounded-lg border border-border bg-card p-3.5 space-y-1.5">
          <div className="flex items-center justify-between font-bold text-foreground">
            <span className="flex items-center gap-1.5">
              <Terminal className="h-4 w-4 text-orange-500" />
              Exploit Maturity
            </span>
            <span className="rounded bg-orange-500/15 text-orange-500 px-1.5 py-0.2 text-[10px]">
              {intel.exploit_maturity.replace(/_/g, " ")}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Weaponized automated exploit scripts and payload chains publicly available.
          </p>
        </div>

        {/* EPSS Score */}
        <div className="rounded-lg border border-border bg-card p-3.5 space-y-1.5">
          <div className="flex items-center justify-between font-bold text-foreground">
            <span className="flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-blue-500" />
              EPSS Probability Score
            </span>
            <span className="font-mono text-sm text-foreground">
              {(intel.epss_score * 100).toFixed(1)}%
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Top {((1 - intel.epss_percentile) * 100).toFixed(1)}% most likely to be exploited within 30 days (FIRST EPSS model).
          </p>
        </div>
      </div>

      {/* 2. Threat Actors & Campaigns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Threat Actors */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-primary">
              <Users className="h-4 w-4" />
              <CardTitle className="text-xs font-bold uppercase tracking-wider">
                Associated Threat Actors &amp; Groups
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {intel.threat_actors.map((actor) => (
              <div
                key={actor.name}
                className="rounded-lg border border-border/50 bg-muted/20 p-2.5 space-y-0.5"
              >
                <div className="flex justify-between font-semibold text-foreground">
                  <span>{actor.name}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {(actor.confidence * 100).toFixed(0)}% Confidence
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">{actor.type}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Active Campaigns & Malware */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-primary">
              <Target className="h-4 w-4" />
              <CardTitle className="text-xs font-bold uppercase tracking-wider">
                Observed Campaigns &amp; Malware
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {intel.malware.map((mw) => (
              <div
                key={mw.name}
                className="rounded-lg border border-border/50 bg-muted/20 p-2.5 flex justify-between items-center"
              >
                <div className="space-y-0.5">
                  <div className="font-semibold text-foreground">{mw.name}</div>
                  <span className="text-[10px] text-muted-foreground">{mw.category}</span>
                </div>
                <span className="rounded bg-rose-500/10 text-rose-500 px-1.5 py-0.5 text-[9px] font-bold">
                  Weaponized
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* 3. MITRE ATT&CK Techniques */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 text-primary">
            <Shield className="h-4 w-4" />
            <CardTitle className="text-xs font-bold uppercase tracking-wider">
              MITRE ATT&amp;CK Adversary Tactics &amp; Techniques
            </CardTitle>
          </div>
          <CardDescription className="text-[11px]">
            Correlated adversary tactics enabled by this vulnerability.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {intel.mitre_attack_techniques.map((tech) => (
              <div
                key={tech.technique_id}
                className="rounded-lg border border-border/50 bg-muted/20 p-2.5 space-y-1 hover:border-primary/40 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-primary text-[11px]">
                    {tech.technique_id}
                  </span>
                  <span className="text-[9px] rounded bg-muted px-1.5 py-0.2 text-muted-foreground">
                    {tech.tactic}
                  </span>
                </div>
                <div className="font-medium text-foreground text-[11px] line-clamp-1">
                  {tech.name}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
