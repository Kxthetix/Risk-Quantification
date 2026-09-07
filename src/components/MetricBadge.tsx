import React from 'react';

interface MetricBadgeProps {
  label: string;
  variant?: 'critical' | 'high' | 'medium' | 'low' | 'neutral' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export default function MetricBadge({
  label,
  variant = 'neutral',
  size = 'md',
  icon
}: MetricBadgeProps) {
  const variantStyles = {
    critical: 'bg-red-500/15 text-red-400 border-red-500/30 shadow-[0_0_12px_rgba(239,68,68,0.2)]',
    high: 'bg-orange-500/15 text-orange-400 border-orange-500/30 shadow-[0_0_12px_rgba(249,115,22,0.2)]',
    medium: 'bg-amber-500/15 text-amber-300 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.15)]',
    low: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.15)]',
    neutral: 'bg-slate-800 text-slate-300 border-slate-700',
    accent: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
  };

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-semibold',
    lg: 'text-sm px-3 py-1.5 font-semibold'
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border tracking-wide uppercase font-mono ${variantStyles[variant]} ${sizeStyles[size]}`}
    >
      {icon && <span className="text-[1.1em]">{icon}</span>}
      {label}
    </span>
  );
}
