"use client";

import React, { useState } from "react";
import { Building2, ShieldCheck, AlertOctagon, CheckCircle2, XCircle } from "lucide-react";
import { useOrganizations, useSuspendOrganization, useActivateOrganization } from "../hooks";

export function OrganizationManagementView() {
  const { data: orgs, isLoading } = useOrganizations();
  const suspendMutation = useSuspendOrganization();
  const activateMutation = useActivateOrganization();
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSuspend = (id: string, name: string) => {
    if (confirm(`Suspend organization "${name}"? All users under this tenant will be locked out.`)) {
      suspendMutation.mutate(id, {
        onSuccess: () => {
          setSuccessMsg(`Organization "${name}" suspended.`);
          setTimeout(() => setSuccessMsg(null), 3000);
        },
      });
    }
  };

  const handleActivate = (id: string, name: string) => {
    activateMutation.mutate(id, {
      onSuccess: () => {
        setSuccessMsg(`Organization "${name}" activated.`);
        setTimeout(() => setSuccessMsg(null), 3000);
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
          <Building2 className="w-6 h-6 text-indigo-400" /> Organization Tenants
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage isolated tenant boundaries, subscription limits, and organization lifecycle states.
        </p>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm font-medium">
          {successMsg}
        </div>
      )}

      {isLoading ? (
        <div className="h-48 rounded-xl bg-slate-800/40 animate-pulse border border-slate-800" />
      ) : (
        <div className="bg-slate-900/60 rounded-xl border border-slate-800 overflow-hidden">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-850/80 text-xs font-semibold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Organization</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Users</th>
                <th className="px-4 py-3">Assets</th>
                <th className="px-4 py-3">Services</th>
                <th className="px-4 py-3">Risk Score</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {(orgs || []).map((o) => (
                <tr key={o.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-semibold text-slate-100 block">{o.name}</span>
                    <span className="text-xs text-slate-500 font-mono">{o.id}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        o.status === "ACTIVE"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      }`}
                    >
                      {o.status === "ACTIVE" ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300 font-medium">{o.users_count}</td>
                  <td className="px-4 py-3 text-slate-300 font-medium">{o.assets_count}</td>
                  <td className="px-4 py-3 text-slate-300 font-medium">{o.services_count}</td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-indigo-400">{o.risk_score}</span>
                    <span className="text-xs text-slate-500"> / 100</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {new Date(o.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {o.status === "ACTIVE" ? (
                      <button
                        onClick={() => handleSuspend(o.id, o.name)}
                        className="px-2.5 py-1 rounded bg-slate-800 text-xs text-rose-400 hover:bg-slate-700 border border-slate-700 transition-colors"
                      >
                        Suspend
                      </button>
                    ) : (
                      <button
                        onClick={() => handleActivate(o.id, o.name)}
                        className="px-2.5 py-1 rounded bg-slate-800 text-xs text-emerald-400 hover:bg-slate-700 border border-slate-700 transition-colors"
                      >
                        Activate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
