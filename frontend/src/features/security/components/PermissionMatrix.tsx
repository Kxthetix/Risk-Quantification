"use client";

import React, { useState } from "react";
import { UserRole } from "@/types/user";
import { ROLE_PERMISSIONS, ALL_PERMISSIONS } from "@/lib/permissions/permissions";
import { ROLE_LABELS, ROLE_DESCRIPTIONS } from "@/lib/permissions/roles";
import { PermissionList } from "./PermissionList";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Check, X, Shield, ShieldCheck, ShieldAlert, Eye } from "lucide-react";

interface MatrixRow {
  name: string;
  category: string;
  key: string;
  viewer: boolean;
  manager: boolean;
  analyst: boolean;
  admin: boolean;
}

const MATRIX_ROWS: MatrixRow[] = [
  { name: "View Executive Dashboard", category: "Dashboard", key: "dashboard:view", viewer: true, manager: true, analyst: true, admin: true },
  { name: "Export Dashboard Reports", category: "Dashboard", key: "dashboard:export", viewer: true, manager: true, analyst: true, admin: true },
  { name: "View Asset Inventory", category: "Assets", key: "assets:view", viewer: true, manager: true, analyst: true, admin: true },
  { name: "Create & Provision Assets", category: "Assets", key: "assets:create", viewer: false, manager: false, analyst: true, admin: true },
  { name: "Edit Asset Details", category: "Assets", key: "assets:edit", viewer: false, manager: false, analyst: true, admin: true },
  { name: "Delete Assets", category: "Assets", key: "assets:delete", viewer: false, manager: false, analyst: false, admin: true },
  { name: "View Vulnerabilities", category: "Vulnerabilities", key: "vulnerabilities:view", viewer: true, manager: true, analyst: true, admin: true },
  { name: "Sync NVD / CVE Feeds", category: "Vulnerabilities", key: "vulnerabilities:sync", viewer: false, manager: false, analyst: true, admin: true },
  { name: "Trigger Automated Validation", category: "Vulnerabilities", key: "vulnerabilities:validate", viewer: false, manager: false, analyst: true, admin: true },
  { name: "View Risk Scores", category: "Risk", key: "risk:view", viewer: true, manager: true, analyst: true, admin: true },
  { name: "Recalculate Algorithmic Risk", category: "Risk", key: "risk:recalculate", viewer: false, manager: false, analyst: true, admin: true },
  { name: "Configure Risk Weights", category: "Risk", key: "risk:configure", viewer: false, manager: false, analyst: false, admin: true },
  { name: "Run Monte Carlo Simulation", category: "Financial Risk", key: "financial:simulate", viewer: false, manager: false, analyst: true, admin: true },
  { name: "Run Attack Path Graph Engine", category: "Attack Paths", key: "attack_paths:analyze", viewer: false, manager: false, analyst: true, admin: true },
  { name: "Create Remediation Task", category: "Remediation", key: "remediation:create", viewer: false, manager: true, analyst: true, admin: true },
  { name: "Manage Security Controls", category: "Controls", key: "controls:manage", viewer: false, manager: false, analyst: true, admin: true },
  { name: "Optimize Security Portfolio", category: "Investments", key: "investments:optimize", viewer: false, manager: true, analyst: true, admin: true },
  { name: "Generate Board PDF Reports", category: "Reporting", key: "reports:create", viewer: false, manager: true, analyst: true, admin: true },
  { name: "Manage Organization Users", category: "Administration", key: "users:manage", viewer: false, manager: false, analyst: false, admin: true },
  { name: "Edit Organization Parameters", category: "Administration", key: "organizations:edit", viewer: false, manager: true, analyst: false, admin: true },
];

export function PermissionMatrix() {
  const [activeTab, setActiveTab] = useState<"matrix" | "roles">("matrix");

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-xs">
          <TabsTrigger value="matrix">Matrix Grid</TabsTrigger>
          <TabsTrigger value="roles">Role Explorer</TabsTrigger>
        </TabsList>

        {/* Matrix View */}
        <TabsContent value="matrix" className="space-y-4">
          <div className="rounded-lg border border-border overflow-x-auto bg-card">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="p-3 font-semibold text-foreground">Capability / Permission</th>
                  <th className="p-3 font-semibold text-muted-foreground text-center w-28">
                    <span className="block">Viewer</span>
                    <span className="text-[10px] font-normal text-muted-foreground">Read-only</span>
                  </th>
                  <th className="p-3 font-semibold text-amber-500 text-center w-28">
                    <span className="block">Manager</span>
                    <span className="text-[10px] font-normal text-muted-foreground">Lead / Gov</span>
                  </th>
                  <th className="p-3 font-semibold text-primary text-center w-28">
                    <span className="block">Analyst</span>
                    <span className="text-[10px] font-normal text-muted-foreground">Operations</span>
                  </th>
                  <th className="p-3 font-semibold text-rose-500 text-center w-28">
                    <span className="block">Admin</span>
                    <span className="text-[10px] font-normal text-muted-foreground">Full Root</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {MATRIX_ROWS.map((row) => (
                  <tr key={row.key} className="hover:bg-muted/20 transition-colors">
                    <td className="p-3">
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{row.name}</span>
                        <span className="font-mono text-[10px] text-muted-foreground">{row.key}</span>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      {row.viewer ? (
                        <Check className="h-4 w-4 text-emerald-500 mx-auto" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {row.manager ? (
                        <Check className="h-4 w-4 text-emerald-500 mx-auto" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {row.analyst ? (
                        <Check className="h-4 w-4 text-emerald-500 mx-auto" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {row.admin ? (
                        <Check className="h-4 w-4 text-emerald-500 mx-auto" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* Role Explorer View */}
        <TabsContent value="roles" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(["ADMIN", "SECURITY_ANALYST", "MANAGER", "VIEWER"] as UserRole[]).map((role) => (
              <Card key={role} className="border-border bg-card/80">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold">{ROLE_LABELS[role]}</CardTitle>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {ROLE_PERMISSIONS[role]?.length || 0} permissions
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">{ROLE_DESCRIPTIONS[role]}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <PermissionList role={role} />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
