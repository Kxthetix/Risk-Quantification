"use client";

import React, { useState } from "react";
import { Megaphone, Plus, AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import { useAnnouncements, useCreateAnnouncement } from "../hooks";

export function AnnouncementsView() {
  const { data: announcements, isLoading } = useAnnouncements();
  const createMutation = useCreateAnnouncement();

  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(
      { title, message, is_active: true },
      {
        onSuccess: () => {
          setShowModal(false);
          setTitle("");
          setMessage("");
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <Megaphone className="w-6 h-6 text-indigo-400" /> System Announcements & Maintenance
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Broadcast platform-wide alerts, scheduled maintenance notices, and security advisories.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> New Announcement
        </button>
      </div>

      {isLoading ? (
        <div className="h-48 rounded-xl bg-slate-800/40 animate-pulse border border-slate-800" />
      ) : (
        <div className="space-y-3">
          {(announcements || []).map((a) => (
            <div
              key={a.id}
              className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-semibold text-slate-100">{a.title}</h4>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                      a.is_active
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-slate-700/30 text-slate-400 border border-slate-700/40"
                    }`}
                  >
                    {a.is_active ? "Published" : "Draft"}
                  </span>
                </div>
                <p className="text-sm text-slate-300">{a.message}</p>
                <span className="text-xs text-slate-500 block pt-1">
                  Scheduled start: {a.scheduled_start ? new Date(a.scheduled_start).toLocaleString() : "Immediate"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-semibold text-slate-100">Create System Announcement</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Headline</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Scheduled Maintenance Window"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm rounded-lg bg-slate-800 border border-slate-700 text-slate-200"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Message Content</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Details regarding the maintenance..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm rounded-lg bg-slate-800 border border-slate-700 text-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-1.5 text-sm text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-1.5 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-500"
                >
                  Publish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
