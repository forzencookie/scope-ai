"use client"

import * as React from "react"
import { Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

interface SearchBarProps {
  placeholder?: string
  value: string
  onChange: (value: string) => void
  className?: string
  showClear?: boolean
  size?: 'default' | 'lg'
  onSearch?: () => void
}

export function SearchBar({
  placeholder = "Sök...",
  value,
  onChange,
  className,
  showClear = true,
  size = 'default',
  onSearch,
}: SearchBarProps) {
  const isLarge = size === 'lg'

  return (
    <div className={cn("relative w-full sm:w-56", className)}>
      <Search className={cn(
        "absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground",
        isLarge ? "h-5 w-5 left-4" : "h-4 w-4"
      )} />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && onSearch) {
            e.preventDefault()
            onSearch()
          }
        }}
        className={cn(
          "border-2 border-border/60",
          isLarge ? "pl-12 h-12 text-base rounded-xl" : "pl-9 h-8",
          showClear && value && (isLarge ? "pr-10" : "pr-8")
        )}
      />
      {showClear && value && (
        <button
          onClick={() => onChange("")}
          className={cn(
            "absolute top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground",
            isLarge ? "right-4" : "right-3"
          )}
        >
          <X className={cn(isLarge ? "h-5 w-5" : "h-4 w-4")} />
        </button>
      )}
    </div>
  )
}
