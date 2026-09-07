import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  Sparkles,
  ShieldAlert,
  Database,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Cpu,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { ScanData, processScanData, ProcessedScanResult, ScanRejected, validateAndNormalizeScan } from '../utils/riskUtils';
import type { RiskEngine } from '../model/engine';
import { loadRiskEngine } from '../model/engine';

/**
 * What the app holds after an ingest, rather than the processed result alone.
 *
 * The result is a snapshot taken under one set of assumptions. Re-deriving it when the operator
 * states a different organisation profile or exchange rate needs the raw scan and the engine that
 * scored it, so both travel with it. Keeping the engine here also means a change of assumption
 * never re-fetches or re-verifies an artefact.
 */
export interface ScanSession {
  raw: ScanData;
  engine: RiskEngine | null;
  engineFailure: string | null;
  result: ProcessedScanResult;
}

interface ScanUploadViewProps {
  onScanProcessed: (session: ScanSession) => void;
}

/**
 * The engine fetches and verifies three JSON artefacts, so it is loaded once per page rather
 * than once per upload. A failed load resolves to null instead of rejecting: the platform's
 * documented behaviour without a model is to fall back to the deterministic formula and say
 * so on screen, which is a working state, not an error state.
 *
 * `loadRiskEngine` now handles every model-artefact failure itself, returning `state: 'absent'`
 * or `state: 'rejected'` with detail. So the only thing that still reaches this catch is a
 * crosswalk that would not load — the framework mapping is a bundled asset, so that means a
 * broken deployment. The reason is kept and passed on rather than discarded, because "the risk
 * engine was not loaded" with no cause attached is the sort of message that gets ignored.
 */
let enginePromise: Promise<RiskEngine | null> | null = null;
let engineFailure: string | null = null;
function getRiskEngine(): Promise<RiskEngine | null> {
  if (!enginePromise) {
    enginePromise = loadRiskEngine().catch((err: unknown) => {
      engineFailure = err instanceof Error ? err.message : String(err);
      return null;
    });
  }
  return enginePromise;
}

export default function ScanUploadView({ onScanProcessed }: ScanUploadViewProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [schemaProblems, setSchemaProblems] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Each line names something the pipeline actually does. The previous copy claimed
  // "real-time EPSS telemetry", which the platform does not have — EPSS values arrive in the
  // scan file, and overstating that in the loading screen is the kind of small dishonesty
  // that makes a reviewer distrust the figures that follow.
  const steps = [
    'Parsing asset inventory & business criticality weights...',
    'Verifying model artefacts against their parity fixture...',
    'Scoring findings: P(exploitation | 365d) and loss distribution...',
    'Computing Expected Annual Loss (EAL) and optimization vectors...'
  ];

  const handleJsonData = (rawText: string) => {
    try {
      setErrorMessage(null);
      setSchemaProblems([]);
      let parsed: unknown;
      try {
        parsed = JSON.parse(rawText);
      } catch (err) {
        // JSON.parse's own message ("Unexpected token } in JSON at position 812") is the most
        // useful thing available, so it is passed through rather than replaced with something
        // friendlier and less actionable.
        throw new Error(
          `This file is not valid JSON. ${err instanceof Error ? err.message : String(err)}`
        );
      }

      // Validated before the animation rather than inside it. `processScanData` validates too —
      // it is the one door, and the harnesses go through it — but a file that can never be read
      // should not spend 1.6 seconds pretending to be analysed first.
      validateAndNormalizeScan(parsed);
      const scan = parsed as ScanData;

      // Trigger animated 1.6s AI analysis transition
      setIsAnalyzing(true);
      setAnalysisStep(0);

      const interval = setInterval(() => {
        setAnalysisStep((prev) => {
          if (prev < steps.length - 1) return prev + 1;
          clearInterval(interval);
          return prev;
        });
      }, 350);

      // The 1.6s transition is cosmetic, so model loading and verification hide inside it at
      // no cost to the user. Waiting on both means a slow first load extends the animation
      // rather than showing heuristic numbers that get replaced a moment later.
      const minimumDelay = new Promise<void>((resolve) => setTimeout(resolve, 1600));
      Promise.all([getRiskEngine(), minimumDelay])
        .then(([engine]) => {
          clearInterval(interval);
          const processed = processScanData(scan, engine, engineFailure);
          setIsAnalyzing(false);
          onScanProcessed({ raw: scan, engine, engineFailure, result: processed });
        })
        .catch((err: unknown) => {
          clearInterval(interval);
          setIsAnalyzing(false);
          report(err);
        });
    } catch (err: unknown) {
      report(err);
      setIsAnalyzing(false);
    }
  };

  /**
   * One error path. `ScanRejected` carries every structural problem it found rather than the first,
   * because a hand-edited scan usually has several and discovering them one upload at a time is
   * the sort of thing that gets a demo abandoned.
   */
  const report = (err: unknown) => {
    if (err instanceof ScanRejected) {
      setErrorMessage(
        err.problems.length === 1
          ? 'This file cannot be read as a scan.'
          : `This file cannot be read as a scan — ${err.problems.length} problems found.`
      );
      setSchemaProblems(err.problems);
      return;
    }
    setErrorMessage(err instanceof Error ? err.message : 'Failed to process the scan file.');
    setSchemaProblems([]);
  };

  const handleFileUpload = (file: File) => {
    if (!file.name.endsWith('.json')) {
      setErrorMessage('Please upload a valid JSON scan file (.json)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      handleJsonData(text);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleLoadSample = async () => {
    try {
      setErrorMessage(null);
      const response = await fetch('/sample-scan.json');
      if (!response.ok) {
        throw new Error('Could not load bundled sample-scan.json');
      }
      const data = await response.text();
      handleJsonData(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load sample scan');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-3xl w-full space-y-6">
        {/* Header Hero */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Risk Quantification Engine</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Ingest &amp; Quantify Cyber Risk Scan
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
            Feed any asset inventory and CVE/EPSS scanner export to continuously quantify institutional financial exposure and optimize security investments.
          </p>
        </div>

        {/* Loading / Analyzing State */}
        {isAnalyzing ? (
          <div className="rounded-2xl border border-cyan-500/40 bg-slate-900/90 p-10 shadow-2xl backdrop-blur-xl text-center space-y-6 animate-pulse">
            <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin" />
              <Cpu className="w-8 h-8 text-cyan-400" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white tracking-wide">
                Analyzing Scan Telemetry...
              </h3>
              <p className="text-xs text-cyan-300 font-mono transition-all duration-200">
                {steps[analysisStep]}
              </p>
            </div>

            <div className="max-w-md mx-auto bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-cyan-500 to-teal-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${((analysisStep + 1) / steps.length) * 100}%` }}
              />
            </div>

            <div className="text-[11px] text-slate-500 font-mono">
              Gradient-boosted tree inference, client-side, no data leaves this browser
            </div>
          </div>
        ) : (
          /* Normal Upload View */
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 shadow-2xl backdrop-blur space-y-6">
            {/* Drag & Drop Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl p-8 sm:p-10 text-center cursor-pointer transition duration-200 ${
                isDragging
                  ? 'border-cyan-400 bg-cyan-500/10'
                  : 'border-slate-700/80 hover:border-cyan-500/50 hover:bg-slate-800/40 bg-slate-950/40'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
                accept=".json"
                className="hidden"
              />

              <div className="mx-auto w-14 h-14 rounded-xl bg-slate-800 flex items-center justify-center text-cyan-400 border border-slate-700 mb-4 shadow-inner">
                <UploadCloud className="w-7 h-7" />
              </div>

              <div className="space-y-1">
                <h4 className="text-base font-semibold text-white">
                  Drop scanner JSON export here, or <span className="text-cyan-400 underline underline-offset-4">browse files</span>
                </h4>
                <p className="text-xs text-slate-400">
                  Accepts standard scanner payload (assets, CVE findings, EPSS scores, candidate controls)
                </p>
              </div>

              <div className="mt-4 inline-flex items-center gap-2 text-[11px] text-slate-500 font-mono bg-slate-900/80 px-3 py-1 rounded-full border border-slate-800">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>Format: .json schema</span>
              </div>
            </div>

            {/* Error Display */}
            {errorMessage && (
              <div
                role="alert"
                className="p-3.5 rounded-lg bg-red-950/40 border border-red-500/30 text-xs text-red-300 space-y-2"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-400" />
                  <span className="font-semibold">{errorMessage}</span>
                </div>
                {schemaProblems.length > 0 && (
                  <ul className="list-disc pl-8 space-y-1 text-red-200/90 leading-relaxed">
                    {schemaProblems.map((problem) => (
                      <li key={problem}>{problem}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Divider */}
            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-800 w-full" />
              <span className="bg-slate-900 px-3 text-xs text-slate-500 font-mono uppercase tracking-wider">
                Or Live Presentation Demo
              </span>
              <div className="border-t border-slate-800 w-full" />
            </div>

            {/* Bundled Sample Button */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 via-cyan-950/20 to-slate-900 border border-cyan-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <span className="text-xs font-bold text-white">Bundled Higher-Education Sample Scan</span>
                  <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded font-mono font-semibold">
                    1-Click Load
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Includes 18 realistic campus assets, CVEs, EPSS scores, and ₹50L budget allocation.
                </p>
              </div>

              <button
                onClick={handleLoadSample}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 hover:opacity-95 transition flex items-center justify-center gap-2 flex-shrink-0"
              >
                <Sparkles className="w-4 h-4" />
                <span>Load Sample Scan</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
