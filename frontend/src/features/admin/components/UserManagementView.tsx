"use client";

import React, { useState } from "react";
import {
  Users,
  UserPlus,
  Shield,
  CheckCircle,
  XCircle,
  MoreVertical,
  KeyRound,
  LogOut,
  Mail,
  ShieldAlert,
} from "lucide-react";
import {
  useUsers,
  useInviteUser,
  useDisableUser,
  useEnableUser,
  useRevokeUserSessions,
} from "../hooks";
import type { UserItem } from "../types";

export function UserManagementView() {
  const { data: users, isLoading } = useUsers();
  const inviteMutation = useInviteUser();
  const disableMutation = useDisableUser();
  const enableMutation = useEnableUser();
  const revokeMutation = useRevokeUserSessions();

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: "",
    role: "SECURITY_ANALYST",
    expiration_hours: 24,
    message: "",
  });
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    inviteMutation.mutate(inviteForm, {
      onSuccess: () => {
        setShowInviteModal(false);
        setInviteForm({ email: "", role: "SECURITY_ANALYST", expiration_hours: 24, message: "" });
        setActionSuccess("Invitation dispatched successfully.");
        setTimeout(() => setActionSuccess(null), 3000);
      },
    });
  };

  const handleRevoke = (id: string, name: string) => {
    if (confirm(`Revoke all active sessions for ${name}?`)) {
      revokeMutation.mutate(id, {
        onSuccess: () => {
          setActionSuccess(`All sessions revoked for ${name}.`);
          setTimeout(() => setActionSuccess(null), 3000);
        },
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <Users className="w-6 h-6 text-indigo-400" /> User Management
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage organization users, role assignments, invitations, and active sessions.
          </p>
        </div>

        <button
          onClick={() => setShowInviteModal(true)}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors shadow-sm"
        >
          <UserPlus className="w-4 h-4" /> Invite User
        </button>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm font-medium">
          {actionSuccess}
        </div>
      )}

      {isLoading ? (
        <div className="h-64 rounded-xl bg-slate-800/40 animate-pulse border border-slate-800" />
      ) : (
        <div className="bg-slate-900/60 rounded-xl border border-slate-800 overflow-hidden">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-850/80 text-xs font-semibold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {(users || []).map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-100">{u.full_name}</td>
                  <td className="px-4 py-3 text-slate-300 font-mono text-xs">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      <Shield className="w-3 h-3" /> {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                        u.is_active
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      }`}
                    >
                      {u.is_active ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {u.is_active ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    {u.is_active ? (
                      <button
                        onClick={() => disableMutation.mutate(u.id)}
                        title="Disable account"
                        className="px-2.5 py-1 rounded bg-slate-800 text-xs text-amber-400 hover:bg-slate-700 border border-slate-700 transition-colors"
                      >
                        Disable
                      </button>
                    ) : (
                      <button
                        onClick={() => enableMutation.mutate(u.id)}
                        title="Enable account"
                        className="px-2.5 py-1 rounded bg-slate-800 text-xs text-emerald-400 hover:bg-slate-700 border border-slate-700 transition-colors"
                      >
                        Enable
                      </button>
                    )}
                    <button
                      onClick={() => handleRevoke(u.id, u.full_name)}
                      title="Revoke active sessions"
                      className="px-2.5 py-1 rounded bg-slate-800 text-xs text-rose-400 hover:bg-slate-700 border border-slate-700 transition-colors"
                    >
                      Revoke Sessions
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <Mail className="w-5 h-5 text-indigo-400" />
              Invite Team Member
            </h3>
            <p className="text-xs text-slate-400">
              An invitation token will be generated and dispatched with the assigned RBAC role.
            </p>

            <form onSubmit={handleInvite} className="space-y-3 pt-2">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Work Email</label>
                <input
                  type="email"
                  required
                  placeholder="analyst@enterprise.com"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm rounded-lg bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Assigned Role</label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm rounded-lg bg-slate-800 border border-slate-700 text-slate-200"
                >
                  <option value="VIEWER">Viewer (Read-Only Dashboards)</option>
                  <option value="SECURITY_ANALYST">Security Analyst (Triage & Response)</option>
                  <option value="MANAGER">Manager (Approvals & Risk Acceptance)</option>
                  <option value="ADMIN">Admin (Full System Governance)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Expiration</label>
                <select
                  value={inviteForm.expiration_hours}
                  onChange={(e) => setInviteForm({ ...inviteForm, expiration_hours: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 text-sm rounded-lg bg-slate-800 border border-slate-700 text-slate-200"
                >
                  <option value={24}>24 Hours</option>
                  <option value={48}>48 Hours</option>
                  <option value={72}>72 Hours</option>
                  <option value={168}>7 Days</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Custom Message (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Please complete registration to access your workspace..."
                  value={inviteForm.message}
                  onChange={(e) => setInviteForm({ ...inviteForm, message: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm rounded-lg bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-3.5 py-1.5 text-sm text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteMutation.isPending}
                  className="px-4 py-1.5 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  {inviteMutation.isPending ? "Sending..." : "Send Invitation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
