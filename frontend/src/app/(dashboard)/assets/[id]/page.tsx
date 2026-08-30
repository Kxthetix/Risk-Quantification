"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  useAsset,
  useAssetRisk,
  useAssetVulnerabilities,
  useAssetSoftware,
  useAssetRelationships,
  useAssets,
} from "@/features/assets/hooks";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDateTime } from "@/lib/utils/date";
import { useOrganization } from "@/providers/OrganizationProvider";
import { AssetRiskCard } from "@/features/assets/components/AssetRiskCard";
import { AssetRelationships } from "@/features/assets/components/AssetRelationships";
import { AssetVulnerabilityTable } from "@/features/assets/components/AssetVulnerabilityTable";
import { AssetSoftwareTable } from "@/features/assets/components/AssetSoftwareTable";
import { AssetActivityTimeline } from "@/features/assets/components/AssetActivityTimeline";
import { ArchiveAssetDialog } from "@/features/assets/components/ArchiveAssetDialog";
import { RiskBadge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Server,
  ArrowLeft,
  Edit,
  Trash2,
  Globe,
  Database,
  Layers,
  Bug,
  Network,
  History,
  Shield,
  DollarSign,
  User,
  MapPin,
  Calendar,
  ExternalLink,
} from "lucide-react";

export default function AssetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const assetId = (params?.id as string) || "";
  const { currency } = useOrganization();

  const [activeTab, setActiveTab] = useState<
    "overview" | "risk" | "vulnerabilities" | "software" | "relationships" | "activity"
  >("overview");
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);

  // Queries
  const { data: asset, isLoading, error } = useAsset(assetId);
  const { data: riskSummary } = useAssetRisk(assetId);
  const { data: vulnsData } = useAssetVulnerabilities(assetId);
  const { data: softwareData } = useAssetSoftware(assetId);
  const { data: relationships } = useAssetRelationships();
  const { data: allAssetsList } = useAssets({ limit: 100 });

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-4 py-8">
        <div className="h-8 w-48 rounded bg-muted animate-pulse" />
        <div className="h-64 rounded-lg bg-muted/40 animate-pulse" />
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-4">
        <Server className="h-10 w-10 text-rose-500 mx-auto" />
        <h3 className="text-lg font-bold text-foreground">Asset Not Found</h3>
        <p className="text-xs text-muted-foreground">
          The requested asset endpoint does not exist or you lack viewing permissions.
        </p>
        <Button asChild size="sm">
          <Link href="/assets">Return to Asset Inventory</Link>
        </Button>
      </div>
    );
  }

  const vulnerabilities = vulnsData?.vulnerabilities || [];
  const software = softwareData?.software || asset.software || [];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* 1. Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/assets"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-foreground">{asset.name}</h1>
              {asset.internet_exposed && (
                <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  <Globe className="h-3 w-3" />
                  Internet Facing
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono mt-0.5">
              <span>{asset.asset_type.replace(/_/g, " ")}</span>
              {asset.ip_address && <span>• {asset.ip_address}</span>}
              {asset.hostname && <span>• {asset.hostname}</span>}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild className="text-xs h-8 gap-1.5">
            <Link href={`/assets/${asset.id}/edit`}>
              <Edit className="h-3.5 w-3.5" />
              <span>Edit Asset</span>
            </Link>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setArchiveModalOpen(true)}
            className="text-xs h-8 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 gap-1.5"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Archive</span>
          </Button>
        </div>
      </div>

      {/* 2. Top Metric Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg border border-border bg-card p-3 space-y-0.5">
          <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
            Criticality Tier
          </span>
          <div className="text-sm font-bold text-foreground">{asset.criticality}</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-3 space-y-0.5">
          <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
            Environment
          </span>
          <div className="text-sm font-bold text-foreground">{asset.environment}</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-3 space-y-0.5">
          <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
            Operational Status
          </span>
          <div className="text-sm font-bold text-emerald-500">{asset.status}</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-3 space-y-0.5">
          <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
            Asset Valuation
          </span>
          <div className="text-sm font-bold font-mono text-foreground">
            {asset.business_value
              ? formatCurrency(asset.business_value, { currency, compact: true })
              : "Unspecified"}
          </div>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-4 text-xs font-medium">
          <button
            onClick={() => setActiveTab("overview")}
            className={`pb-2.5 border-b-2 transition-colors ${
              activeTab === "overview"
                ? "border-primary text-primary font-bold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Overview
          </button>

          <button
            onClick={() => setActiveTab("risk")}
            className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "risk"
                ? "border-primary text-primary font-bold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Shield className="h-3.5 w-3.5" />
            <span>Cyber Risk & Financial</span>
          </button>

          <button
            onClick={() => setActiveTab("vulnerabilities")}
            className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "vulnerabilities"
                ? "border-primary text-primary font-bold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Bug className="h-3.5 w-3.5" />
            <span>Vulnerabilities ({vulnerabilities.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("software")}
            className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "software"
                ? "border-primary text-primary font-bold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Software Inventory ({software.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("relationships")}
            className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "relationships"
                ? "border-primary text-primary font-bold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Network className="h-3.5 w-3.5" />
            <span>Topology & Links</span>
          </button>

          <button
            onClick={() => setActiveTab("activity")}
            className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "activity"
                ? "border-primary text-primary font-bold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <History className="h-3.5 w-3.5" />
            <span>Audit History</span>
          </button>
        </div>
      </div>

      {/* 4. Tab Contents */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Technical Specifications */}
          <Card className="border-border bg-card">
            <CardContent className="p-4 space-y-3">
              <h4 className="font-semibold text-foreground uppercase tracking-wider text-[11px] text-muted-foreground">
                Technical Specifications
              </h4>
              <div className="divide-y divide-border/40">
                <div className="py-2 flex justify-between">
                  <span className="text-muted-foreground">Operating System:</span>
                  <span className="font-medium text-foreground">
                    {asset.operating_system || "Unknown OS"}{" "}
                    {asset.os_version ? `(${asset.os_version})` : ""}
                  </span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-muted-foreground">MAC Address:</span>
                  <span className="font-mono text-foreground">{asset.mac_address || "—"}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-muted-foreground">IP Address:</span>
                  <span className="font-mono text-foreground">{asset.ip_address || "—"}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-muted-foreground">Hostname:</span>
                  <span className="font-mono text-foreground">{asset.hostname || "—"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Business & Governance Context */}
          <Card className="border-border bg-card">
            <CardContent className="p-4 space-y-3">
              <h4 className="font-semibold text-foreground uppercase tracking-wider text-[11px] text-muted-foreground">
                Governance & Ownership
              </h4>
              <div className="divide-y divide-border/40">
                <div className="py-2 flex justify-between">
                  <span className="text-muted-foreground">Data Classification:</span>
                  <span className="font-medium text-foreground">{asset.data_classification}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-muted-foreground">Assigned Owner / Team:</span>
                  <span className="font-medium text-foreground">{asset.owner || "Unassigned"}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-muted-foreground">Cloud Region / Location:</span>
                  <span className="font-medium text-foreground">{asset.location || "Default Data Center"}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-muted-foreground">First Discovered / Added:</span>
                  <span className="text-muted-foreground font-mono">
                    {formatDateTime(asset.created_at)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          {asset.description && (
            <Card className="border-border bg-card md:col-span-2">
              <CardContent className="p-4 space-y-1">
                <h4 className="font-semibold text-foreground uppercase tracking-wider text-[11px] text-muted-foreground">
                  Asset Purpose & Workload Notes
                </h4>
                <p className="text-muted-foreground leading-relaxed">{asset.description}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === "risk" && (
        <AssetRiskCard
          riskSummary={riskSummary}
          assetCriticality={asset.criticality}
        />
      )}

      {activeTab === "vulnerabilities" && (
        <AssetVulnerabilityTable
          vulnerabilities={vulnerabilities}
          assetId={asset.id}
        />
      )}

      {activeTab === "software" && <AssetSoftwareTable software={software} />}

      {activeTab === "relationships" && (
        <AssetRelationships
          assetId={asset.id}
          relationships={relationships || []}
          availableAssets={allAssetsList?.items || []}
        />
      )}

      {activeTab === "activity" && (
        <AssetActivityTimeline
          assetCreatedAt={asset.created_at}
          assetUpdatedAt={asset.updated_at}
        />
      )}

      {/* Archive Modal */}
      <ArchiveAssetDialog
        asset={asset}
        open={archiveModalOpen}
        onOpenChange={setArchiveModalOpen}
      />
    </div>
  );
}
