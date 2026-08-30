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
import { RiskBadge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils/currency";
import { Globe, ShieldAlert, Search, ExternalLink, ArrowRight, Server } from "lucide-react";
import { EntryPointItem } from "../types";

export interface EntryPointsTableProps {
  entryPoints?: EntryPointItem[];
  isLoading?: boolean;
}

export function EntryPointsTable({ entryPoints = [], isLoading = false }: EntryPointsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const defaultPoints: EntryPointItem[] = [
    { id: "ep-1", name: "External WAF / Reverse Proxy", exposure_type: "Internet-Facing API Gateway", asset_name: "DMZ-WAF-01", vulnerabilities_count: 2, attack_paths_count: 8, risk_score: 92.4, financial_exposure: 28000000, criticality: "CRITICAL" },
    { id: "ep-2", name: "Corporate VPN Gateway", exposure_type: "Remote Access Service", asset_name: "VPN-Concentrator-HQ", vulnerabilities_count: 1, attack_paths_count: 6, risk_score: 88.0, financial_exposure: 18500000, criticality: "CRITICAL" },
    { id: "ep-3", name: "Customer Auth Portal", exposure_type: "Public Web Application", asset_name: "Web-App-Prod", vulnerabilities_count: 3, attack_paths_count: 5, risk_score: 78.5, financial_exposure: 12000000, criticality: "HIGH" },
    { id: "ep-4", name: "Public S3 Asset Bucket", exposure_type: "Cloud Storage Endpoint", asset_name: "AWS-S3-Static", vulnerabilities_count: 1, attack_paths_count: 3, risk_score: 65.0, financial_exposure: 6400000, criticality: "HIGH" },
    { id: "ep-5", name: "Partner REST API Gateway", exposure_type: "Third-Party Integration", asset_name: "B2B-Partner-API", vulnerabilities_count: 0, attack_paths_count: 2, risk_score: 54.0, financial_exposure: 4200000, criticality: "MEDIUM" },
  ];

  const points = entryPoints.length > 0 ? entryPoints : defaultPoints;

  const filtered = points.filter(
    (ep) =>
      ep.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ep.exposure_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ep.asset_name && ep.asset_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search entry points or assets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 text-xs h-9 bg-background"
          />
        </div>
      </div>

      <div className="border border-border rounded-lg bg-card/60 backdrop-blur-sm overflow-x-auto shadow-xs">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border">
              <TableHead className="text-xs font-semibold">Entry Point Name</TableHead>
              <TableHead className="text-xs font-semibold">Exposure Type</TableHead>
              <TableHead className="text-xs font-semibold">Underlying Asset</TableHead>
              <TableHead className="text-xs font-semibold text-center">Vulnerabilities</TableHead>
              <TableHead className="text-xs font-semibold text-center">Enabled Attack Paths</TableHead>
              <TableHead className="text-xs font-semibold text-center">Risk Score</TableHead>
              <TableHead className="text-xs font-semibold text-right">Financial Exposure</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-28 text-center text-xs text-muted-foreground">
                  No entry points found matching search criteria.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((ep) => (
                <TableRow key={ep.id} className="hover:bg-muted/40 transition-colors border-border">
                  <TableCell className="text-xs font-semibold text-foreground">
                    <div className="flex items-center gap-2">
                      <Globe className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      <span>{ep.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {ep.exposure_type}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-primary">
                    {ep.asset_name || "Perimeter Gateway"}
                  </TableCell>
                  <TableCell className="text-center font-mono text-xs">
                    {ep.vulnerabilities_count > 0 ? (
                      <span className="text-rose-400 font-bold">
                        {ep.vulnerabilities_count} open
                      </span>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center font-mono text-xs font-bold text-foreground">
                    {ep.attack_paths_count}
                  </TableCell>
                  <TableCell className="text-center">
                    <RiskBadge level={ep.risk_score >= 80 ? "CRITICAL" : ep.risk_score >= 60 ? "HIGH" : "MEDIUM"} />
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs font-bold text-emerald-500">
                    {formatCurrency(ep.financial_exposure)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
