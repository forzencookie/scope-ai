"use client";

import * as React from "react";
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

const alertVariants = {
  error: {
    container: "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300",
    icon: AlertCircle,
  },
  warning: {
    container: "bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300",
    icon: AlertTriangle,
  },
  success: {
    container: "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300",
    icon: CheckCircle2,
  },
  info: {
    container: "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300",
    icon: Info,
  },
};

interface AlertMessageProps {
  children: React.ReactNode;
  variant?: keyof typeof alertVariants;
  className?: string;
  icon?: React.ComponentType<{ className?: string }>;
  showIcon?: boolean;
}

/**
 * AlertMessage - Inline alert component for displaying messages with semantic colors
 * 
 * @example
 * <AlertMessage variant="error">{error}</AlertMessage>
 * <AlertMessage variant="warning">Varning: Data kan vara inaktuell</AlertMessage>
 * <AlertMessage variant="success">Ändringar sparade!</AlertMessage>
 * <AlertMessage variant="info">Tips: Du kan ändra detta i inställningar</AlertMessage>
 */
export function AlertMessage({
  children,
  variant = "error",
  className,
  icon,
  showIcon = true,
}: AlertMessageProps) {
  const variantConfig = alertVariants[variant];
  const IconComponent = icon || variantConfig.icon;

  return (
    <div
      className={cn(
        "flex items-center gap-2 p-3 border rounded-lg text-sm",
        variantConfig.container,
        className
      )}
      role="alert"
    >
      {showIcon && <IconComponent className="h-4 w-4 flex-shrink-0" />}
      <span>{children}</span>
    </div>
  );
}
