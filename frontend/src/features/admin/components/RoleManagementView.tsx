"use client";

import React, { useState } from "react";
import { Shield, Key, Check, Users, Lock } from "lucide-react";
import { useRoles, usePermissions, useRole } from "../hooks";

export function RoleManagementView() {
  const { data: roles, isLoading: rolesLoading } = useRoles();
  const { data: permissions, isLoading: permsLoading } = usePermissions();
  const [selectedRole, setSelectedRole] = useState<string>("ADMIN");
  const { data: roleDetail } = useRole(selectedRole);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
          <Shield className="w-6 h-6 text-indigo-400" />
          Role & Permission Governance
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Review RBAC hierarchy, permission matrices, and authoritative access boundaries.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Roles List */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Defined Roles</h3>
          {rolesLoading ? (
            <div className="h-48 rounded-xl bg-slate-800/40 animate-pulse border border-slate-800" />
          ) : (
            <div className="space-y-2">
              {(roles || []).map((r) => (
                <button
                  key={r.role}
                  onClick={() => setSelectedRole(r.role)}
                  className={`w-full p-4 rounded-xl border text-left transition-all ${
                    selectedRole === r.role
                      ? "bg-indigo-600/10 border-indigo-500/50 text-slate-100 shadow-sm"
                      : "bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm flex items-center gap-2">
                      <Lock className="w-4 h-4 text-indigo-400" /> {r.role}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Users className="w-3 h-3" /> {r.users} users
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5 line-clamp-2">{r.description}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Permissions for Selected Role */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
            Permission Matrix for <span className="text-indigo-400">{selectedRole}</span>
          </h3>

          <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-5 space-y-4">
            <p className="text-xs text-slate-400 leading-relaxed">
              Permissions are authoritative and enforced at the API gateway and repository layers.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(permissions || []).map((p) => {
                const isGranted =
                  selectedRole === "ADMIN" ||
                  (roleDetail?.permissions || []).includes(p.permission) ||
                  (selectedRole === "SECURITY_ANALYST" && p.category === "Incidents") ||
                  p.permission.endsWith(":view");

                return (
                  <div
                    key={p.permission}
                    className={`p-3.5 rounded-xl border flex items-start gap-3 transition-colors ${
                      isGranted
                        ? "bg-slate-850/80 border-slate-700/80 text-slate-200"
                        : "bg-slate-900/40 border-slate-800/60 text-slate-500 opacity-60"
                    }`}
                  >
                    <div
                      className={`p-1 rounded-md mt-0.5 ${
                        isGranted ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-800 text-slate-600"
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="font-mono text-xs font-semibold block">{p.permission}</span>
                      <span className="text-xs text-slate-400 block mt-0.5">{p.description}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
