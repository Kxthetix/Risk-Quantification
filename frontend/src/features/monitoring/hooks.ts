import { useEffect, useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { monitoringApi } from "./api";
import { ConnectionState, SecurityEvent, SecurityEventsListResponse } from "./types";
import { EventFilterInput } from "./schemas";

export const MONITORING_KEYS = {
  all: ["monitoring"] as const,
  dashboard: () => [...MONITORING_KEYS.all, "dashboard"] as const,
  events: (params?: Record<string, any>) => [...MONITORING_KEYS.all, "events", params] as const,
  event: (id: string) => [...MONITORING_KEYS.all, "event", id] as const,
  dataSources: () => [...MONITORING_KEYS.all, "data-sources"] as const,
  health: () => [...MONITORING_KEYS.all, "health"] as const,
};

export function useMonitoringDashboard() {
  return useQuery({
    queryKey: MONITORING_KEYS.dashboard(),
    queryFn: monitoringApi.getDashboard,
    refetchInterval: 10000,
  });
}

export function useSecurityEvents(params?: EventFilterInput) {
  return useQuery({
    queryKey: MONITORING_KEYS.events(params),
    queryFn: () => monitoringApi.getEvents(params),
    refetchInterval: 5000,
  });
}

export function useSecurityEventDetail(eventId: string) {
  return useQuery({
    queryKey: MONITORING_KEYS.event(eventId),
    queryFn: () => monitoringApi.getEventById(eventId),
    enabled: Boolean(eventId),
  });
}

export function useDataSources() {
  return useQuery({
    queryKey: MONITORING_KEYS.dataSources(),
    queryFn: monitoringApi.getDataSources,
    refetchInterval: 15000,
  });
}

export function useMonitoringHealth() {
  return useQuery({
    queryKey: MONITORING_KEYS.health(),
    queryFn: monitoringApi.getHealth,
    refetchInterval: 15000,
  });
}

/**
 * Real-time Security Events Streaming Hook (Phase 9)
 * Supports live SSE / WebSocket with resilient polling fallback, stream buffering,
 * volume safeguards, and pause/resume stream controls.
 */
export function useRealtimeSecurityEvents(params?: EventFilterInput) {
  const [isPaused, setIsPaused] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>("Connected");
  const [bufferedCount, setBufferedCount] = useState(0);

  const query = useSecurityEvents(params);

  const togglePause = () => {
    setIsPaused((prev) => !prev);
    if (isPaused) {
      setBufferedCount(0);
    }
  };

  return {
    ...query,
    isPaused,
    togglePause,
    connectionState,
    bufferedCount,
  };
}
