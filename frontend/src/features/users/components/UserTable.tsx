"use client";

import React, { useState } from "react";
import { User, UserRole } from "@/types/user";
import { ROLE_LABELS } from "@/lib/permissions/roles";
import { UserStatusBadge } from "./UserStatusBadge";
import { RoleSelector } from "./RoleSelector";
import { UserDetailsDialog } from "./UserDetailsDialog";
import { SuspendUserDialog } from "./SuspendUserDialog";
import { DeleteUserDialog } from "./DeleteUserDialog";
import { useUsers, useReactivateUser } from "../hooks";
import { useAuth } from "@/providers/AuthProvider";
import { useDebounce } from "@/hooks/useDebounce";
import { DataTable } from "@/components/tables/DataTable";
import { DataTableToolbar } from "@/components/tables/DataTableToolbar";
import { Button } from "@/components/ui/button";
import { Can } from "@/components/auth/Can";
import { formatDate, formatRelativeTime } from "@/lib/utils/date";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Eye,
  Shield,
  UserX,
  UserCheck,
  Trash2,
  Filter,
} from "lucide-react";

export function UserTable() {
  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 400);

  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Dialog states
  const [detailsUser, setDetailsUser] = useState<User | null>(null);
  const [roleUser, setRoleUser] = useState<User | null>(null);
  const [suspendUser, setSuspendUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);

  const reactivateMutation = useReactivateUser();

  const { data: users = [], isLoading, isError, refetch } = useUsers({
    search: debouncedSearch || undefined,
  });

  // Client-side filtering for immediate snappy response
  const filteredUsers = users.filter((u) => {
    if (roleFilter !== "ALL" && u.role !== roleFilter) return false;
    if (statusFilter !== "ALL" && u.status !== statusFilter) return false;
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      const matchName = u.full_name?.toLowerCase().includes(q);
      const matchEmail = u.email.toLowerCase().includes(q);
      if (!matchName && !matchEmail) return false;
    }
    return true;
  });

  const columns = [
    {
      id: "user",
      header: "Team Member",
      cell: ({ row }: { row: User }) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
            {row.full_name?.charAt(0) || row.email.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-foreground text-xs">
              {row.full_name || "Unnamed User"}
              {row.id === currentUser?.id && (
                <span className="ml-2 text-[10px] text-muted-foreground font-normal">(You)</span>
              )}
            </span>
            <span className="text-[11px] text-muted-foreground font-mono">{row.email}</span>
          </div>
        </div>
      ),
    },
    {
      id: "role",
      header: "Platform Role",
      cell: ({ row }: { row: User }) => (
        <span className="text-xs font-semibold text-primary">
          {ROLE_LABELS[row.role] || row.role}
        </span>
      ),
    },
    {
      id: "status",
      header: "Account Status",
      cell: ({ row }: { row: User }) => <UserStatusBadge status={row.status} />,
    },
    {
      id: "created",
      header: "Member Since",
      cell: ({ row }: { row: User }) => (
        <span className="text-xs text-muted-foreground">{formatDate(row.created_at)}</span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }: { row: User }) => {
        const isSelf = row.id === currentUser?.id;
        const isSuspended = row.status === "SUSPENDED";

        return (
          <div className="flex items-center justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem
                  onClick={() => setDetailsUser(row)}
                  className="gap-2 text-xs cursor-pointer"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>View Details</span>
                </DropdownMenuItem>

                <Can permission="users:manage">
                  {!isSelf && (
                    <>
                      <DropdownMenuItem
                        onClick={() => setRoleUser(row)}
                        className="gap-2 text-xs cursor-pointer"
                      >
                        <Shield className="h-3.5 w-3.5" />
                        <span>Change Role</span>
                      </DropdownMenuItem>

                      {isSuspended ? (
                        <DropdownMenuItem
                          onClick={() => reactivateMutation.mutate(row.id)}
                          className="gap-2 text-xs text-emerald-500 cursor-pointer"
                        >
                          <UserCheck className="h-3.5 w-3.5" />
                          <span>Reactivate Account</span>
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onClick={() => setSuspendUser(row)}
                          className="gap-2 text-xs text-amber-500 cursor-pointer"
                        >
                          <UserX className="h-3.5 w-3.5" />
                          <span>Suspend Account</span>
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuSeparator />

                      <DropdownMenuItem
                        onClick={() => setDeleteUser(row)}
                        className="gap-2 text-xs text-rose-500 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete User</span>
                      </DropdownMenuItem>
                    </>
                  )}
                </Can>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <DataTableToolbar
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search users by name or email..."
        />

        <div className="flex items-center gap-2">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="flex h-9 rounded-md border border-input bg-transparent px-2.5 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Filter by role"
          >
            <option value="ALL" className="bg-popover text-popover-foreground">
              All Roles
            </option>
            <option value="ADMIN" className="bg-popover text-popover-foreground">
              Admin
            </option>
            <option value="SECURITY_ANALYST" className="bg-popover text-popover-foreground">
              Analyst
            </option>
            <option value="MANAGER" className="bg-popover text-popover-foreground">
              Manager
            </option>
            <option value="VIEWER" className="bg-popover text-popover-foreground">
              Viewer
            </option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex h-9 rounded-md border border-input bg-transparent px-2.5 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Filter by status"
          >
            <option value="ALL" className="bg-popover text-popover-foreground">
              All Statuses
            </option>
            <option value="ACTIVE" className="bg-popover text-popover-foreground">
              Active
            </option>
            <option value="INVITED" className="bg-popover text-popover-foreground">
              Invited
            </option>
            <option value="SUSPENDED" className="bg-popover text-popover-foreground">
              Suspended
            </option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <DataTable
        columns={columns}
        data={filteredUsers}
        isLoading={isLoading}
        emptyMessage="No organization users found matching the selected criteria."
      />

      {/* Modals & Dialogs */}
      {detailsUser && (
        <UserDetailsDialog
          user={detailsUser}
          open={!!detailsUser}
          onOpenChange={(open) => !open && setDetailsUser(null)}
        />
      )}

      {roleUser && (
        <RoleSelector
          userId={roleUser.id}
          userName={roleUser.full_name || roleUser.email}
          currentRole={roleUser.role}
          open={!!roleUser}
          onOpenChange={(open) => !open && setRoleUser(null)}
        />
      )}

      {suspendUser && (
        <SuspendUserDialog
          userId={suspendUser.id}
          userName={suspendUser.full_name || suspendUser.email}
          open={!!suspendUser}
          onOpenChange={(open) => !open && setSuspendUser(null)}
        />
      )}

      {deleteUser && (
        <DeleteUserDialog
          userId={deleteUser.id}
          userName={deleteUser.full_name || deleteUser.email}
          userEmail={deleteUser.email}
          open={!!deleteUser}
          onOpenChange={(open) => !open && setDeleteUser(null)}
        />
      )}
    </div>
  );
}
