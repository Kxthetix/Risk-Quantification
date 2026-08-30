"use client";

import React from "react";
import Link from "next/link";
import { useCrownJewels } from "@/features/attack-paths/hooks";
import { CrownJewelsTable } from "@/features/attack-paths/components/CrownJewelsTable";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Flame, RefreshCw } from "lucide-react";

export default function CrownJewelsPage() {
  const { data, isLoading, refetch } = useCrownJewels();

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild className="h-7 w-7 p-0 -ml-1">
              <Link href="/attack-paths">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-xl font-bold text-foreground">
              Crown Jewels &amp; Critical Asset Reachability
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Monitor the organization&apos;s most sensitive databases, payment gateways, and directory servers vulnerable to multi-hop compromise.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={() => refetch()} className="text-xs h-8 gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh</span>
        </Button>
      </div>

      <CrownJewelsTable crownJewels={data} isLoading={isLoading} />
    </div>
  );
}
