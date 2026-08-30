"use client";

import React, { useEffect, useState } from "react";
import { Lock, Clock, ShieldCheck, Database, Save, Check } from "lucide-react";
import { useSecurityPolicies, useUpdateSecurityPolicies } from "../hooks";

export function SecurityPoliciesView() {
  const { data: policies, isLoading } = useSecurityPolicies();
  const updateMutation = useUpdateSecurityPolicies();

  const [form, setForm] = useState({
    password_policy: {
      min_length: 12,
      complexity_required: true,
      expiration_days: 90,
      lockout_attempts: 5,
    },
    session_policy: {
      timeout_seconds: 900,
      max_duration_seconds: 86400,
      concurrent_sessions_limit: 3,
      idle_timeout_seconds: 600,
    },
    mfa_policy: {
      mfa_required: false,
      mfa_method: "TOTP",
      recovery_options_enabled: true,
      grace_period_days: 7,
    },
    data_retention_policy: {
      audit_logs_retention_years: 7,
      incidents_retention_years: 5,
      alerts_retention_days: 180,
      reports_retention_days: 365,
    },
  });
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (policies) {
      setForm({
        password_policy: { ...form.password_policy, ...policies.password_policy },
        session_policy: { ...form.session_policy, ...policies.session_policy },
        mfa_policy: { ...form.mfa_policy, ...policies.mfa_policy },
        data_retention_policy: { ...form.data_retention_policy, ...policies.data_retention_policy },
      });
    }
  }, [policies]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(form, {
      onSuccess: () => {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      },
    });
  };

  if (isLoading) {
    return <div className="h-96 rounded-xl bg-slate-800/40 animate-pulse border border-slate-800" />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <Lock className="w-6 h-6 text-indigo-400" /> Security Policies & Compliance
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Configure authentication constraints, session lifetimes, multi-factor enforcement, and data retention.
          </p>
        </div>

        <button
          type="submit"
          disabled={updateMutation.isPending}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors shadow-sm disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {updateMutation.isPending ? "Saving..." : "Save All Policies"}
        </button>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm font-medium flex items-center gap-2">
          <Check className="w-4 h-4" />
          Security governance policies saved successfully.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Password Policy */}
        <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-5 space-y-4">
          <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Lock className="w-4 h-4 text-indigo-400" /> Password Policy
          </h3>

          <div className="space-y-3 text-sm">
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">Minimum Length (Characters)</label>
              <input
                type="number"
                min={8}
                max={64}
                value={form.password_policy.min_length}
                onChange={(e) =>
                  setForm({
                    ...form,
                    password_policy: { ...form.password_policy, min_length: Number(e.target.value) },
                  })
                }
                className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200"
              />
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={form.password_policy.complexity_required}
                onChange={(e) =>
                  setForm({
                    ...form,
                    password_policy: { ...form.password_policy, complexity_required: e.target.checked },
                  })
                }
                className="w-4 h-4 rounded border-slate-700 text-indigo-600 bg-slate-900"
              />
              <span className="text-xs text-slate-300">Require complexity (Uppercase, Digits, Symbols)</span>
            </label>

            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">Password Expiration (Days)</label>
              <input
                type="number"
                min={30}
                max={365}
                value={form.password_policy.expiration_days}
                onChange={(e) =>
                  setForm({
                    ...form,
                    password_policy: { ...form.password_policy, expiration_days: Number(e.target.value) },
                  })
                }
                className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">Lockout Attempts Threshold</label>
              <input
                type="number"
                min={3}
                max={10}
                value={form.password_policy.lockout_attempts}
                onChange={(e) =>
                  setForm({
                    ...form,
                    password_policy: { ...form.password_policy, lockout_attempts: Number(e.target.value) },
                  })
                }
                className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200"
              />
            </div>
          </div>
        </div>

        {/* Session Policy */}
        <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-5 space-y-4">
          <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-400" /> Session Management Policy
          </h3>

          <div className="space-y-3 text-sm">
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">Session Inactivity Timeout (Seconds)</label>
              <input
                type="number"
                min={60}
                max={3600}
                value={form.session_policy.timeout_seconds}
                onChange={(e) =>
                  setForm({
                    ...form,
                    session_policy: { ...form.session_policy, timeout_seconds: Number(e.target.value) },
                  })
                }
                className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">Max Concurrent Sessions per User</label>
              <input
                type="number"
                min={1}
                max={10}
                value={form.session_policy.concurrent_sessions_limit}
                onChange={(e) =>
                  setForm({
                    ...form,
                    session_policy: { ...form.session_policy, concurrent_sessions_limit: Number(e.target.value) },
                  })
                }
                className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">Idle Timeout (Seconds)</label>
              <input
                type="number"
                min={60}
                max={1800}
                value={form.session_policy.idle_timeout_seconds}
                onChange={(e) =>
                  setForm({
                    ...form,
                    session_policy: { ...form.session_policy, idle_timeout_seconds: Number(e.target.value) },
                  })
                }
                className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200"
              />
            </div>
          </div>
        </div>

        {/* MFA Policy */}
        <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-5 space-y-4">
          <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Multi-Factor Authentication (MFA)
          </h3>

          <div className="space-y-3 text-sm">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={form.mfa_policy.mfa_required}
                onChange={(e) =>
                  setForm({
                    ...form,
                    mfa_policy: { ...form.mfa_policy, mfa_required: e.target.checked },
                  })
                }
                className="w-4 h-4 rounded border-slate-700 text-indigo-600 bg-slate-900"
              />
              <span className="text-xs text-slate-300 font-semibold">Mandate MFA for all organization members</span>
            </label>

            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">MFA Method</label>
              <select
                value={form.mfa_policy.mfa_method}
                onChange={(e) =>
                  setForm({
                    ...form,
                    mfa_policy: { ...form.mfa_policy, mfa_method: e.target.value },
                  })
                }
                className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200"
              >
                <option value="TOTP">Authenticator App (TOTP / Google / Microsoft)</option>
                <option value="FIDO2">Hardware Security Key (FIDO2 / WebAuthn)</option>
                <option value="EMAIL">Email Verification Code</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">Grace Period for Enrollment (Days)</label>
              <input
                type="number"
                min={0}
                max={30}
                value={form.mfa_policy.grace_period_days}
                onChange={(e) =>
                  setForm({
                    ...form,
                    mfa_policy: { ...form.mfa_policy, grace_period_days: Number(e.target.value) },
                  })
                }
                className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200"
              />
            </div>
          </div>
        </div>

        {/* Data Retention */}
        <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-5 space-y-4">
          <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Database className="w-4 h-4 text-purple-400" /> Data Retention Policies
          </h3>

          <div className="space-y-3 text-sm">
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">Immutable Audit Logs Retention (Years)</label>
              <input
                type="number"
                min={1}
                max={10}
                value={form.data_retention_policy.audit_logs_retention_years}
                onChange={(e) =>
                  setForm({
                    ...form,
                    data_retention_policy: {
                      ...form.data_retention_policy,
                      audit_logs_retention_years: Number(e.target.value),
                    },
                  })
                }
                className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">Security Incidents History (Years)</label>
              <input
                type="number"
                min={1}
                max={10}
                value={form.data_retention_policy.incidents_retention_years}
                onChange={(e) =>
                  setForm({
                    ...form,
                    data_retention_policy: {
                      ...form.data_retention_policy,
                      incidents_retention_years: Number(e.target.value),
                    },
                  })
                }
                className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">Executive Reports Retention (Days)</label>
              <input
                type="number"
                min={30}
                max={730}
                value={form.data_retention_policy.reports_retention_days}
                onChange={(e) =>
                  setForm({
                    ...form,
                    data_retention_policy: {
                      ...form.data_retention_policy,
                      reports_retention_days: Number(e.target.value),
                    },
                  })
                }
                className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200"
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
