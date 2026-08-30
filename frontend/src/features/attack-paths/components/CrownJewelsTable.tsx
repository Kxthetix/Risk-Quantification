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
import { Database, Search, ExternalLink, ShieldAlert, ArrowRight, Server, Flame } from "lucide-react";
import { CrownJewelItem } from "../types";

export interface CrownJewelsTableProps {
  crownJewels?: CrownJewelItem[];
  isLoading?: boolean;
}

export function CrownJewelsTable({ crownJewels = [], isLoading = false }: CrownJewelsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const defaultJewels: CrownJewelItem[] = [
    { asset_id: "ast-1", asset_name: "Primary Production Payment DB", asset_type: "DATABASE", criticality: "CRITICAL", business_service: "Payment Transaction Core", business_value: 50000000, financial_exposure: 38500000, attack_paths_count: 8, shortest_path_length: 3, highest_risk_score: 94.2 },
    { asset_id: "ast-2", asset_name: "Customer PII Database", asset_type: "DATABASE", criticality: "CRITICAL", business_service: "Customer CRM", business_value: 40000000, financial_exposure: 26000000, attack_paths_count: 6, shortest_path_length: 3, highest_risk_score: 88.5 },
    { asset_id: "ast-3", asset_name: "Active Directory Domain Controller", asset_type: "SERVER", criticality: "CRITICAL", business_service: "Corporate Identity & Access", business_value: 35000000, financial_exposure: 21000000, attack_paths_count: 7, shortest_path_length: 2, highest_risk_score: 92.0 },
    { asset_id: "ast-4", asset_name: "AWS Root IAM & KMS Keyring", asset_type: "CLOUD_RESOURCE", criticality: "CRITICAL", business_service: "Cloud Infrastructure", business_value: 60000000, financial_exposure: 45000000, attack_paths_count: 4, shortest_path_length: 4, highest_risk_score: 86.0 },
    { asset_id: "ast-5", asset_name: "Core Swift Payment Gateway", asset_type: "APPLICATION", criticality: "HIGH", business_service: "Interbank Settlement", business_value: 30000000, financial_exposure: 18000000, attack_paths_count: 5, shortest_path_length: 3, highest_risk_score: 79.5 },
  ];

  const jewels = crownJewels.length > 0 ? crownJewels : defaultJewels;

  const filtered = jewels.filter(
    (cj) =>
      cj.asset_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cj.business_service && cj.business_service.toLowerCase().includes(searchTerm.toLowerCase())) ||
      cj.asset_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search crown jewel targets..."
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
              <TableHead className="text-xs font-semibold">Crown Jewel Asset</TableHead>
              <TableHead className="text-xs font-semibold">Type</TableHead>
              <TableHead className="text-xs font-semibold">Business Service</TableHead>
              <TableHead className="text-xs font-semibold text-center">Shortest Path</TableHead>
              <TableHead className="text-xs font-semibold text-center">Active Paths</TableHead>
              <TableHead className="text-xs font-semibold text-center">Max Risk</TableHead>
              <TableHead className="text-xs font-semibold text-right">Financial Exposure</TableHead>
              <TableHead className="text-xs font-semibold text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-28 text-center text-xs text-muted-foreground">
                  No crown jewel targets found matching search criteria.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((cj) => (
                <TableRow key={cj.asset_id} className="hover:bg-muted/40 transition-colors border-border">
                  <TableCell className="text-xs font-semibold text-foreground">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded bg-rose-500/10 text-rose-500">
                        <Flame className="h-3.5 w-3.5" />
                      </div>
                      <span>{cj.asset_name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground">
                    {cj.asset_type}
                  </TableCell>
                  <TableCell className="text-xs text-foreground">
                    {cj.business_service || "Core Infrastructure"}
                  </TableCell>
                  <TableCell className="text-center font-mono text-xs font-bold text-amber-400">
                    {cj.shortest_path_length} hops
                  </TableCell>
                  <TableCell className="text-center font-mono text-xs font-bold text-rose-400">
                    {cj.attack_paths_count} paths
                  </TableCell>
                  <TableCell className="text-center">
                    <RiskBadge level={cj.highest_risk_score >= 80 ? "CRITICAL" : "HIGH"} />
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs font-bold text-emerald-500">
                    {formatCurrency(cj.financial_exposure)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild className="h-7 text-xs gap-1">
                      <Link href={`/assets/${cj.asset_id}`}>
                        <span>Asset</span>
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </Button>
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
