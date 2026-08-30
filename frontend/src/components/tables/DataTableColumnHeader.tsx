import React from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";

export interface DataTableColumnHeaderProps {
  title: string;
  isSorted?: "asc" | "desc" | false;
  onSort?: (direction: "asc" | "desc" | false) => void;
  className?: string;
}

export function DataTableColumnHeader({
  title,
  isSorted = false,
  onSort,
  className,
}: DataTableColumnHeaderProps) {
  if (!onSort) {
    return <div className={cn("text-xs font-semibold text-muted-foreground", className)}>{title}</div>;
  }

  const handleToggle = () => {
    if (isSorted === false) onSort("asc");
    else if (isSorted === "asc") onSort("desc");
    else onSort(false);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggle}
      className={cn("-ml-3 h-8 text-xs font-semibold text-muted-foreground hover:text-foreground data-[state=open]:bg-accent", className)}
    >
      <span>{title}</span>
      {isSorted === "desc" ? (
        <ArrowDown className="ml-1.5 h-3.5 w-3.5 text-foreground" />
      ) : isSorted === "asc" ? (
        <ArrowUp className="ml-1.5 h-3.5 w-3.5 text-foreground" />
      ) : (
        <ChevronsUpDown className="ml-1.5 h-3.5 w-3.5 opacity-50" />
      )}
    </Button>
  );
}
