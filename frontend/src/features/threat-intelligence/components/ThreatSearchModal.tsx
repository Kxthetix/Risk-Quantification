"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Users, Bug, Target } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { threatIntelligenceApi } from "../api";

interface ThreatSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ThreatSearchModal({ open, onOpenChange }: ThreatSearchModalProps) {
  const [query, setQuery] = useState("");

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ["threat-search", query],
    queryFn: () => threatIntelligenceApi.globalSearch(query),
    enabled: query.length >= 2,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Search className="w-5 h-5 text-indigo-400" />
            Global Threat Intelligence Search
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Search across adversary actors, indicators of compromise, campaigns, and affected assets.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-500" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search APT29, 185.220.101.5, Cobalt Strike, LockBit..."
              className="pl-9 bg-slate-950 border-slate-700 text-slate-100 text-sm h-11"
              autoFocus
            />
          </div>

          {isLoading ? (
            <div className="py-8 text-center text-xs text-slate-500">Searching global intelligence...</div>
          ) : !searchResults ? (
            <div className="py-8 text-center text-xs text-slate-500">Type at least 2 characters to search.</div>
          ) : (
            <div className="space-y-4">
              {/* Threat Actors */}
              {searchResults.threat_actors.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    Adversaries ({searchResults.threat_actors.length})
                  </span>
                  {searchResults.threat_actors.map((actor) => (
                    <div key={actor.id} className="p-2.5 rounded bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-slate-200">{actor.name}</span>
                        <p className="text-slate-400 mt-0.5">{actor.motivation}</p>
                      </div>
                      <Badge className="bg-purple-950/50 text-purple-300 border-purple-800">
                        Risk: {actor.risk_score}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}

              {/* IOCs */}
              {searchResults.iocs.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Bug className="w-3.5 h-3.5" />
                    Indicators ({searchResults.iocs.length})
                  </span>
                  {searchResults.iocs.map((ioc) => (
                    <div key={ioc.id} className="p-2.5 rounded bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs font-mono">
                      <div>
                        <span className="font-bold text-indigo-300">{ioc.indicator}</span>
                        <p className="text-slate-400 font-sans mt-0.5">{ioc.threat_classification}</p>
                      </div>
                      <Badge className="bg-red-950/50 text-red-400 border-red-800">
                        {ioc.severity}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}

              {/* Campaigns */}
              {searchResults.campaigns.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5" />
                    Campaigns ({searchResults.campaigns.length})
                  </span>
                  {searchResults.campaigns.map((camp) => (
                    <div key={camp.id} className="p-2.5 rounded bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-200">{camp.name}</span>
                      <Badge className="bg-orange-950/50 text-orange-300 border-orange-800">
                        {camp.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
