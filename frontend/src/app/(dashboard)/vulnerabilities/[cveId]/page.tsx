"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useVulnerability } from "@/features/vulnerabilities/hooks";
import { SeverityBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { VulnerabilityRiskCard } from "@/features/vulnerabilities/components/VulnerabilityRiskCard";
import { ThreatIntelligencePanel } from "@/features/vulnerabilities/components/ThreatIntelligencePanel";
import { AffectedAssetsTable } from "@/features/vulnerabilities/components/AffectedAssetsTable";
import { VulnerabilityFinancialImpact } from "@/features/vulnerabilities/components/VulnerabilityFinancialImpact";
import { VulnerabilityAttackPaths } from "@/features/vulnerabilities/components/VulnerabilityAttackPaths";
import { VulnerabilityRemediationPanel } from "@/features/vulnerabilities/components/VulnerabilityRemediationPanel";
import { VulnerabilityHistory } from "@/features/vulnerabilities/components/VulnerabilityHistory";
import { AcceptRiskDialog } from "@/features/vulnerabilities/components/AcceptRiskDialog";
import { CreateRemediationModal } from "@/features/vulnerabilities/components/CreateRemediationModal";
import { formatDateTime } from "@/lib/utils/date";
import {
  ArrowLeft,
  Flame,
  Bug,
  Shield,
  ShieldAlert,
  Server,
  DollarSign,
  GitFork,
  Wrench,
  History,
  ExternalLink,
  Code,
  Globe,
} from "lucide-react";

export default function VulnerabilityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const cveId = (params?.cveId as string) || "";

  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "assets"
    | "risk"
    | "threat_intel"
    | "financial"
    | "attack_paths"
    | "remediation"
    | "history"
  >("overview");

  const [acceptRiskOpen, setAcceptRiskOpen] = useState(false);
  const [remediationModalOpen, setRemediationModalOpen] = useState(false);

  const { data: vuln, isLoading, error } = useVulnerability(cveId);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-4 py-8">
        <div className="h-8 w-48 rounded bg-muted animate-pulse" />
        <div className="h-64 rounded-lg bg-muted/40 animate-pulse" />
      </div>
    );
  }

  if (error || !vuln) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-4">
        <Bug className="h-10 w-10 text-rose-500 mx-auto" />
        <h3 className="text-lg font-bold text-foreground">Vulnerability Record Not Found</h3>
        <p className="text-xs text-muted-foreground">
          The requested CVE {cveId} could not be retrieved from the intelligence database.
        </p>
        <Button asChild size="sm">
          <Link href="/vulnerabilities">Return to Vulnerability Catalog</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/vulnerabilities"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold font-mono text-foreground">{vuln.cve_id}</h1>
              <SeverityBadge severity={vuln.severity} className="text-xs" />
              {vuln.known_exploited && (
                <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold bg-rose-500/15 text-rose-500 border border-rose-500/30">
                  <Flame className="h-3 w-3" />
                  Known Exploited (KEV)
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 max-w-2xl">
              {vuln.title || vuln.description}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setRemediationModalOpen(true)}
            className="text-xs h-8 gap-1.5"
          >
            <Wrench className="h-3.5 w-3.5" />
            <span>Create Remediation</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setAcceptRiskOpen(true)}
            className="text-xs h-8 text-amber-600 dark:text-amber-400 gap-1.5"
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>Accept Risk</span>
          </Button>

          <Button variant="ghost" size="sm" asChild className="text-xs h-8 gap-1.5">
            <a
              href={`https://nvd.nist.gov/vuln/detail/${vuln.cve_id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>NVD Source</span>
            </a>
          </Button>
        </div>
      </div>

      {/* 2. Top Metric KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="rounded-lg border border-border bg-card p-3 space-y-0.5">
          <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
            CVSS Base Score
          </span>
          <div className="text-lg font-bold font-mono text-foreground">
            {vuln.cvss_score ? vuln.cvss_score.toFixed(1) : "—"}{" "}
            <span className="text-xs font-normal text-muted-foreground">
              (v{vuln.cvss_version || "3.1"})
            </span>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-3 space-y-0.5">
          <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
            Exploit Status
          </span>
          <div className="text-sm font-bold text-rose-500">
            {vuln.known_exploited
              ? "Active Exploitation"
              : vuln.exploit_available === "YES"
              ? "Public Exploit Available"
              : "No Known Exploit"}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-3 space-y-0.5">
          <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
            Primary CWE
          </span>
          <div className="text-sm font-bold font-mono text-foreground">
            {vuln.cwe_id || "CWE-General"}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-3 space-y-0.5">
          <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
            NVD Published Date
          </span>
          <div className="text-xs font-medium font-mono text-foreground">
            {vuln.published_at ? formatDateTime(vuln.published_at) : "Historical"}
          </div>
        </div>
      </div>

      {/* 3. 8-Tab Navigation Bar */}
      <div className="border-b border-border">
        <div className="flex gap-4 text-xs font-medium overflow-x-auto pb-0.5">
          <button
            onClick={() => setActiveTab("overview")}
            className={`pb-2.5 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === "overview"
                ? "border-primary text-primary font-bold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Overview
          </button>

          <button
            onClick={() => setActiveTab("assets")}
            className={`pb-2.5 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === "assets"
                ? "border-primary text-primary font-bold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Server className="h-3.5 w-3.5" />
            <span>Affected Assets</span>
          </button>

          <button
            onClick={() => setActiveTab("risk")}
            className={`pb-2.5 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === "risk"
                ? "border-primary text-primary font-bold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Shield className="h-3.5 w-3.5" />
            <span>Cyber Risk Scoring</span>
          </button>

          <button
            onClick={() => setActiveTab("threat_intel")}
            className={`pb-2.5 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === "threat_intel"
                ? "border-primary text-primary font-bold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Flame className="h-3.5 w-3.5" />
            <span>Threat Intelligence</span>
          </button>

          <button
            onClick={() => setActiveTab("financial")}
            className={`pb-2.5 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === "financial"
                ? "border-primary text-primary font-bold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <DollarSign className="h-3.5 w-3.5" />
            <span>Financial Impact (FAIR)</span>
          </button>

          <button
            onClick={() => setActiveTab("attack_paths")}
            className={`pb-2.5 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === "attack_paths"
                ? "border-primary text-primary font-bold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <GitFork className="h-3.5 w-3.5" />
            <span>Attack Paths</span>
          </button>

          <button
            onClick={() => setActiveTab("remediation")}
            className={`pb-2.5 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === "remediation"
                ? "border-primary text-primary font-bold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Wrench className="h-3.5 w-3.5" />
            <span>Remediation Workflow</span>
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`pb-2.5 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === "history"
                ? "border-primary text-primary font-bold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <History className="h-3.5 w-3.5" />
            <span>Audit History</span>
          </button>
        </div>
      </div>

      {/* 4. Tab Content */}
      {activeTab === "overview" && (
        <div className="space-y-4 text-xs">
          {/* Description */}
          <Card className="border-border bg-card">
            <CardContent className="p-4 space-y-2">
              <h4 className="font-semibold text-foreground uppercase tracking-wider text-[11px] text-muted-foreground">
                Vulnerability Summary &amp; Description
              </h4>
              <p className="text-muted-foreground leading-relaxed">{vuln.description}</p>
            </CardContent>
          </Card>

          {/* CVSS Vector Breakdown */}
          {vuln.cvss_vector && (
            <Card className="border-border bg-card">
              <CardContent className="p-4 space-y-2">
                <h4 className="font-semibold text-foreground uppercase tracking-wider text-[11px] text-muted-foreground">
                  CVSS Vector Metrics String
                </h4>
                <div className="font-mono text-xs bg-muted/30 p-2.5 rounded border border-border text-foreground">
                  {vuln.cvss_vector}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Affected CPE Configurations */}
          <Card className="border-border bg-card">
            <CardContent className="p-4 space-y-3">
              <h4 className="font-semibold text-foreground uppercase tracking-wider text-[11px] text-muted-foreground">
                Affected CPE Criteria ({vuln.affected_cpes?.length || 0})
              </h4>
              {vuln.affected_cpes && vuln.affected_cpes.length > 0 ? (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {vuln.affected_cpes.map((cpe, i) => (
                    <div
                      key={i}
                      className="rounded bg-muted/20 p-2 font-mono text-[11px] text-foreground border border-border/40"
                    >
                      {cpe.cpe_string || cpe.criteria}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No specific CPE strings attached to record.</p>
              )}
            </CardContent>
          </Card>

          {/* CWE Definitions */}
          {vuln.cwes && vuln.cwes.length > 0 && (
            <Card className="border-border bg-card">
              <CardContent className="p-4 space-y-2">
                <h4 className="font-semibold text-foreground uppercase tracking-wider text-[11px] text-muted-foreground">
                  Common Weakness Enumeration (CWE)
                </h4>
                <div className="space-y-2">
                  {vuln.cwes.map((cwe) => (
                    <div key={cwe.cwe_id} className="rounded bg-muted/20 p-2.5 border border-border/40">
                      <div className="font-bold text-foreground font-mono">{cwe.cwe_id}: {cwe.name}</div>
                      {cwe.description && (
                        <p className="text-[11px] text-muted-foreground mt-0.5">{cwe.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === "assets" && (
        <AffectedAssetsTable affectedAssets={[]} cveId={vuln.cve_id} />
      )}

      {activeTab === "risk" && (
        <VulnerabilityRiskCard cveId={vuln.cve_id} />
      )}

      {activeTab === "threat_intel" && (
        <ThreatIntelligencePanel cveId={vuln.cve_id} />
      )}

      {activeTab === "financial" && (
        <VulnerabilityFinancialImpact cveId={vuln.cve_id} />
      )}

      {activeTab === "attack_paths" && (
        <VulnerabilityAttackPaths cveId={vuln.cve_id} />
      )}

      {activeTab === "remediation" && (
        <VulnerabilityRemediationPanel
          cveId={vuln.cve_id}
          onCreateRemediation={() => setRemediationModalOpen(true)}
          onAcceptRisk={() => setAcceptRiskOpen(true)}
          onMarkFalsePositive={() => {}}
        />
      )}

      {activeTab === "history" && (
        <VulnerabilityHistory cveId={vuln.cve_id} />
      )}

      {/* Action Dialogs */}
      <AcceptRiskDialog
        cveId={vuln.cve_id}
        open={acceptRiskOpen}
        onOpenChange={setAcceptRiskOpen}
      />

      <CreateRemediationModal
        cveId={vuln.cve_id}
        defaultTitle={`Patch and mitigate ${vuln.cve_id}`}
        open={remediationModalOpen}
        onOpenChange={setRemediationModalOpen}
      />
    </div>
  );
}
