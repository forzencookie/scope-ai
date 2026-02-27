"use client"

import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AutoTab } from './AutoTab'
import { ManualTab } from './ManualTab'
import { useAutoVerifikation } from './use-auto-verifikation'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AutoVerifikationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AutoVerifikationDialog({ open, onOpenChange }: AutoVerifikationDialogProps) {
  const hook = useAutoVerifikation()
  const [result, setResult] = useState<{ booked: number; errors: number } | null>(null)

  function handleDone(res: { booked: number; errors: number }) {
    setResult(res)
    // Auto-close after short delay if no errors
    if (res.errors === 0) {
      setTimeout(() => {
        onOpenChange(false)
        setResult(null)
      }, 2000)
    }
  }

  function handleManualCreated() {
    setResult({ booked: 1, errors: 0 })
    setTimeout(() => {
      setResult(null)
    }, 2000)
  }

  function handleClose(open: boolean) {
    if (!open) {
      setResult(null)
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Bokföra</DialogTitle>
        </DialogHeader>

        {/* Success message */}
        {result && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 text-sm">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>
              {result.booked} verifikation{result.booked !== 1 ? 'er' : ''} skapade
              {result.errors > 0 && (
                <span className="text-destructive ml-1">
                  ({result.errors} fel)
                </span>
              )}
            </span>
          </div>
        )}

        <Tabs defaultValue="auto" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="auto">
              Automatisk
              {hook.pendingCount > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  {hook.pendingCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="manual">Manuell</TabsTrigger>
          </TabsList>

          <TabsContent value="auto" className="flex-1 overflow-auto mt-4">
            <AutoTab hook={hook} onDone={handleDone} />
          </TabsContent>

          <TabsContent value="manual" className="flex-1 overflow-auto mt-4">
            <ManualTab onCreated={handleManualCreated} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
