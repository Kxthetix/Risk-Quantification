"use client";

import React, { useEffect, useState } from "react";
import { WifiOff, RefreshCw } from "lucide-react";

export function NetworkStatusBanner() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div
      role="alert"
      className="sticky top-0 z-50 flex w-full items-center justify-center gap-2 bg-amber-500/90 px-4 py-2 text-xs font-semibold text-white shadow-md backdrop-blur-sm"
    >
      <WifiOff className="h-4 w-4 shrink-0" />
      <span>Connection lost. Attempting to reconnect to security analytics services...</span>
      <RefreshCw className="h-3.5 w-3.5 animate-spin shrink-0 ml-1" />
    </div>
  );
}
