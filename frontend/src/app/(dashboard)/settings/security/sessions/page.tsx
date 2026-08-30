"use client";

import React from "react";
import { SessionTable } from "@/features/security/components/SessionTable";

export default function SecuritySessionsPage() {
  return (
    <div className="space-y-6">
      <SessionTable />
    </div>
  );
}
