"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RiskBadge, StatusBadge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils/currency";
import {
  ArrowRight,
  Search,
  ExternalLink,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Target,
  Sparkles,
} from "lucide-react";
import { AttackPath } from "../types";

export interface AttackPathTableProps {
  paths?: AttackPath[];
  isLoading?: boolean;
  onSelectPath?: (path: AttackPath) => void;
}

export function AttackPathTable({
  paths = [],
  isLoading = false,
  onSelectPath,
}: AttackPathTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [riskFilter, setRiskFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Fallback demo paths if none in DB
  const displayPaths = paths.length > 0 ? paths : [
    {
      id: "path-1",
      source_node: "Internet Gateway",
      target_node: "Primary Payment DB",
      target_asset_name: "Primary Payment DB",
      business_service_name: "Transaction Processing",
      path_score: 94.2,
      likelihood: 0.88,
      impact: 0.95,
      confidence: 0.9,
      path_length: 4,
      status: "ACTIVE" as const,
      is_blocked: false,
      financial_exposure: 18400000,
      created_at: new Date().toISOString(),
      nodes: [
        { id: "n1", node_type: "ENTRY_POINT", label: "Internet Gateway", sequence: 0, score: 90 },
        { id: "n2", node_type: "APPLICATION", label: "Payment API (CVE-2024-3094)", sequence: 1, score: 92 },
        { id: "n3", node_type: "IDENTITY", label: "Domain Admin Token", sequence: 2, score: 94 },
        { id: "n4", node_type: "DATABASE", label: "Primary Payment DB", sequence: 3, score: 96 },
      ],
      edges: [],
    },
    {
      id: "path-2",
      source_node: "VPN Gateway",
      target_node: "Customer Records DB",
      target_asset_name: "Customer Records DB",
      business_service_name: "Customer Portal",
      path_score: 82.5,
      likelihood: 0.75,
      impact: 0.88,
      confidence: 0.85,
      path_length: 3,
      status: "ACTIVE" as const,
      is_blocked: false,
      financial_exposure: 12500000,
      created_at: new Date().toISOString(),
      nodes: [
        { id: "n5", node_type: "ENTRY_POINT", label: "VPN Gateway", sequence: 0, score: 85 },
        { id: "n6", node_type: "APPLICATION", label: "Staging Jumpbox", sequence: 1, score: 80 },
        { id: "n7", node_type: "DATABASE", label: "Customer Records DB", sequence: 2, score: 88 },
      ],
      edges: [],
    },
    {
      id: "path-3",
      source_node: "Public S3 Bucket",
      target_node: "K8s Production Cluster",
      target_asset_name: "K8s Production Cluster",
      business_service_name: "Microservices Core",
      path_score: 68.0,
      likelihood: 0.60,
      impact: 0.72,
      confidence: 0.8,
      path_length: 3,
      status: "INVESTIGATING" as const,
      is_blocked: false,
      financial_exposure: 7400000,
      created_at: new Date().toISOString(),
      nodes: [
        { id: "n8", node_type: "ENTRY_POINT", label: "Public S3 Bucket", sequence: 0, score: 70 },
        { id: "n9", node_type: "IDENTITY", label: "IAM Role Token", sequence: 1, score: 75 },
        { id: "n10", node_type: "ASSET", label: "K8s Production Cluster", sequence: 2, score: 80 },
      ],
      edges: [],
    },
  ];

  const filtered = displayPaths.filter((p) => {
    const matchesSearch =
      p.source_node.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.target_node.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.business_service_name && p.business_service_name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesRisk =
      riskFilter === "ALL" ||
      (riskFilter === "CRITICAL" && p.path_score >= 80) ||
      (riskFilter === "HIGH" && p.path_score >= 60 && p.path_score < 80) ||
      (riskFilter === "MEDIUM" && p.path_score < 60);

    const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;

    return matchesSearch && matchesRisk && matchesStatus;
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search entry, target asset, or service..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-8 text-xs h-9 bg-background"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={riskFilter}
            onChange={(e) => {
              setRiskFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs bg-background border border-border rounded-md px-2.5 py-1.5 h-9 text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            aria-label="Filter by risk score"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="CRITICAL">Critical (&gt;=80)</option>
            <option value="HIGH">High (60-79)</option>
            <option value="MEDIUM">Medium (&lt;60)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs bg-background border border-border rounded-md px-2.5 py-1.5 h-9 text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            aria-label="Filter by attack path status"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="BLOCKED">Blocked</option>
            <option value="MITIGATED">Mitigated</option>
            <option value="INVESTIGATING">Investigating</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="border border-border rounded-lg bg-card/60 backdrop-blur-sm overflow-x-auto shadow-xs">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border">
              <TableHead className="text-xs font-semibold">Attack Path Traversal Chain</TableHead>
              <TableHead className="text-xs font-semibold">Target Asset</TableHead>
              <TableHead className="text-xs font-semibold">Business Service</TableHead>
              <TableHead className="text-xs font-semibold text-center">Score</TableHead>
              <TableHead className="text-xs font-semibold text-right">Financial Exposure</TableHead>
              <TableHead className="text-xs font-semibold text-center">Hops</TableHead>
              <TableHead className="text-xs font-semibold text-center">Status</TableHead>
              <TableHead className="text-xs font-semibold text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-xs text-muted-foreground">
                  No attack paths match current filter criteria.
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((path) => {
                const pathId = path.id || path.path_id;
                return (
                  <TableRow
                    key={pathId}
                    className="hover:bg-muted/40 transition-colors cursor-pointer border-border"
                    onClick={() => onSelectPath?.(path)}
                  >
                    {/* Path Chain */}
                    <TableCell className="py-3 max-w-md">
                      <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] font-mono scrollbar-none">
                        <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded shrink-0">
                          {path.source_node}
                        </span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                        {path.nodes && path.nodes.length > 2 && (
                          <>
                            <span className="bg-muted px-1.5 py-0.5 rounded text-[10px] text-muted-foreground shrink-0">
                              +{path.nodes.length - 2} hops
                            </span>
                            <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                          </>
                        )}
                        <span className="bg-rose-500/10 text-rose-500 border border-rose-500/20 px-2 py-0.5 rounded shrink-0 font-semibold">
                          {path.target_node}
                        </span>
                      </div>
                    </TableCell>

                    {/* Target Asset */}
                    <TableCell className="text-xs font-medium text-foreground">
                      {path.target_asset_name || path.target_node}
                    </TableCell>

                    {/* Business Service */}
                    <TableCell className="text-xs text-muted-foreground">
                      {path.business_service_name || "Payment Services"}
                    </TableCell>

                    {/* Risk Score */}
                    <TableCell className="text-center">
                      <RiskBadge level={path.path_score >= 80 ? "CRITICAL" : path.path_score >= 60 ? "HIGH" : "MEDIUM"} />
                    </TableCell>

                    {/* Financial Exposure */}
                    <TableCell className="text-right font-mono text-xs font-bold text-emerald-500">
                      {formatCurrency(path.financial_exposure)}
                    </TableCell>

                    {/* Path Length */}
                    <TableCell className="text-center font-mono text-xs text-muted-foreground">
                      {path.path_length || (path.nodes ? path.nodes.length : 3)}
                    </TableCell>

                    {/* Status */}
                    <TableCell className="text-center">
                      <StatusBadge status={path.status} />
                    </TableCell>

                    {/* Action */}
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" asChild className="h-7 text-xs gap-1">
                        <Link href={`/attack-paths/${pathId}`}>
                          <span>Detail</span>
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Showing {filtered.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{" "}
          {Math.min(currentPage * pageSize, filtered.length)} of {filtered.length} paths
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="h-7 w-7 p-0"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <span className="px-2 font-mono">
            {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="h-7 w-7 p-0"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
