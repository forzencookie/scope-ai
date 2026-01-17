"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface FilterTabOption {
  value: string
  label: string
  count?: number
  icon?: React.ReactNode
}

interface FilterTabsProps {
  options: FilterTabOption[]
  value: string
  onChange: (value: string) => void
  className?: string
  /** 
   * Visual variant:
   * - "default": Segmented control with container background
   * - "buttons": Separate buttons without container (like Button group)
   */
  variant?: "default" | "buttons"
  /** Size of the tabs */
  size?: "sm" | "default"
}

export function FilterTabs({
  options,
  value,
  onChange,
  className,
  variant = "default",
  size = "default",
}: FilterTabsProps) {
  const isButtons = variant === "buttons"
  const isSmall = size === "sm"

  return (
    <div className={cn(
      "flex items-center",
      isButtons ? "gap-2" : "gap-1 p-1 bg-muted/50 rounded-lg",
      className
    )}>
      {options.map(option => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "font-medium rounded-md transition-colors flex items-center",
            isSmall ? "px-3 py-1.5 text-sm h-8" : "px-3 py-1.5 text-sm",
            isButtons
              ? value === option.value
                ? "text-primary bg-transparent"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              : value === option.value
                ? "bg-background text-foreground"
                : "text-muted-foreground hover:text-foreground"
          )}
        >
          {option.icon && <span className="mr-1.5 opacity-70">{option.icon}</span>}
          {option.label}
          {option.count !== undefined && (
            <span className={cn(
              "ml-1.5 text-xs",
              isButtons ? "" : "opacity-60"
            )}>
              ({option.count})
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
