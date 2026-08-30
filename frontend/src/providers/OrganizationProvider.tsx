"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Organization } from "@/types/organization";
import { CurrencyCode } from "@/types/common";
import { organizationsApi } from "@/lib/api/organizations";
import { useAuth } from "./AuthProvider";
import { logger } from "@/lib/utils/logger";

interface OrganizationContextType {
  organization: Organization | null;
  currency: CurrencyCode;
  timezone: string;
  isLoading: boolean;
  refetchOrganization: () => Promise<void>;
  updateSettings: (settings: Partial<NonNullable<Organization["settings"]>>) => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, organizationId } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchOrg = useCallback(async () => {
    if (!isAuthenticated) {
      setOrganization(null);
      return;
    }

    setIsLoading(true);
    try {
      const org = await organizationsApi.getCurrentOrganization();
      setOrganization(org);
    } catch (err) {
      logger.error("Failed to load organization profile.", err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchOrg();
  }, [fetchOrg, organizationId]);

  const updateSettings = async (settings: Partial<NonNullable<Organization["settings"]>>) => {
    try {
      const updated = await organizationsApi.updateSettings(settings);
      setOrganization(updated);
    } catch (err) {
      logger.error("Failed to update organization settings.", err);
      throw err;
    }
  };

  const currency: CurrencyCode = organization?.settings?.default_currency || "INR";
  const timezone: string = organization?.settings?.timezone || "UTC";

  return (
    <OrganizationContext.Provider
      value={{
        organization,
        currency,
        timezone,
        isLoading,
        refetchOrganization: fetchOrg,
        updateSettings,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (!context) {
    return {
      organization: null,
      currency: "INR" as CurrencyCode,
      timezone: "UTC",
      isLoading: false,
      refetchOrganization: async () => {},
      updateSettings: async () => {},
    };
  }
  return context;
}
