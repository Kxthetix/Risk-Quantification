import React from "react";
import { Remediation } from "../types";
import { Card, CardContent } from "@/components/ui/card";
import { Wrench, AlertTriangle, TrendingDown, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";

interface RemediationSummaryCardsProps {
  remediations: Remediation[];
  isLoading?: boolean;
}

export function RemediationSummaryCards({
  remediations,
  isLoading,
}: RemediationSummaryCardsProps) {
  const total = remediations.length;
  const openCount = remediations.filter(
    (r) => r.status === "OPEN" || r.status === "PLANNED" || r.status === "IN_PROGRESS"
  ).length;
  const verifiedCount = remediations.filter((r) => r.status === "VERIFIED").length;
  const criticalCount = remediations.filter(
    (r) => r.priority_level === "CRITICAL" && r.status !== "VERIFIED"
  ).length;

  const totalLossReduction = remediations.reduce(
    (acc, r) => acc + (r.expected_loss_reduction || 0),
    0
  );

  const cards = [
    {
      title: "Open Remediation Tasks",
      value: `${openCount} / ${total}`,
      subtitle: `${verifiedCount} Verified Closures`,
      icon: Wrench,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
    },
    {
      title: "Critical Priority SLA",
      value: criticalCount.toString(),
      subtitle: "Highest exploit & attack path risk",
      icon: AlertTriangle,
      color: "text-rose-400",
      bgColor: "bg-rose-500/10",
      borderColor: "border-rose-500/20",
    },
    {
      title: "Projected Loss Reduction",
      value: formatCurrency(totalLossReduction, { currency: "INR", compact: true }),
      subtitle: "Total cyber loss avoidance",
      icon: TrendingDown,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/20",
    },
    {
      title: "Average Mitigation ROSI",
      value: "+1,420%",
      subtitle: "Financial efficiency multiplier",
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
