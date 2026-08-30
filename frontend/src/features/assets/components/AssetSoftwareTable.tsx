"use client";

import React from "react";
import { AssetSoftware } from "@/types/asset";
import { Layers, Package } from "lucide-react";

export interface AssetSoftwareTableProps {
  software?: AssetSoftware[];
}

export function AssetSoftwareTable({ software = [] }: AssetSoftwareTableProps) {
  if (software.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card/60 p-8 text-center">
        <Layers className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
        <div className="text-xs font-semibold text-foreground">No software components attached</div>
        <p className="text-[11px] text-muted-foreground max-w-sm mx-auto mt-1">
          Attach software packages or run an automated inventory scan to detect installed libraries and OS binaries.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="border-b border-border bg-muted/30 text-muted-foreground text-[11px] uppercase tracking-wider font-semibold">
            <tr>
              <th className="py-2.5 px-3">Software Package</th>
              <th className="py-2.5 px-3">Version</th>
              <th className="py-2.5 px-3">Vendor / Ecosystem</th>
              <th className="py-2.5 px-3">Package Manager</th>
              <th className="py-2.5 px-3">Architecture</th>
              <th className="py-2.5 px-3">Installation Path</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {software.map((sw, idx) => (
              <tr key={sw.id || idx} className="hover:bg-muted/30 transition-colors">
                <td className="py-2.5 px-3 font-semibold text-foreground">
                  <div className="flex items-center gap-1.5">
                    <Package className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>{sw.name}</span>
                  </div>
                </td>

                <td className="py-2.5 px-3 font-mono font-medium text-foreground">
                  {sw.version}
                </td>

                <td className="py-2.5 px-3 text-muted-foreground">
                  {sw.vendor || "Open Source / System"}
                </td>

                <td className="py-2.5 px-3">
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                    {sw.package_manager || "manual"}
                  </span>
                </td>

                <td className="py-2.5 px-3 font-mono text-muted-foreground">
                  {sw.architecture || "x86_64"}
                </td>

                <td className="py-2.5 px-3 font-mono text-[11px] text-muted-foreground truncate max-w-[180px]">
                  {sw.install_path || "/usr/bin"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
