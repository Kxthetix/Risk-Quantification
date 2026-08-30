import React from "react";
import { IntegrationDetailView } from "@/features/integrations";

export default async function IntegrationSchedulePage({
  params,
}: {
  params: Promise<{ integrationId: string }>;
}) {
  const { integrationId } = await params;
  return <IntegrationDetailView integrationId={integrationId} />;
}
