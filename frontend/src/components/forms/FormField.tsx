import React from "react";
import { cn } from "@/lib/utils/cn";
import { AlertCircle } from "lucide-react";

export interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export function FormLabel({ children, required, className, ...props }: FormLabelProps) {
  return (
    <label
      className={cn("block text-xs font-semibold uppercase tracking-wider text-foreground mb-1.5", className)}
      {...props}
    >
      {children}
      {required && <span className="text-destructive ml-1">*</span>}
    </label>
  );
}

export interface FormErrorProps {
  message?: string;
  className?: string;
}

export function FormError({ message, className }: FormErrorProps) {
  if (!message) return null;

  return (
    <div className={cn("flex items-center gap-1.5 text-xs text-destructive mt-1.5 animate-in fade-in-0", className)}>
      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

export interface FormFieldProps {
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}

export function FormField({
  label,
  description,
  error,
  required,
  htmlFor,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-1", className)}>
      {label && (
        <FormLabel htmlFor={htmlFor} required={required}>
          {label}
        </FormLabel>
      )}
      {children}
      {description && !error && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      <FormError message={error} />
    </div>
  );
}

export function FormSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border border-border bg-card p-6 shadow-sm space-y-4", className)}>
      <div>
        <h4 className="text-base font-semibold text-foreground">{title}</h4>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="space-y-4 pt-2">{children}</div>
    </div>
  );
}

export function FormActions({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-end gap-3 pt-4 border-t border-border mt-6", className)}>
      {children}
    </div>
  );
}
