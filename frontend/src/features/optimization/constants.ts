export const OPTIMIZATION_ALGORITHMS = [
  {
    value: "KNAPSACK",
    label: "0/1 Knapsack Optimal (Dynamic Programming)",
    description: "Mathematically guarantees maximum total loss reduction under exact budget constraint.",
  },
  {
    value: "GREEDY",
    label: "Greedy Capital Efficiency (ROSI Ranked)",
    description: "Prioritizes highest Return on Security Investment (ROSI %) until budget is exhausted.",
  },
];

export const STRATEGIC_PORTFOLIO_DESCRIPTIONS = {
  MAX_RISK_REDUCTION: {
    title: "Maximum Risk Reduction",
    tag: "Aggressive Defense",
    color: "border-purple-500/30 bg-purple-500/5 text-purple-400",
    badge: "bg-purple-500/20 text-purple-300",
  },
  HIGHEST_ROSI: {
    title: "Highest ROSI & Capital Efficiency",
    tag: "Maximum Bang for Buck",
    color: "border-emerald-500/30 bg-emerald-500/5 text-emerald-400",
    badge: "bg-emerald-500/20 text-emerald-300",
  },
  BALANCED: {
    title: "Balanced Knapsack Optimum",
    tag: "Recommended Portfolio",
    color: "border-primary/40 bg-primary/5 text-primary",
    badge: "bg-primary text-primary-foreground font-bold",
  },
  FAST_WINS: {
    title: "Low-Hanging Fruit & Quick Wins",
    tag: "Immediate Deployment",
    color: "border-amber-500/30 bg-amber-500/5 text-amber-400",
    badge: "bg-amber-500/20 text-amber-300",
  },
};
