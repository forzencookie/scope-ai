"use client"

import { useState } from "react"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { ConfirmationBlockProps } from "./types"

export function ConfirmationBlock({ title, summary, warnings, checkbox, checkboxLabel, confirmationId }: ConfirmationBlockProps) {
  const [checked, setChecked] = useState(false)
  const canConfirm = !checkbox || checked

  return (
    <div className="rounded-lg border bg-card">
      <div className="px-4 py-3 border-b">
        <h4 className="text-sm font-semibold">{title}</h4>
      </div>
      <div className="px-4 py-3 space-y-2">
        {summary.map((item, i) => (
          <div key={i} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{item.label}</span>
            <span className="font-medium tabular-nums">{item.value}</span>
          </div>
        ))}
      </div>
      {warnings && warnings.length > 0 && (
        <div className="px-4 py-2 border-t bg-amber-50 dark:bg-amber-950/20">
          {warnings.map((w, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-3 w-3 shrink-0" />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}
      <div className="px-4 py-3 border-t flex items-center justify-between">
        {checkbox ? (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              className="rounded border-muted-foreground/30"
            />
            <span className="text-xs text-muted-foreground">{checkboxLabel || "Jag bekräftar att uppgifterna stämmer"}</span>
          </label>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              window.dispatchEvent(new CustomEvent("walkthrough-action", { detail: { actionId: "cancel" } }))
            }}
          >
            Avbryt
          </Button>
          <Button
            size="sm"
            disabled={!canConfirm}
            className={cn(!canConfirm && "opacity-50")}
            onClick={() => {
              window.dispatchEvent(new CustomEvent("walkthrough-action", {
                detail: { actionId: "confirm", confirmationId }
              }))
            }}
          >
            Godkänn
          </Button>
        </div>
      </div>
    </div>
  )
}
