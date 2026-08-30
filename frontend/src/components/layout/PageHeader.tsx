import React from "react";
import { Breadcrumbs, BreadcrumbItem } from "./Breadcrumbs";
import { cn } from "@/lib/utils/cn";

export interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  filters?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  badge,
  actions,
  filters,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("space-y-4 pb-6 pt-2", className)}>
      {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
            {badge}
          </div>
          {description && <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">{description}</p>}
        </div>

        {actions && <div className="flex items-center gap-2.5 flex-wrap shrink-0">{actions}</div>}
      </div>

      {filters && <div className="pt-2">{filters}</div>}
    </div>
  );
}
