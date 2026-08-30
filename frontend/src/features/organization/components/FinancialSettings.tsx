"use client";

import React from "react";
import { DollarSign, IndianRupee, Euro, PoundSterling } from "lucide-react";
import { FormField } from "@/components/forms/FormField";
import { formatCurrency } from "@/lib/utils/currency";

export interface FinancialSettingsProps {
  selectedCurrency: "INR" | "USD" | "EUR" | "GBP" | "JPY";
  onChange: (currency: "INR" | "USD" | "EUR" | "GBP" | "JPY") => void;
  disabled?: boolean;
}

const CURRENCY_OPTIONS: {
  value: "INR" | "USD" | "EUR" | "GBP" | "JPY";
  label: string;
  symbol: string;
  sampleAmount: number;
  description: string;
}[] = [
  {
    value: "INR",
    label: "INR (₹) - Indian Rupee",
    symbol: "₹",
    sampleAmount: 8240000,
    description: "Formats numbers into Lakhs (L) and Crores (Cr)",
  },
  {
    value: "USD",
    label: "USD ($) - US Dollar",
    symbol: "$",
    sampleAmount: 1250000,
    description: "Formats numbers into Thousands (K), Millions (M), and Billions (B)",
  },
  {
    value: "EUR",
    label: "EUR (€) - Euro",
    symbol: "€",
    sampleAmount: 1100000,
    description: "Standard European financial formatting",
  },
  {
    value: "GBP",
    label: "GBP (£) - British Pound",
    symbol: "£",
    sampleAmount: 950000,
    description: "UK Sterling financial formatting",
  },
  {
    value: "JPY",
    label: "JPY (¥) - Japanese Yen",
    symbol: "¥",
    sampleAmount: 150000000,
    description: "Japanese Yen integer formatting",
  },
];

export function FinancialSettings({
  selectedCurrency,
  onChange,
  disabled = false,
}: FinancialSettingsProps) {
  return (
    <div className="space-y-4">
      <FormField
        label="Base Financial Currency"
        description="Controls the default denomination, symbol, and loss modeling display across all financial dashboards."
      >
        <select
          value={selectedCurrency}
          onChange={(e) => onChange(e.target.value as any)}
          disabled={disabled}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        >
          {CURRENCY_OPTIONS.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              className="bg-popover text-popover-foreground"
            >
              {opt.label}
            </option>
          ))}
        </select>
      </FormField>

      {/* Live Preview Card */}
      <div className="rounded-lg border border-border bg-muted/20 p-3.5 space-y-2">
        <div className="text-xs font-semibold text-foreground flex items-center justify-between">
          <span>Live Formatting Preview</span>
          <span className="font-mono text-primary font-bold">{selectedCurrency}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="rounded bg-background/60 p-2.5 border border-border/50">
            <span className="text-muted-foreground block text-[11px]">Expected Annual Loss (ALE):</span>
            <span className="text-sm font-bold text-foreground mt-0.5 block">
              {formatCurrency(8240000, { currency: selectedCurrency, compact: true })}
            </span>
          </div>
          <div className="rounded bg-background/60 p-2.5 border border-border/50">
            <span className="text-muted-foreground block text-[11px]">P95 Value at Risk (VaR):</span>
            <span className="text-sm font-bold text-rose-500 mt-0.5 block">
              {formatCurrency(24500000, { currency: selectedCurrency, compact: true })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
