"use client";

import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input, InputProps } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";

export interface PasswordInputProps extends Omit<InputProps, "type"> {
  showStrength?: boolean;
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, value, showStrength = false, onChange, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const [strengthScore, setStrengthScore] = useState(0);

    const calculateStrength = (pwd: string) => {
      let score = 0;
      if (pwd.length >= 8) score += 1;
      if (/[A-Z]/.test(pwd)) score += 1;
      if (/[a-z]/.test(pwd)) score += 1;
      if (/[0-9]/.test(pwd)) score += 1;
      if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
      setStrengthScore(score);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (showStrength) {
        calculateStrength(e.target.value);
      }
      if (onChange) {
        onChange(e);
      }
    };

    return (
      <div className="space-y-2">
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            className={cn("pr-10", className)}
            value={value}
            ref={ref}
            onChange={handleChange}
            {...props}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {showStrength && (
          <div className="space-y-1 pt-1">
            <div className="flex gap-1 h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-300",
                  strengthScore <= 2
                    ? "w-1/3 bg-rose-500"
                    : strengthScore <= 4
                    ? "w-2/3 bg-amber-500"
                    : "w-full bg-emerald-500"
                )}
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Strength:{" "}
              <span className="font-semibold">
                {strengthScore <= 2 ? "Weak" : strengthScore <= 4 ? "Good" : "Strong"}
              </span>
            </p>
          </div>
        )}
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";
