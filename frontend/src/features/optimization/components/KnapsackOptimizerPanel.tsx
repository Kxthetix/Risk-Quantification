import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { optimizationRunSchema } from "../schemas";
import { OptimizationAlgorithm, OptimizationResult, OptimizationRunInput } from "../types";
import { OPTIMIZATION_ALGORITHMS } from "../constants";
import { useRunOptimization } from "../hooks";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/forms/FormField";
import { formatCurrency } from "@/lib/utils/currency";
import { Cpu, DollarSign, Sparkles, Layers, Sliders } from "lucide-react";

interface KnapsackOptimizerPanelProps {
  onOptimizationComplete: (result: OptimizationResult) => void;
  defaultBudget?: number;
}

export function KnapsackOptimizerPanel({
  onOptimizationComplete,
  defaultBudget = 1000000,
}: KnapsackOptimizerPanelProps) {
  const optimizeMutation = useRunOptimization();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<OptimizationRunInput>({
    resolver: zodResolver(optimizationRunSchema),
    defaultValues: {
      budget: defaultBudget,
      algorithm: "KNAPSACK",
      horizon_years: 1,
      synchronous: true,
    },
  });

  const currentBudget = watch("budget");

  const onSubmit = async (data: OptimizationRunInput) => {
    try {
      const res = await optimizeMutation.mutateAsync(data);
      onOptimizationComplete(res);
    } catch (err) {
      console.error("Optimization execution failed:", err);
    }
  };

  const budgetPresets = [250000, 500000, 1000000, 2500000, 5000000];

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">
                Cybersecurity Portfolio Knapsack Optimizer
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Mathematically allocate budget across remediations and defensive controls to maximize total risk loss reduction.
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Budget Input & Presets */}
            <div className="space-y-2">
              <FormField label="Available Cyber Defense Budget (₹)" required error={errors.budget?.message}>
                <Input
                  type="number"
                  step="50000"
                  {...register("budget")}
                  className="text-xs h-9 font-mono font-bold"
                />
              </FormField>

              {/* Quick Presets */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {budgetPresets.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setValue("budget", amt)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-colors ${
                      currentBudget === amt
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted/40 text-muted-foreground border-border hover:text-foreground"
                    }`}
                  >
                    {formatCurrency(amt, { currency: "INR", compact: true })}
                  </button>
                ))}
              </div>
            </div>

            {/* Algorithm Selector */}
            <FormField label="Mathematical Optimization Engine" required error={errors.algorithm?.message}>
              <select
                {...register("algorithm")}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {OPTIMIZATION_ALGORITHMS.map((algo) => (
                  <option key={algo.value} value={algo.value}>
                    {algo.label}
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-muted-foreground block mt-1">
                Dynamic programming branch-and-bound solving 0/1 integer knapsack.
              </span>
            </FormField>

            {/* Time Horizon */}
            <FormField label="Investment Planning Horizon" required error={errors.horizon_years?.message}>
              <select
                {...register("horizon_years")}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value={1}>1 Year (Immediate Annual ROI)</option>
                <option value={2}>2 Years (Medium-Term Rollout)</option>
                <option value={3}>3 Years (Strategic TCO Standard)</option>
                <option value={5}>5 Years (Long-Term Capital Plan)</option>
              </select>
              <span className="text-[10px] text-muted-foreground block mt-1">
                Calculates cumulative loss reduction vs multi-year operating TCO.
              </span>
            </FormField>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="submit"
              size="sm"
              isLoading={optimizeMutation.isPending}
              className="gap-2 px-4"
            >
              <Sparkles className="w-4 h-4" />
              <span>Run Knapsack Optimization</span>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
