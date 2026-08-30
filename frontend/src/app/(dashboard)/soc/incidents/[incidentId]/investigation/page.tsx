"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  IncidentRelationshipGraph,
  IncidentNotesSection,
  IncidentReviewModal,
  IncidentCommunicationsModal,
} from "@/features/soc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, ArrowLeft, Mail, FileText, BookOpen, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function IncidentInvestigationWarRoomPage() {
  const params = useParams();
  const router = useRouter();
  const incidentId = params.incidentId as string;

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [commModalOpen, setCommModalOpen] = useState(false);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* War Room Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push("/soc/incidents")}
            className="border-slate-800 bg-slate-900 text-slate-300 text-xs h-8"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Incidents
          </Button>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Eye className="w-5 h-5 text-indigo-400" />
              Incident Investigation War Room: {incidentId}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Live correlation topology, forensic notes, and response coordination.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setCommModalOpen(true)}
            className="border-slate-700 bg-slate-900 text-slate-300 text-xs h-8"
          >
            <Mail className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
            Dispatch Briefing
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setReviewModalOpen(true)}
            className="border-slate-700 bg-slate-900 text-slate-300 text-xs h-8"
          >
            <FileText className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
            Post-Incident Review
          </Button>

          <Link href="/soc/playbooks">
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-8">
              <BookOpen className="w-3.5 h-3.5 mr-1.5" />
              Trigger Playbook
            </Button>
          </Link>
        </div>
      </div>

      {/* Multi-Layered Relationship Graph */}
      <IncidentRelationshipGraph incidentId={incidentId} />

      {/* Investigation Notes & Evidence */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <IncidentNotesSection incidentId={incidentId} />

        {/* Action Shortcuts & Control Recalculation */}
        <div className="space-y-4">
          <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 text-xs space-y-3">
            <span className="font-bold text-slate-200">Incident Commander Checklist</span>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input type="checkbox" defaultChecked className="rounded bg-slate-950 border-slate-700 text-indigo-600" />
                <span>Initial Triage & IOC Hash Verification</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input type="checkbox" defaultChecked className="rounded bg-slate-950 border-slate-700 text-indigo-600" />
                <span>Memory Forensic RAM Image Captured</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input type="checkbox" className="rounded bg-slate-950 border-slate-700 text-indigo-600" />
                <span>Microsegmentation & Egress Lockdown</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input type="checkbox" className="rounded bg-slate-950 border-slate-700 text-indigo-600" />
                <span>Post-Incident Residual Risk Recalculated</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {reviewModalOpen && (
        <IncidentReviewModal
          incidentId={incidentId}
          open={reviewModalOpen}
          onOpenChange={setReviewModalOpen}
        />
      )}

      {commModalOpen && (
        <IncidentCommunicationsModal
          incidentId={incidentId}
          open={commModalOpen}
          onOpenChange={setCommModalOpen}
        />
      )}
    </div>
  );
}
