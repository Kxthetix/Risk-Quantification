import React from "react";
import { FolderSearch, ShieldCheck, FileQuestion, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: "search" | "shield" | "file";
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon = "search",
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  let IconComponent = FolderSearch;
  if (icon === "shield") IconComponent = ShieldCheck;
  if (icon === "file") IconComponent = FileQuestion;

  return (
    <div
      className={cn(
        "flex min-h-[280px] w-full flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/50 p-8 text-center",
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-4">
        <IconComponent className="h-6 w-6" />
      </div>
      <h4 className="text-base font-semibold text-foreground mb-1">{title}</h4>
      <p className="max-w-sm text-sm text-muted-foreground mb-6 leading-relaxed">{description}</p>

      {actionLabel && onAction && (
        <Button size="sm" onClick={onAction} className="gap-2">
          <Plus className="h-4 w-4" />
          <span>{actionLabel}</span>
        </Button>
      )}
    </div>
  );
}
