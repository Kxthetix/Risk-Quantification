"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useMitreTechniques } from "@/features/attack-paths/hooks";
import { MitreMatrix } from "@/features/attack-paths/components/MitreMatrix";
import { MitreTechniqueCard } from "@/features/attack-paths/components/MitreTechniqueCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Target, RefreshCw } from "lucide-react";

export default function MitreAttckPage() {
  const { data: techniques, isLoading, refetch } = useMitreTechniques();
  const [selectedTechniqueId, setSelectedTechniqueId] = useState<string | null>(null);

  const filteredTechniques = selectedTechniqueId
    ? (techniques || []).filter((t) => t.technique_id === selectedTechniqueId)
    : techniques || [];

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
              MITRE ATT&amp;CK Matrix &amp; Technique Catalog
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Adversary Tactics, Techniques, and Procedures (TTPs) mapped to real path reachability across the network.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={() => refetch()} className="text-xs h-8 gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Interactive Matrix */}
      <MitreMatrix
        techniques={techniques}
        selectedTechniqueId={selectedTechniqueId}
        onSelectTechnique={setSelectedTechniqueId}
      />

      {/* Technique Cards Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground">
            {selectedTechniqueId ? `Filtered Technique: ${selectedTechniqueId}` : "All Active Techniques"}
          </h3>
          {selectedTechniqueId && (
            <Button variant="ghost" size="sm" onClick={() => setSelectedTechniqueId(null)} className="h-7 text-xs">
              Show All
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredTechniques.map((tech) => (
            <MitreTechniqueCard key={tech.technique_id} technique={tech} />
          ))}
        </div>
      </div>
    </div>
  );
}
