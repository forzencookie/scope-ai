"use client"

import { motion } from "framer-motion"
import { X, Pencil, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import type { BlockProps, WalkthroughResponse } from "./types"

import { StatCards } from "./stat-cards"
import { FinancialTable } from "./financial-table"
import { DataTable } from "./data-table"
import { Chart } from "./chart"
import { RankedList } from "./ranked-list"
import { Timeline } from "./timeline"
import { Checklist } from "./checklist"
import { InfoCard } from "./info-card"
import { LegalParagraphs } from "./legal-paragraphs"
import { KeyValue } from "./key-value"
import { Comparison } from "./comparison"
import { ActionBar } from "./action-bar"
import { BlockSeparator } from "./separator"
import { Heading } from "./heading"
import { Prose } from "./prose"
import { StatusCheck } from "./status-check"
import { DocumentPreview } from "./document-preview"
import { FormFields } from "./form-fields"
import { ProgressBar } from "./progress-bar"
import { ConfirmationBlock } from "./confirmation"
import { EntityRows } from "./entity-rows"
import { CollapsedGroup } from "./collapsed-group"
import { InlineChoice } from "./inline-choice"
import { Annotation } from "./annotation"
import { Columns } from "./columns"
import { Metric } from "./metric"

/* eslint-disable @typescript-eslint/no-explicit-any */
const BLOCK_MAP: Record<string, React.ComponentType<any>> = {
  "stat-cards": StatCards,
  "financial-table": FinancialTable,
  "data-table": DataTable,
  "chart": Chart,
  "ranked-list": RankedList,
  "timeline": Timeline,
  "checklist": Checklist,
  "info-card": InfoCard,
  "legal-paragraphs": LegalParagraphs,
  "key-value": KeyValue,
  "comparison": Comparison,
  "action-bar": ActionBar,
  "separator": BlockSeparator,
  "heading": Heading,
  "prose": Prose,
  "status-check": StatusCheck,
  "document-preview": DocumentPreview,
  "form-fields": FormFields,
  "progress-bar": ProgressBar,
  "confirmation": ConfirmationBlock,
  "entity-rows": EntityRows,
  "collapsed-group": CollapsedGroup,
  "inline-choice": InlineChoice,
  "annotation": Annotation,
  "columns": Columns,
  "metric": Metric,
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export function BlockRenderer({ block }: { block: BlockProps }) {
  const Component = BLOCK_MAP[block.type]
  if (!Component) {
    // Fallback: render as prose with JSON
    console.warn(`[BlockRenderer] Unknown block type: ${block.type}`)
    return (
      <div className="rounded-lg border bg-muted/30 px-4 py-3 text-xs font-mono text-muted-foreground">
        Unknown block: {block.type}
      </div>
    )
  }
  return <Component {...(block.props as Record<string, unknown>)} />
}

interface WalkthroughRendererProps {
  response: WalkthroughResponse
  onClose: () => void
  isThinking?: boolean
  onBlockEdit?: (blockIndex: number, blockType: string) => void
  className?: string
}

function extractLabel(block: BlockProps): string {
  const props = block.props as Record<string, unknown>
  if (typeof props?.title === 'string') return props.title
  if (typeof props?.label === 'string') return props.label
  if (typeof props?.text === 'string') return (props.text as string).slice(0, 40)
  return block.type
}

export function WalkthroughRenderer({ response, onClose, isThinking, onBlockEdit, className }: WalkthroughRendererProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn("absolute inset-0 z-50 overflow-y-auto bg-background/95 backdrop-blur-sm", className)}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="fixed top-4 right-4 z-10 rounded-md p-2 hover:bg-muted transition-colors"
      >
        <X className="h-4 w-4 text-muted-foreground" />
      </button>

      {/* Document body */}
      <motion.article
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="mx-auto max-w-3xl px-6 py-12"
      >
        {/* Title */}
        <header className="mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{response.title}</h1>
            {isThinking && (
              <motion.div
                className="flex items-center gap-1.5 text-xs text-muted-foreground"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Sparkles className="h-3 w-3 text-amber-500" />
                <span>AI tänker...</span>
              </motion.div>
            )}
          </div>
          {response.subtitle && (
            <p className="mt-1 text-sm text-muted-foreground">{response.subtitle}</p>
          )}
        </header>

        <hr className="border-border mb-6" />

        {/* Blocks */}
        <div className="space-y-6">
          {response.blocks.map((block, i) => (
            <motion.div
              key={block.id ?? i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + i * 0.03 }}
              className="group relative"
            >
              {onBlockEdit && (
                <button
                  onClick={() => onBlockEdit(i, block.type)}
                  className="absolute -left-8 top-1 opacity-0 group-hover:opacity-100 transition-opacity rounded p-1 hover:bg-muted"
                  title={`Redigera ${block.type}`}
                >
                  <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              )}
              <BlockRenderer block={block} />
            </motion.div>
          ))}
        </div>
      </motion.article>
    </motion.div>
  )
}
