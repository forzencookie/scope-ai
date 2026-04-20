"use client"

import type { InlineChoiceProps } from "./types"

export function InlineChoice({ question, options }: InlineChoiceProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {question && (
        <span className="text-sm text-muted-foreground mr-1">{question}</span>
      )}
      {options.map((opt) => (
        <button
          key={opt.value}
          className="rounded-full border bg-card px-3 py-1 text-xs font-medium hover:bg-muted transition-colors"
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
