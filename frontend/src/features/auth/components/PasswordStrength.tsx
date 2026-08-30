import React from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface PasswordStrengthProps {
  password?: string;
  showRequirements?: boolean;
}

export type StrengthLevel = "WEAK" | "FAIR" | "GOOD" | "STRONG";

export function calculatePasswordStrength(pwd: string = ""): {
  score: number;
  level: StrengthLevel;
  label: string;
  colorClass: string;
  requirements: { label: string; met: boolean }[];
} {
  const requirements = [
    { label: "At least 8 characters", met: pwd.length >= 8 },
    { label: "At least one uppercase letter (A-Z)", met: /[A-Z]/.test(pwd) },
    { label: "At least one lowercase letter (a-z)", met: /[a-z]/.test(pwd) },
    { label: "At least one number (0-9)", met: /[0-9]/.test(pwd) },
    { label: "At least one special character (!@#$%^&*)", met: /[^A-Za-z0-9]/.test(pwd) },
  ];

  const metCount = requirements.filter((r) => r.met).length;

  if (metCount <= 2) {
    return {
      score: 1,
      level: "WEAK",
      label: "Weak",
      colorClass: "bg-rose-500 text-rose-500",
      requirements,
    };
  }
  if (metCount === 3) {
    return {
      score: 2,
      level: "FAIR",
      label: "Fair",
      colorClass: "bg-amber-500 text-amber-500",
      requirements,
    };
  }
  if (metCount === 4) {
    return {
      score: 3,
      level: "GOOD",
      label: "Good",
      colorClass: "bg-blue-500 text-blue-500",
      requirements,
    };
  }
  return {
    score: 4,
    level: "STRONG",
    label: "Strong",
    colorClass: "bg-emerald-500 text-emerald-500",
    requirements,
  };
}

export function PasswordStrength({
  password = "",
  showRequirements = true,
}: PasswordStrengthProps) {
  if (!password) return null;

  const { score, label, colorClass, requirements } = calculatePasswordStrength(password);

  return (
    <div className="space-y-2 pt-1" data-testid="password-strength-container">
      {/* Strength Bar */}
      <div className="space-y-1">
        <div className="flex gap-1.5 h-1.5 w-full bg-muted/60 rounded-full overflow-hidden">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={cn(
                "h-full flex-1 rounded-full transition-all duration-300",
                step <= score ? colorClass.split(" ")[0] : "bg-transparent"
              )}
            />
          ))}
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground">Password strength</span>
          <span className={cn("font-semibold", colorClass.split(" ")[1])}>{label}</span>
        </div>
      </div>

      {/* Requirement List */}
      {showRequirements && (
        <div className="grid grid-cols-1 gap-1 text-[11px] pt-1">
          {requirements.map((req, idx) => (
            <div
              key={idx}
              className={cn(
                "flex items-center gap-1.5 transition-colors",
                req.met ? "text-emerald-500 font-medium" : "text-muted-foreground"
              )}
            >
              {req.met ? (
                <Check className="h-3 w-3 shrink-0" />
              ) : (
                <X className="h-3 w-3 shrink-0 text-muted-foreground/60" />
              )}
              <span>{req.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
