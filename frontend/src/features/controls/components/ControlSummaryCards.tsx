import React from "react";
import { SecurityControl } from "../types";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, Layers, TrendingUp, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";

interface ControlSummaryCardsProps {
  controls: SecurityControl[];
  isLoading?: boolean;
}

export function ControlSummaryCards({ controls, isLoading }: ControlSummaryCardsProps) {
  const totalControls = controls.length;
  const activeControls = controls.filter((c) => c.is_active).length;
  const avgEffectiveness = totalControls
    ? Math.round(controls.reduce((acc, c) => acc + (c.effectiveness_score || 0), 0) / totalControls)
    : 0;
  const avgCoverage = totalControls
    ? Math.round(controls.reduce((acc, c) => acc + (c.coverage_percentage || 0), 0) / totalControls)
    : 0;
  const totalAnnualCost = controls.reduce((acc, c) => acc + (c.annual_cost || 0), 0);

  const cards = [
    {
      title: "Active Security Controls",
      value: `${activeControls} / ${totalControls}`,
      subtitle: `${Math.round((activeControls / (totalControls || 1)) * 100)}% Operational Readiness`,
      icon: ShieldCheck,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/20",
    },
    {
      title: "Avg. Attenuation Effectiveness",
      value: `${avgEffectiveness}%`,
      subtitle: "Targeted threat risk reduction",
      icon: TrendingUp,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
    },
    {
      title: "Enterprise Asset Coverage",
      value: `${avgCoverage}%`,
      subtitle: "Protected digital surface area",
      icon: Layers,
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/20",
    },
    {
      title: "Annual Defensive Spend (TCO)",
      value: formatCurrency(totalAnnualCost, { currency: "INR", compact: true }),
      subtitle: "Active licenses & maintenance",
      icon: DollarSign,
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <Card key={idx} className={`border ${card.borderColor} bg-card/60 backdrop-blur-sm`}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  {card.title}
                </p>
                <h3 className="text-xl font-bold text-foreground mt-1 font-mono">
                  {isLoading ? "..." : card.value}
                </h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">{card.subtitle}</p>
              </div>
              <div className={`p-2.5 rounded-xl ${card.bgColor} ${card.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
