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
  ShieldAlert,
  Search,
  ExternalLink,
  Trash2,
  GitCompare,
  Plus,
  Play,
  Layers,
} from "lucide-react";
import { ThreatScenario } from "../types";
import { useDeleteThreatScenario } from "../hooks";

export interface ThreatScenarioTableProps {
  scenarios?: ThreatScenario[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function ThreatScenarioTable({
  scenarios = [],
  isLoading = false,
  onRefresh,
}: ThreatScenarioTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const deleteScenario = useDeleteThreatScenario();

  const defaultScenarios: ThreatScenario[] = [
    {
      id: "sc-1",
      organization_id: "org-1",
      name: "Ransomware Extortion via Exposed VPN Gateway",
      attacker_profile: "RANSOMWARE_ACTOR",
      objective: "Financial Extortion & Database Encryption",
      entry_point: "VPN Gateway (CVE-2024-3094)",
      target_asset_name: "Primary Payment DB",
      probability: 0.72,
      confidence: 0.88,
      risk_score: 91.5,
      status: "ACTIVE",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "sc-2",
      organization_id: "org-1",
      name: "Nation-State Cyber Espionage & PII Exfiltration",
      attacker_profile: "NATION_STATE",
      objective: "Covert Data Theft",
      entry_point: "DMZ WAF Reverse Proxy",
      target_asset_name: "Customer PII Store",
      probability: 0.45,
      confidence: 0.90,
      risk_score: 84.0,
      status: "ACTIVE",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "sc-3",
      organization_id: "org-1",
      name: "Insider Threat Privilege Escalation to Domain Admin",
      attacker_profile: "INSIDER_THREAT",
      objective: "Unauthorized Administrative Tampering",
      entry_point: "Developer Staging Jumpbox",
      target_asset_name: "Active Directory Domain Controller",
      probability: 0.35,
      confidence: 0.75,
      risk_score: 72.0,
      status: "INVESTIGATING",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const list = scenarios.length > 0 ? scenarios : defaultScenarios;

  const filtered = list.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.target_asset_name && s.target_asset_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.entry_point && s.entry_point.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this threat scenario?")) {
      await deleteScenario.mutateAsync(id);
      onRefresh?.();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search scenarios by name, entry, target..."
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
              <TableHead className="text-xs font-semibold">Scenario Name</TableHead>
              <TableHead className="text-xs font-semibold">Attacker Profile</TableHead>
              <TableHead className="text-xs font-semibold">Entry Point</TableHead>
              <TableHead className="text-xs font-semibold">Target Asset</TableHead>
              <TableHead className="text-xs font-semibold text-center">Likelihood</TableHead>
              <TableHead className="text-xs font-semibold text-center">Risk Score</TableHead>
              <TableHead className="text-xs font-semibold text-center">Status</TableHead>
              <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-28 text-center text-xs text-muted-foreground">
                  No threat scenarios modeled yet.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((scenario) => (
                <TableRow key={scenario.id} className="hover:bg-muted/40 transition-colors border-border">
                  <TableCell className="text-xs font-semibold text-foreground max-w-xs">
                    <div className="truncate font-medium">{scenario.name}</div>
                    {scenario.objective && (
                      <div className="text-[10px] text-muted-foreground truncate mt-0.5">
                        {scenario.objective}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-purple-400">
                    {scenario.attacker_profile.replace("_", " ")}
                  </TableCell>
                  <TableCell className="text-xs text-amber-500 font-mono">
                    {scenario.entry_point || "Internet Gateway"}
                  </TableCell>
                  <TableCell className="text-xs font-medium text-foreground">
                    {scenario.target_asset_name || "Payment Database"}
                  </TableCell>
                  <TableCell className="text-center font-mono text-xs font-semibold text-foreground">
                    {Math.round(scenario.probability * 100)}%
                  </TableCell>
                  <TableCell className="text-center">
                    <RiskBadge level={scenario.risk_score >= 80 ? "CRITICAL" : "HIGH"} />
                  </TableCell>
                  <TableCell className="text-center">
                    <StatusBadge status={scenario.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" asChild className="h-7 text-xs gap-1">
                        <Link href={`/threat-models/${scenario.id}`}>
                          <span>Detail</span>
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(scenario.id)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-500"
                        title="Delete Scenario"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
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
