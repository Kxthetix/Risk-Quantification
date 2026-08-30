import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTablePagination } from "./DataTablePagination";
import { LoadingState } from "@/components/feedback/LoadingState";
import { EmptyState } from "@/components/feedback/EmptyState";
import { cn } from "@/lib/utils/cn";

export interface ColumnDef<T> {
  id: string;
  header: React.ReactNode | ((props: { column: ColumnDef<T> }) => React.ReactNode);
  cell: (props: { row: T; index: number }) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

export interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyMessage?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  // Pagination
  pagination?: {
    pageIndex: number;
    pageSize: number;
    totalItems: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
  };
  onRowClick?: (row: T) => void;
  className?: string;
}

export function DataTable<T extends { id?: string | number }>({
  columns,
  data,
  isLoading = false,
  emptyTitle = "No records found",
  emptyDescription,
  emptyMessage,
  emptyActionLabel,
  onEmptyAction,
  pagination,
  onRowClick,
  className,
}: DataTableProps<T>) {
  if (isLoading) {
    return <LoadingState type="skeleton-table" />;
  }

  const effectiveDescription =
    emptyMessage || emptyDescription || "There are no records matching your current filter criteria.";

  if (!data || data.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <EmptyState
          title={emptyTitle}
          description={effectiveDescription}
          actionLabel={emptyActionLabel}
          onAction={onEmptyAction}
        />
      </div>
    );
  }

  return (
    <div className={cn("rounded-lg border border-border bg-card shadow-sm overflow-hidden", className)}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col.id} className={cn("text-xs", col.headerClassName)}>
                {typeof col.header === "function" ? col.header({ column: col }) : col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, idx) => (
            <TableRow
              key={row.id ? String(row.id) : idx}
              onClick={() => onRowClick && onRowClick(row)}
              className={cn(
                "transition-colors",
                onRowClick && "cursor-pointer hover:bg-muted/60 active:bg-muted"
              )}
            >
              {columns.map((col) => (
                <TableCell key={col.id} className={cn("text-xs py-3", col.className)}>
                  {col.cell({ row, index: idx })}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {pagination && (
        <div className="border-t border-border bg-muted/20">
          <DataTablePagination
            pageIndex={pagination.pageIndex}
            pageSize={pagination.pageSize}
            totalItems={pagination.totalItems}
            onPageChange={pagination.onPageChange}
            onPageSizeChange={pagination.onPageSizeChange}
          />
        </div>
      )}
    </div>
  );
}
