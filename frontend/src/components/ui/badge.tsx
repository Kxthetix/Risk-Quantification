import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";
import { RiskLevel } from "@/types/risk";
import { VulnerabilitySeverity } from "@/types/vulnerability";
import { RemediationPriority } from "@/types/remediation";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        // Semantic Risk Variants
        riskLow: "border-risk-low/30 bg-risk-low/15 text-risk-low font-medium",
        riskMedium: "border-risk-medium/30 bg-risk-medium/15 text-risk-medium font-medium",
        riskHigh: "border-risk-high/30 bg-risk-high/15 text-risk-high font-medium",
        riskCritical: "border-risk-critical/30 bg-risk-critical/15 text-risk-critical font-semibold",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

// ---------------------------------------------------------------------------
// Specialized Domain Badges (Section 31)
// ---------------------------------------------------------------------------

export function RiskBadge({ level, className }: { level: RiskLevel | string; className?: string }) {
  const norm = String(level).toUpperCase();
  let variantClass = "border-muted bg-muted text-muted-foreground";

  if (norm === "LOW") variantClass = "border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400";
  else if (norm === "MEDIUM") variantClass = "border-amber-500/30 bg-amber-500/15 text-amber-600 dark:text-amber-400";
  else if (norm === "HIGH" || norm === "VERY_HIGH") variantClass = "border-orange-500/30 bg-orange-500/15 text-orange-600 dark:text-orange-400";
  else if (norm === "CRITICAL") variantClass = "border-rose-500/30 bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold";

  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold", variantClass, className)}>
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
      {norm.replace("_", " ")}
    </span>
  );
}

export function SeverityBadge({ severity, className }: { severity: VulnerabilitySeverity | string; className?: string }) {
  const norm = String(severity).toUpperCase();
  let variantClass = "border-muted bg-muted text-muted-foreground";

  if (norm === "LOW") variantClass = "border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400";
  else if (norm === "MEDIUM") variantClass = "border-amber-500/30 bg-amber-500/15 text-amber-600 dark:text-amber-400";
  else if (norm === "HIGH") variantClass = "border-orange-500/30 bg-orange-500/15 text-orange-600 dark:text-orange-400";
  else if (norm === "CRITICAL") variantClass = "border-rose-500/30 bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold";

  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold", variantClass, className)}>
      {norm}
    </span>
  );
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const norm = String(status).toUpperCase();
  let variantClass = "border-muted bg-muted text-muted-foreground";

  if (["ACTIVE", "COMPLETED", "VERIFIED", "IMPLEMENTED", "CONFIRMED"].includes(norm)) {
    variantClass = "border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400";
  } else if (["IN_PROGRESS", "VALIDATING", "PROCESSING", "PARTIAL"].includes(norm)) {
    variantClass = "border-blue-500/30 bg-blue-500/15 text-blue-600 dark:text-blue-400";
  } else if (["PENDING", "OPEN", "PLANNED", "QUEUED"].includes(norm)) {
    variantClass = "border-amber-500/30 bg-amber-500/15 text-amber-600 dark:text-amber-400";
  } else if (["FAILED", "REJECTED", "MISSING"].includes(norm)) {
    variantClass = "border-rose-500/30 bg-rose-500/15 text-rose-600 dark:text-rose-400";
  } else if (["ACCEPTED_RISK", "ACCEPTED", "FALSE_POSITIVE"].includes(norm)) {
    variantClass = "border-purple-500/30 bg-purple-500/15 text-purple-600 dark:text-purple-400";
  }

  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold", variantClass, className)}>
      {norm.replace(/_/g, " ")}
    </span>
  );
}

export function PriorityBadge({ priority, className }: { priority: RemediationPriority | string; className?: string }) {
  const norm = String(priority).toUpperCase();
  return <SeverityBadge severity={norm as VulnerabilitySeverity} className={className} />;
}

export function ConfidenceBadge({ confidence, className }: { confidence: number | string; className?: string }) {
  const score = typeof confidence === "number" ? confidence : parseFloat(confidence);
  let label = "High Confidence";
  let variantClass = "border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400";

  if (score < 50) {
    label = "Low Confidence";
    variantClass = "border-muted bg-muted text-muted-foreground";
  } else if (score < 80) {
    label = "Medium Confidence";
    variantClass = "border-amber-500/30 bg-amber-500/15 text-amber-600 dark:text-amber-400";
  }

  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", variantClass, className)}>
      {label} ({score}%)
    </span>
  );
}

export { Badge, badgeVariants };
