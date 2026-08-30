"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAttackPaths } from "@/features/attack-paths/hooks";
import { AttackPathComparison } from "@/features/attack-paths/components/AttackPathComparison";
import { Button } from "@/components/ui/button";
import { ArrowLeft, GitCompare, RefreshCw } from "lucide-react";
import { AttackPath } from "@/features/attack-paths/types";

export default function AttackPathComparePage() {
  const { data: pathsResponse } = useAttackPaths({ limit: 10 });
  const [selectedPathIds, setSelectedPathIds] = useState<string[]>([]);

  const paths = pathsResponse?.paths || [];

  const handleToggle = (id: string) => {
    setSelectedPathIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const selectedPaths = paths.filter((p) => selectedPathIds.includes(p.id));

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild className="h-7 w-7 p-0 -ml-1">
              <Link href="/attack-paths">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-xl font-bold text-foreground">
              Attack Path Comparative Analysis
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Select and compare multiple adversarial routes side by side to evaluate critical chokepoints.
          </p>
        </div>
      </div>

      {/* Path Selector Bar */}
      <div className="p-4 rounded-lg border border-border bg-card/70 space-y-2 text-xs">
        <span className="font-semibold text-foreground block">
          Select Paths to Compare (up to 3):
        </span>
        <div className="flex flex-wrap gap-2">
          {paths.slice(0, 8).map((p) => {
            const isSelected = selectedPathIds.includes(p.id);
            return (
              <Button
                key={p.id}
                variant={isSelected ? "secondary" : "outline"}
                size="sm"
                onClick={() => handleToggle(p.id)}
                className={`text-xs h-7 gap-1 font-mono ${
                  isSelected ? "bg-primary/20 text-primary border-primary" : ""
                }`}
              >
                <span>{p.source_node} → {p.target_node}</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Comparison View */}
      <AttackPathComparison
        paths={selectedPaths.length > 0 ? selectedPaths : paths.slice(0, 3)}
      />
    </div>
  );
}
