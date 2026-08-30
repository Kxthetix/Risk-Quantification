"use client";

import React, { useState } from "react";
import { useComplianceEvidence } from "@/features/compliance/hooks";
import { EvidenceManagementTable } from "@/features/compliance/components/EvidenceManagementTable";
import { EvidenceUploadModal } from "@/features/compliance/components/EvidenceUploadModal";
import { FileCheck } from "lucide-react";

export default function ComplianceEvidencePage() {
  const { data: evidence, isLoading } = useComplianceEvidence();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <FileCheck className="w-6 h-6 text-indigo-400" />
          Evidence Management & Verification
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Store, verify, and monitor validity timelines for audit policies, configurations, and logs
        </p>
      </div>

      <EvidenceManagementTable
        evidence={evidence}
        isLoading={isLoading}
        onOpenUpload={() => setIsModalOpen(true)}
      />

      <EvidenceUploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={(data) => {
          console.log("Uploaded evidence:", data);
        }}
      />
    </div>
  );
}
