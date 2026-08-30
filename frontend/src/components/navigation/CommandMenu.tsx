"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ShieldAlert,
  Server,
  Bug,
  Network,
  CircleDollarSign,
  Wrench,
  ShieldCheck,
  FileText,
  Bell,
  Settings,
  Search,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = (action: () => void) => {
    setOpen(false);
    setSearch("");
    action();
  };

  const navItems = [
    { title: "Dashboard Overview", href: "/dashboard", icon: LayoutDashboard, category: "Navigation" },
    { title: "Cyber Risk Posture", href: "/risk", icon: ShieldAlert, category: "Navigation" },
    { title: "Financial Risk & Exposure", href: "/financial-risk", icon: CircleDollarSign, category: "Navigation" },
    { title: "Attack Paths Analysis", href: "/attack-paths", icon: Network, category: "Navigation" },
    { title: "Asset Inventory", href: "/assets", icon: Server, category: "Navigation" },
    { title: "Vulnerability Management", href: "/vulnerabilities", icon: Bug, category: "Navigation" },
    { title: "Remediation Tracker", href: "/remediation", icon: Wrench, category: "Navigation" },
    { title: "Security Controls", href: "/controls", icon: ShieldCheck, category: "Navigation" },
    { title: "Executive Reports", href: "/reports", icon: FileText, category: "Navigation" },
    { title: "System Alerts", href: "/alerts", icon: Bell, category: "Navigation" },
    { title: "Platform Settings", href: "/settings", icon: Settings, category: "Navigation" },
  ];

  const filteredItems = navItems.filter((item) =>
    item.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative flex h-9 w-full items-center justify-between rounded-md border border-input bg-muted/30 px-3 text-xs text-muted-foreground transition-colors hover:bg-muted/60 sm:w-64 lg:w-72"
        aria-label="Search and quick commands"
      >
        <div className="flex items-center gap-2">
          <Search className="h-3.5 w-3.5" />
          <span className="truncate">Search assets, risks, CVEs...</span>
        </div>
        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="overflow-hidden p-0 max-w-lg shadow-2xl border-border">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Type a command or search platform resources..."
              className="border-0 shadow-none focus-visible:ring-0 h-12 text-sm"
              autoFocus
            />
          </div>

          <div className="max-h-[300px] overflow-y-auto p-2">
            {filteredItems.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                No matching results found for "{search}".
              </div>
            ) : (
              <div className="space-y-1">
                <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Quick Navigation
                </div>
                {filteredItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.href}
                      onClick={() => runCommand(() => router.push(item.href))}
                      className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-xs font-medium text-foreground hover:bg-accent transition-colors"
                    >
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span>{item.title}</span>
                      <span className="ml-auto text-[10px] text-muted-foreground">{item.category}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
