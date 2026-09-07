import React, { useState } from 'react';
import ScanUploadView, { type ScanSession } from './components/ScanUploadView';
import AssumptionsControl from './components/AssumptionsControl';
import Overview from './pages/Overview';
import RiskQuantification from './pages/RiskQuantification';
import InvestmentOptimization from './pages/InvestmentOptimization';
import WhatIfAnalysis from './pages/WhatIfAnalysis';
import Compliance from './pages/Compliance';
import { processScanData, formatINR } from './utils/riskUtils';
import { DEFAULT_ORG_PROFILE } from './model/features';
import { USD_INR_ASSUMPTION } from './model/engine';
import {
  LayoutDashboard,
  ShieldAlert,
  Sparkles,
  Sliders,
  Shield,
  UploadCloud,
  FileText,
  Calendar,
  Building2,
  Scale
} from 'lucide-react';

type TabType = 'overview' | 'quant' | 'opt' | 'whatif' | 'compliance';

export default function App() {
  const [session, setSession] = useState<ScanSession | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null);
  const scanResult = session?.result ?? null;

  const handleSelectFinding = (findingId: string) => {
    setSelectedFindingId(findingId);
    setActiveTab('quant');
  };

  const handleResetScan = () => {
    setSession(null);
    setSelectedFindingId(null);
    setActiveTab('overview');
  };

  /**
   * Restating an assumption rescores the scan from the raw file, not from the processed result.
   *
   * Patching the existing result would mean a second place that knows how a finding becomes a
   * rupee figure, and the two would diverge. `withAssumptions` hands back the same verified
   * artefact bound to the new profile, so this is a re-score and never a re-verification.
   */
  const handleAssumptionsChange = (next: { org?: import('./model/features').OrgProfile; usdInr?: number }) => {
    setSession((prev) => {
      if (!prev || !prev.engine) return prev;
      const engine = prev.engine.withAssumptions(next);
      return {
        ...prev,
        engine,
        result: processScanData(prev.raw, engine, prev.engineFailure),
      };
    });
  };

  const tabs: { id: TabType; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'overview',
      label: 'Overview Dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />
    },
    {
      id: 'quant',
      label: 'Risk Quantification',
      icon: <ShieldAlert className="w-4 h-4" />,
      badge: scanResult ? `${scanResult.findings.length} Findings` : undefined
    },
    {
      id: 'opt',
      label: 'Investment Optimization',
      icon: <Sparkles className="w-4 h-4 text-cyan-400" />,
      badge: 'Knapsack'
    },
    {
      id: 'whatif',
      label: 'What-If Simulation',
      icon: <Sliders className="w-4 h-4 text-teal-400" />
    },
    {
      id: 'compliance',
      label: 'Framework Compliance',
      icon: <Scale className="w-4 h-4 text-cyan-400" />,
      badge: scanResult?.crosswalk ? '5 Frameworks' : 'Unavailable'
    }
  ];

  // If no scan data is loaded yet, show the primary File Upload screen!
  // Both halves of the session are tested so the narrowing below covers the engine too — the
  // header's assumptions control needs it, and `scanResult` is derived from it.
  if (!session || !scanResult) {
    return (
      <div className="min-h-screen bg-background text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200">
        <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500 via-teal-500 to-blue-600 p-0.5 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Shield className="w-5 h-5 text-cyan-400" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold tracking-tight text-white">
                    CyberRisk <span className="text-cyan-400">Optimizer</span>
                  </h1>
                </div>
                <p className="text-[11px] text-slate-400">
                  AI-Powered Risk Quantification &amp; Security Investment Dashboard
                </p>
              </div>
            </div>

            <div className="text-xs text-slate-400 font-mono hidden sm:block">
              Standalone Client-Side Platform
            </div>
          </div>
        </header>

        <main>
          <ScanUploadView onScanProcessed={(s) => setSession(s)} />
        </main>
      </div>
    );
  }

  // Once scan data is loaded, render the full multi-tab dashboard
  return (
    <div className="min-h-screen flex flex-col bg-background text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Enterprise Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Platform Info */}
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500 via-teal-500 to-blue-600 p-0.5 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Shield className="w-5 h-5 text-cyan-400" />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold tracking-tight text-white">
                    CyberRisk <span className="text-cyan-400">Optimizer</span>
                  </h1>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1 text-slate-300 truncate max-w-[240px]">
                    <Building2 className="w-3 h-3 text-cyan-400" />
                    {scanResult.scanMetadata.organization}
                  </span>
                  <span className="text-slate-600 hidden md:inline">•</span>
                  <span className="hidden md:flex items-center gap-1 font-mono">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    Scan: {scanResult.scanMetadata.scan_date}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Status Badge & Ingest New Scan Button */}
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-[10px] text-slate-400 uppercase font-mono">Total Risk Exposure</div>
                <div className="text-sm font-extrabold text-emerald-400 font-mono">
                  {formatINR(scanResult.totalFinancialExposureInr, true)} / yr
                </div>
              </div>

              {/*
                Only offered when an engine loaded. Without one there is nothing to rebind, and a
                control that silently did nothing would be worse than its absence — the panel's own
                copy is explicit about the weaker case, where an engine exists but its model does not.
              */}
              {session.engine && (
                <AssumptionsControl
                  org={scanResult.model.org ?? DEFAULT_ORG_PROFILE}
                  usdInr={scanResult.model.usdInr ?? USD_INR_ASSUMPTION.rate}
                  modelState={scanResult.model.status.state}
                  onChange={handleAssumptionsChange}
                />
              )}

              <button
                onClick={handleResetScan}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-slate-300 font-medium transition"
                title="Upload or load another scan JSON file"
              >
                <UploadCloud className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Upload New Scan</span>
                <span className="sm:hidden">New</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs Bar */}
          <nav className="flex space-x-1 sm:space-x-2 border-t border-slate-800/80 overflow-x-auto py-2">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (tab.id !== 'quant') setSelectedFindingId(null);
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition duration-150 ${
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                        isActive
                          ? 'bg-cyan-500/20 text-cyan-200'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Screen Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && (
          <Overview data={scanResult} onSelectFinding={handleSelectFinding} />
        )}
        {activeTab === 'quant' && (
          <RiskQuantification
            findings={scanResult.findings}
            model={scanResult.model}
            totalExposureInr={scanResult.totalFinancialExposureInr}
            dataQuality={scanResult.dataQuality}
            expandedFindingId={selectedFindingId}
          />
        )}
        {activeTab === 'opt' && (
          <InvestmentOptimization data={scanResult} />
        )}
        {activeTab === 'whatif' && (
          <WhatIfAnalysis data={scanResult} />
        )}
        {activeTab === 'compliance' && (
          <Compliance data={scanResult} />
        )}
      </main>
    </div>
  );
}
