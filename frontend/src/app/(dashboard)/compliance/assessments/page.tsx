"use client";

import React, { useState } from "react";
import { useComplianceAssessments } from "@/features/compliance/hooks";
import { AssessmentsTable } from "@/features/compliance/components/AssessmentsTable";
import { AssessmentWorkflowModal } from "@/features/compliance/components/AssessmentWorkflowModal";
import { ClipboardCheck } from "lucide-react";

export default function ComplianceAssessmentsPage() {
  const { data: assessments, isLoading } = useComplianceAssessments();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <ClipboardCheck className="w-6 h-6 text-indigo-400" />
          Control Assessments
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Perform and track periodic defensive control evaluations and effectiveness scoring
        </p>
      </div>

      <AssessmentsTable
        assessments={assessments}
        isLoading={isLoading}
        onOpenNew={() => setIsModalOpen(true)}
      />

      <AssessmentWorkflowModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={(data) => {
          console.log("Submitted assessment:", data);
        }}
      />
    </div>
  );
}
