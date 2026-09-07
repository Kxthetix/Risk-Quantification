# CyberRisk Optimizer Prototype Implementation Plan

## Goal Description
Create a modern, dark‑theme single‑page web application **CyberRisk Optimizer** using React, TypeScript, Tailwind CSS, shadcn/ui components, and Recharts. The app will showcase AI‑powered cyber‑risk quantification and investment optimization for the SIH 2026 Problem Statement 105. All data is static mock JSON, and all calculations run client‑side.

## User Review Required
[!IMPORTANT]
- **Design direction**: Dark enterprise theme with navy/slate background, teal/cyan accents, and risk‑severity colors. Confirm if any branding colors or logos are required.
- **Data realism**: Approx. 15‑20 mock assets/vulnerabilities. Let us know if you need specific asset names or CVE IDs.
- **Optimization algorithm**: Simple knapsack/greedy approach. Approve this or suggest a different heuristic.
- **What‑If simulation logic**: Currently a linear mock formula. Confirm if you need more complex behavior.

## Open Questions
- Do you prefer a **single JSON file** (`src/data/mockData.json`) or separate files per section?
- Should the **budget slider** have a specific max value (e.g., ₹10 M) or be dynamic based on total cost?
- Any **accessibility** requirements (ARIA labels, keyboard navigation) beyond default shadcn/ui?

## Proposed Changes
---
### Project Scaffold
#### [NEW] [package.json](file:///C:/Risk%20Quantification/package.json)
```json
{
  "name": "cyberrisk-optimizer",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.14.0",
    "@radix-ui/react-tabs": "^1.1.0",
    "recharts": "^2.12.0",
    "@shadcn/ui": "^0.1.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "vite": "^5.2.0",
    "@vitejs/plugin-react": "^4.2.1",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.31",
    "autoprefixer": "^10.4.15"
  }
}
```
---
### Vite Config
#### [NEW] [vite.config.ts](file:///C:/Risk%20Quantification/vite.config.ts)
```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
});
```
---
### Tailwind Setup
#### [NEW] [tailwind.config.ts](file:///C:/Risk%20Quantification/tailwind.config.ts)
```ts
import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#0f172a', // navy/slate background
        accent: '#06b6d4', // teal/cyan
        risk: {
          low: '#10b981', // green
          medium: '#fbbf24', // amber
          high: '#ef4444', // red
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
```
---
### Global Styles
#### [NEW] [src/index.css](file:///C:/Risk%20Quantification/src/index.css)
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

html, body, #root { height: 100%; }
body { @apply bg-primary text-white font-sans; }
```
---
### Mock Data
#### [NEW] [src/data/mockData.ts](file:///C:/Risk%20Quantification/src/data/mockData.ts)
```ts
export interface AssetVuln {
  id: string;
  asset: string;
  cve: string;
  cvss: number; // 0‑10
  epss: number; // 0‑1
  criticality: 'Low' | 'Medium' | 'High';
  assetValue: number; // ₹
  control?: string; // optional existing control
}

export const assets: AssetVuln[] = [
  {
    id: '1',
    asset: 'Student Database',
    cve: 'CVE-2023-1234',
    cvss: 9.2,
    epss: 0.78,
    criticality: 'High',
    assetValue: 8_000_000,
  },
  {
    id: '2',
    asset: 'LMS Server',
    cve: 'CVE-2022-5678',
    cvss: 7.5,
    epss: 0.45,
    criticality: 'Medium',
    assetValue: 5_000_000,
  },
  // ... add ~15 more entries covering Wi‑Fi, Faculty Portal, Exam Server, etc.
];
```
---
### Utility Functions
#### [NEW] [src/utils/riskUtils.ts](file:///C:/Risk%20Quantification/src/utils/riskUtils.ts)
```ts
/**
 * Simple risk scoring formula used throughout the demo.
 * Risk Score = (CVSS/10) * EPSS * criticalityWeight
 * where criticalityWeight: Low=0.5, Medium=1.0, High=1.5
 */
export const criticalityWeight: Record<string, number> = {
  Low: 0.5,
  Medium: 1.0,
  High: 1.5,
};

export function computeRiskScore(cvss: number, epss: number, criticality: string): number {
  const weight = criticalityWeight[criticality] ?? 1;
  return parseFloat(((cvss / 10) * epss * weight).toFixed(3)); // 0‑1 range
}

/** Expected Financial Loss = Risk Score × Asset Value × Threat Likelihood (fixed 0.8 for demo) */
export const THREAT_LIKELIHOOD = 0.8;
export function computeExpectedLoss(riskScore: number, assetValue: number): number {
  return Math.round(riskScore * assetValue * THREAT_LIKELIHOOD);
}

/** Simple greedy knapsack for investment optimization */
export interface InvestmentOption {
  id: string;
  name: string;
  cost: number; // ₹
  riskReduction: number; // % of total risk reduced when applied
}

export function optimizeInvestments(
  budget: number,
  options: InvestmentOption[],
): { selected: InvestmentOption[]; totalReduction: number } {
  // sort by highest riskReduction per cost ratio
  const sorted = [...options].sort((a, b) => b.riskReduction / b.cost - a.riskReduction / a.cost);
  const selected: InvestmentOption[] = [];
  let remaining = budget;
  let totalReduction = 0;
  for (const opt of sorted) {
    if (opt.cost <= remaining) {
      selected.push(opt);
      remaining -= opt.cost;
      totalReduction += opt.riskReduction;
    }
  }
  return { selected, totalReduction };
}
```
---
### Core Components (high‑level list)
- `src/App.tsx` – router with shadcn/ui Tabs for the four views.
- `src/components/KPIGrid.tsx` – cards for Overview.
- `src/components/RiskTrendChart.tsx` – Recharts line chart.
- `src/components/TopRiskList.tsx` – ranked list with badges.
- `src/components/VulnTable.tsx` – table with expandable AI explanation panel.
- `src/components/InvestmentTable.tsx` – budget input, table, Optimize button.
- `src/components/WhatIfForm.tsx` – control selector + simulated outcome.
- Shared `src/components/MetricBadge.tsx` for risk‑severity coloring.

All components will use Tailwind utility classes for spacing, shadows, and dark‑mode colors, and shadcn/ui primitives for accessibility.

## Verification Plan
- Run `npm install && npm run dev` and ensure the app builds without TypeScript errors.
- Verify each tab loads mock data, charts render, and interactions (sorting, expanding rows, budget slider, Optimize button) work.
- Smoke‑test responsiveness by resizing the browser.
- Manual walkthrough: confirm KPI colors change according to risk bands, risk calculations match the utility functions, and the optimization result respects the budget.

Once you approve the plan, I will generate the full project scaffolding, populate mock data, and implement the UI components.
