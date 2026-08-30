"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { MobileDrawer } from "@/components/layout/MobileDrawer";
import { ErrorBoundary } from "@/components/layout/ErrorBoundary";
import { LoadingState } from "@/components/feedback/LoadingState";
import { useResponsive } from "@/hooks/useMediaQuery";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { isTablet } = useResponsive();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Auto-collapse sidebar on tablet
  useEffect(() => {
    if (isTablet) {
      setIsSidebarCollapsed(true);
    }
  }, [isTablet]);

  // Route protection
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, isAuthenticated, router, pathname]);

  if (isLoading || !isAuthenticated) {
    return <LoadingState type="page" message="Verifying session and security clearances..." />;
  }

  return (
    <div className="flex min-h-screen w-full bg-background overflow-hidden">
      {/* Mobile Navigation Drawer */}
      <MobileDrawer
        open={isMobileDrawerOpen}
        onOpenChange={setIsMobileDrawerOpen}
      />

      {/* Desktop & Tablet Sidebar */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
      />

      {/* Main App Container */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Top Header */}
        <Header onOpenMobileNav={() => setIsMobileDrawerOpen(true)} />

        {/* Scrollable Page Content with ErrorBoundary */}
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <ErrorBoundary>{children}</ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
}
