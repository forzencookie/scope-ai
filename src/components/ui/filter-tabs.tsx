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
}

export function FilterTabs({
  options,
  value,
  onChange,
  className,
}: FilterTabsProps) {
  return (
    <div className={cn("flex items-center gap-1 p-1 bg-muted/50 rounded-lg", className)}>
      {options.map(option => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center",
            value === option.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {option.icon && <span className="mr-1">{option.icon}</span>}
          {option.label}
          {option.count !== undefined && (
            <span className="ml-1.5 text-xs opacity-60">({option.count})</span>
          )}
        </button>
      ))}
    </div>
  )
}
