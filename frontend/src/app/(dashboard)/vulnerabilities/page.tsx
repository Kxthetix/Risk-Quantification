"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  useVulnerabilities,
  useVulnerabilityStatistics,
  useMatchVulnerabilities,
} from "@/features/vulnerabilities/hooks";
import { vulnerabilitiesApi } from "@/features/vulnerabilities/api";
import {
  Vulnerability,
  VulnerabilitySeverity,
  ExploitAvailability,
} from "@/types/vulnerability";
import { VulnerabilitySummaryCards } from "@/features/vulnerabilities/components/VulnerabilitySummaryCards";
import { VulnerabilityFilters } from "@/features/vulnerabilities/components/VulnerabilityFilters";
import { VulnerabilityTable } from "@/features/vulnerabilities/components/VulnerabilityTable";
import { SyncNvdModal } from "@/features/vulnerabilities/components/SyncNvdModal";
import { CreateRemediationModal } from "@/features/vulnerabilities/components/CreateRemediationModal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/providers/ToastProvider";
import {
  Bug,
  RefreshCw,
  Download,
  Upload,
  Layers,
  Sparkles,
  BarChart3,
} from "lucide-react";

export default function VulnerabilitiesPage() {
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [selectedSeverity, setSelectedSeverity] = useState<VulnerabilitySeverity | undefined>(
    (searchParams.get("severity") as VulnerabilitySeverity) || undefined
  );
  const [minCvss, setMinCvss] = useState<number | undefined>(
    searchParams.get("cvss_min") ? Number(searchParams.get("cvss_min")) : undefined
  );
  const [knownExploited, setKnownExploited] = useState<boolean | undefined>(
    searchParams.get("known_exploited") === "true" ? true : undefined
  );
  const [exploitAvailable, setExploitAvailable] = useState<ExploitAvailability | undefined>(
    (searchParams.get("exploit_available") as ExploitAvailability) || undefined
  );

  // Modals & Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [remediationTargetVuln, setRemediationTargetVuln] = useState<Vulnerability | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Queries
  const { data: stats, isLoading: isStatsLoading } = useVulnerabilityStatistics();
  const { data: vulnList, isLoading: isVulnLoading, refetch } = useVulnerabilities({
    page: currentPage,
    limit: pageSize,
    q: searchQuery || undefined,
    severity: selectedSeverity,
    cvss_min: minCvss,
    known_exploited: knownExploited,
    exploit_available: exploitAvailable,
  });

  const matchMutation = useMatchVulnerabilities();

  const vulnerabilities = vulnList?.items || [];
  const totalItems = vulnList?.total || 0;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === vulnerabilities.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(vulnerabilities.map((v) => v.id));
    }
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedSeverity(undefined);
    setMinCvss(undefined);
    setKnownExploited(undefined);
    setExploitAvailable(undefined);
    setCurrentPage(1);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const blob = await vulnerabilitiesApi.exportCsv();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cve_vulnerabilities_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({
        title: "Export Complete",
        description: "Vulnerability intelligence dataset downloaded.",
        variant: "success",
      });
    } catch (err: any) {
      toast({
        title: "Export Failed",
        description: err?.message || "Failed to download CSV export.",
        variant: "error",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-foreground">Vulnerability Intelligence</h1>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-mono font-bold text-primary">
              {totalItems} records
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Identify, prioritize, and treat security vulnerabilities contributing to organizational cyber risk.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" asChild className="text-xs h-8 gap-1.5">
            <Link href="/vulnerabilities/prioritized">
              <BarChart3 className="h-3.5 w-3.5 text-primary" />
              <span>Prioritization Matrix</span>
            </Link>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => matchMutation.mutate()}
            isLoading={matchMutation.isPending}
            className="text-xs h-8 gap-1.5"
            title="Correlate installed software inventory with CVE database"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>Run Match Engine</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            isLoading={isExporting}
            className="text-xs h-8 gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setSyncModalOpen(true)}
            className="text-xs h-8 gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Sync NVD Feed</span>
          </Button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <VulnerabilitySummaryCards statistics={stats} isLoading={isStatsLoading} />

      {/* 3. Filters Toolbar */}
      <VulnerabilityFilters
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          setCurrentPage(1);
        }}
        selectedSeverity={selectedSeverity}
        onSeverityChange={(s) => {
          setSelectedSeverity(s);
          setCurrentPage(1);
        }}
        minCvss={minCvss}
        onMinCvssChange={(cvss) => {
          setMinCvss(cvss);
          setCurrentPage(1);
        }}
        knownExploited={knownExploited}
        onKnownExploitedChange={(ke) => {
          setKnownExploited(ke);
          setCurrentPage(1);
        }}
        exploitAvailable={exploitAvailable}
        onExploitAvailableChange={(ea) => {
          setExploitAvailable(ea);
          setCurrentPage(1);
        }}
        onReset={handleResetFilters}
      />

      {/* 4. Vulnerabilities Table */}
      <VulnerabilityTable
        vulnerabilities={vulnerabilities}
        isLoading={isVulnLoading}
        selectedIds={selectedIds}
        onToggleSelect={handleToggleSelect}
        onToggleSelectAll={handleToggleSelectAll}
        onCreateRemediation={(vuln) => setRemediationTargetVuln(vuln)}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={(p) => setCurrentPage(p)}
      />

      {/* 5. Modals */}
      <SyncNvdModal open={syncModalOpen} onOpenChange={setSyncModalOpen} />

      {remediationTargetVuln && (
        <CreateRemediationModal
          cveId={remediationTargetVuln.cve_id}
          open={!!remediationTargetVuln}
          onOpenChange={(open) => !open && setRemediationTargetVuln(null)}
        />
      )}
    </div>
  );
}
