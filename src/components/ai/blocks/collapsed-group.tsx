"use client"

import { useState } from "react"
import { ChevronRight } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"
import { cn } from "@/lib/utils"
import type { CollapsedGroupProps } from "./types"
import { BlockRenderer } from "./block-renderer"

export function CollapsedGroup({ label, count, defaultOpen = false, children }: CollapsedGroupProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="rounded-lg border bg-card">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium hover:bg-muted/50 transition-colors"
      >
        <ChevronRight
          className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-90")}
        />
        <span>{label}</span>
        {count != null && (
          <span className="ml-auto text-xs text-muted-foreground">{count}</span>
        )}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-4 px-4 pb-4">
              {children.map((block, i) => (
                <BlockRenderer key={block.id ?? i} block={block} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
