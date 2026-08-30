"use client";

import React, { useState } from "react";
import { ShieldAlert, LogIn, AlertTriangle, CheckCircle2, XCircle, Globe, Laptop } from "lucide-react";
import { useSecurityEvents, useLoginActivity } from "../hooks";

export function SecurityEventsView() {
  const [tab, setTab] = useState<"events" | "logins">("events");
  const { data: securityEvents, isLoading: eventsLoading } = useSecurityEvents();
  const { data: loginActivity, isLoading: loginsLoading } = useLoginActivity();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
          <ShieldAlert className="w-6 h-6 text-rose-400" /> Security Administration & Login Monitoring
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Monitor authentication anomalies, brute force lockouts, privilege changes, and session activities.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setTab("events")}
          className={`px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
            tab === "events"
              ? "bg-slate-800 text-indigo-400 border border-indigo-500/30"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Security Events & Lockouts ({securityEvents?.length || 0})
        </button>
        <button
          onClick={() => setTab("logins")}
          className={`px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
            tab === "logins"
              ? "bg-slate-800 text-indigo-400 border border-indigo-500/30"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Login History & Sessions ({loginActivity?.length || 0})
        </button>
      </div>

      {tab === "events" ? (
        eventsLoading ? (
          <div className="h-48 rounded-xl bg-slate-800/40 animate-pulse border border-slate-800" />
        ) : (
          <div className="space-y-3">
            {(securityEvents || []).map((e) => (
              <div
                key={e.id}
                className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                      {e.event_type}
                    </span>
                    <span className="text-xs text-slate-500">{new Date(e.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-slate-200">{e.message}</p>
                  {e.ip_address && (
                    <span className="text-xs font-mono text-slate-400 block pt-1">Origin IP: {e.ip_address}</span>
                  )}
                </div>

                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    e.severity === "CRITICAL"
                      ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  }`}
                >
                  <AlertTriangle className="w-3 h-3" /> {e.severity}
                </span>
              </div>
            ))}
          </div>
        )
      ) : loginsLoading ? (
        <div className="h-48 rounded-xl bg-slate-800/40 animate-pulse border border-slate-800" />
      ) : (
        <div className="bg-slate-900/60 rounded-xl border border-slate-800 overflow-hidden">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-850/80 text-xs font-semibold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">User Email</th>
                <th className="px-4 py-3">Result</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Device / Browser</th>
                <th className="px-4 py-3">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {(loginActivity || []).map((l) => (
                <tr key={l.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 text-xs text-slate-400">{new Date(l.timestamp).toLocaleString()}</td>
                  <td className="px-4 py-3 font-medium text-slate-200">{l.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                        l.result === "SUCCESS"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      }`}
                    >
                      {l.result === "SUCCESS" ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {l.result}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300 text-xs flex items-center gap-1.5 mt-2">
                    <Globe className="w-3 h-3 text-slate-500" /> {l.location}
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    <span className="flex items-center gap-1.5">
                      <Laptop className="w-3 h-3 text-slate-500" /> {l.device}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">{l.ip_address}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
