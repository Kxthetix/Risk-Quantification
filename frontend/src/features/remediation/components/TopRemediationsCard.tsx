import React from "react";
import { TopRemediationItem } from "../types";
import { PRIORITY_BADGE_COLORS } from "../constants";
import { formatCurrency } from "@/lib/utils/currency";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Flame, ShieldAlert, TrendingUp, GitBranch, ArrowRight } from "lucide-react";

interface TopRemediationsCardProps {
  items: TopRemediationItem[];
  onSimulate?: (remId: string) => void;
  isLoading?: boolean;
}

export function TopRemediationsCard({ items, onSimulate, isLoading }: TopRemediationsCardProps) {
  if (items.length === 0 && !isLoading) return null;

  return (
    <Card className="border-rose-500/30 bg-gradient-to-r from-rose-500/5 via-card to-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                Top Priority Remediation Recommendations
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  Maximum Loss Reduction &amp; Chokepoints
                </span>
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Algorithmic ranking weighting CVSS/EPSS, Business Criticality, Attack Path Chokepoint breaks, and Capital Efficiency (ROSI).
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {isLoading
            ? [1, 2, 3].map((i) => (
                <div key={i} className="h-28 rounded-lg bg-muted/30 animate-pulse" />
              ))
            : items.slice(0, 3).map((item) => {
                const priorityClass =
                  PRIORITY_BADGE_COLORS[item.priority_level] || "bg-muted text-muted-foreground";

                return (
                  <div
                    key={item.id}
                    className="p-3 rounded-lg border border-border bg-card/80 flex flex-col justify-between hover:border-primary/40 transition-colors"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-black border ${priorityClass}`}>
                          {item.priority_level} ({item.priority_score.toFixed(0)})
                        </span>
                        {item.breaks_attack_path && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                            <GitBranch className="w-3 h-3" />
                            Breaks Path
                          </span>
                        )}
                      </div>

                      <h4 className="font-semibold text-xs text-foreground line-clamp-1 mt-2">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5 font-mono">
                        {item.cve_id || "VULN"} • {item.asset_name || "Enterprise Host"}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-border flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Loss Avoidance</span>
                        <span className="font-bold text-emerald-400 font-mono">
                          {formatCurrency(item.expected_loss_reduction, { currency: "INR", compact: true })}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-muted-foreground block">ROSI Multiplier</span>
                        <span className="font-bold text-primary font-mono">
                          {item.rosi_percentage.toFixed(0)}%
                        </span>
                      </div>

                      {onSimulate && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onSimulate(item.id)}
                          className="h-7 px-2 text-[11px] text-primary hover:text-primary hover:bg-primary/10 gap-1"
                        >
                          Simulate
                          <ArrowRight className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
        </div>
      </CardContent>
    </Card>
  );
}
