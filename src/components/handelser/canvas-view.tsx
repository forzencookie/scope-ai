"use client"

import { useState, useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getSupabaseClient } from "@/lib/database/supabase"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Plus, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Canvas {
  id: string
  title: string
  content: string
  createdAt: Date
  updatedAt: Date
}

const canvasQueryKeys = {
  all: ["canvases"] as const,
  list: () => [...canvasQueryKeys.all, "list"] as const,
}

function countCheckboxes(content: string): { checked: number; total: number } {
  const checked = (content.match(/- \[x\]/gi) || []).length
  const unchecked = (content.match(/- \[ \]/g) || []).length
  return { checked, total: checked + unchecked }
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("sv-SE", { day: "numeric", month: "short" })
}

// Simple markdown → HTML with interactive checkboxes
function renderMarkdown(content: string, onToggleCheckbox: (index: number) => void): React.ReactNode {
  let checkboxIndex = 0
  const lines = content.split("\n")

  return lines.map((line, i) => {
    // Headings
    if (line.startsWith("### ")) return <h3 key={i} className="text-base font-semibold mt-4 mb-1">{line.slice(4)}</h3>
    if (line.startsWith("## ")) return <h2 key={i} className="text-lg font-semibold mt-5 mb-2">{line.slice(3)}</h2>
    if (line.startsWith("# ")) return <h1 key={i} className="text-xl font-bold mt-6 mb-2">{line.slice(2)}</h1>

    // Horizontal rule
    if (line.trim() === "---") return <hr key={i} className="my-4 border-border" />

    // Blockquote
    if (line.startsWith("> ")) return <blockquote key={i} className="border-l-2 border-primary/30 pl-3 text-sm text-muted-foreground my-2">{line.slice(2)}</blockquote>

    // Checked checkbox
    if (line.match(/^- \[x\]/i)) {
      const idx = checkboxIndex++
      const text = line.replace(/^- \[x\]\s*/i, "")
      return (
        <label key={i} className="flex items-center gap-2 py-0.5 cursor-pointer group">
          <input type="checkbox" checked onChange={() => onToggleCheckbox(idx)} className="rounded" />
          <span className="text-sm line-through text-muted-foreground">{text}</span>
        </label>
      )
    }

    // Unchecked checkbox
    if (line.match(/^- \[ \]/)) {
      const idx = checkboxIndex++
      const text = line.replace(/^- \[ \]\s*/, "")
      return (
        <label key={i} className="flex items-center gap-2 py-0.5 cursor-pointer group">
          <input type="checkbox" onChange={() => onToggleCheckbox(idx)} className="rounded" />
          <span className="text-sm">{text}</span>
        </label>
      )
    }

    // Regular list item
    if (line.startsWith("- ")) return <li key={i} className="text-sm ml-4 list-disc">{line.slice(2)}</li>

    // Empty line
    if (line.trim() === "") return <div key={i} className="h-2" />

    // Regular paragraph
    return <p key={i} className="text-sm">{line}</p>
  })
}

export function CanvasView() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  // Fetch all canvases
  const { data: canvases = [], isLoading } = useQuery<Canvas[]>({
    queryKey: canvasQueryKeys.list(),
    queryFn: async () => {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from("roadmaps")
        .select("id, title, description, created_at, updated_at")
        .order("updated_at", { ascending: false })

      if (error) throw error
      return (data || []).map((r) => ({
        id: r.id,
        title: r.title,
        content: r.description || "",
        createdAt: new Date(r.created_at),
        updatedAt: new Date(r.updated_at),
      }))
    },
  })

  // Update canvas content
  const updateMutation = useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const supabase = getSupabaseClient()
      const { error } = await supabase
        .from("roadmaps")
        .update({ description: content })
        .eq("id", id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: canvasQueryKeys.all }),
  })

  // Delete canvas
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const supabase = getSupabaseClient()
      // Delete steps first, then roadmap
      await supabase.from("roadmap_steps").delete().eq("roadmap_id", id)
      const { error } = await supabase.from("roadmaps").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: () => {
      setSelectedId(null)
      setDeleteTarget(null)
      queryClient.invalidateQueries({ queryKey: canvasQueryKeys.all })
    },
  })

  // Create empty canvas
  const createMutation = useMutation({
    mutationFn: async () => {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from("roadmaps")
        .insert({ title: "Ny canvas", description: "", status: "active", user_id: user!.id })
        .select("id")
        .single()
      if (error) throw error
      return data.id
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: canvasQueryKeys.all })
      setSelectedId(id)
    },
  })

  const handleToggleCheckbox = useCallback((canvas: Canvas, checkboxIndex: number) => {
    let idx = 0
    const lines = canvas.content.split("\n")
    const updated = lines.map((line) => {
      if (line.match(/^- \[[ x]\]/i)) {
        if (idx === checkboxIndex) {
          idx++
          if (line.match(/^- \[x\]/i)) return line.replace(/^- \[x\]/i, "- [ ]")
          return line.replace(/^- \[ \]/, "- [x]")
        }
        idx++
      }
      return line
    })
    const newContent = updated.join("\n")
    updateMutation.mutate({ id: canvas.id, content: newContent })
  }, [updateMutation])

  const selectedCanvas = canvases.find((c) => c.id === selectedId)

  // Detail view
  if (selectedCanvas) {
    const { checked, total } = countCheckboxes(selectedCanvas.content)
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setSelectedId(null)} className="gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            Tillbaka
          </Button>
          <button
            onClick={() => setDeleteTarget(selectedCanvas.id)}
            className="text-muted-foreground/50 hover:text-destructive transition-colors p-1"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        <div>
          <h2 className="text-lg font-semibold">{selectedCanvas.title}</h2>
          <p className="text-xs text-muted-foreground">
            Skapad {formatDate(selectedCanvas.createdAt)}
            {total > 0 && ` \u00b7 ${checked} av ${total} klara`}
          </p>
        </div>

        <hr className="border-border" />

        <div className="space-y-0.5">
          {selectedCanvas.content ? (
            renderMarkdown(selectedCanvas.content, (idx) => handleToggleCheckbox(selectedCanvas, idx))
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Tom canvas. Be AI att skapa innehall via chatten.
            </p>
          )}
        </div>

        <ConfirmDeleteDialog
          open={deleteTarget !== null}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
        />
      </div>
    )
  }

  // List view
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">Dina canvas</h3>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={() => createMutation.mutate()}
          disabled={createMutation.isPending}
        >
          <Plus className="h-4 w-4" />
          Ny
        </Button>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground text-center py-8">Laddar...</div>
      ) : canvases.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted-foreground">
              Inga canvas annu. Skapa en ny eller be AI att gora en plan at dig.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {canvases.map((canvas) => {
            const { checked, total } = countCheckboxes(canvas.content)
            return (
              <button
                key={canvas.id}
                onClick={() => setSelectedId(canvas.id)}
                className={cn(
                  "rounded-lg border bg-card p-4 text-left hover:bg-accent/50 transition-colors",
                  "flex flex-col gap-1"
                )}
              >
                <span className="text-sm font-medium truncate">{canvas.title}</span>
                {total > 0 && (
                  <span className="text-xs text-muted-foreground">{checked}/{total} klara</span>
                )}
                <span className="text-xs text-muted-foreground">{formatDate(canvas.updatedAt)}</span>
              </button>
            )
          })}
        </div>
      )}

      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
      />
    </div>
  )
}

function ConfirmDeleteDialog({
  open,
  onCancel,
  onConfirm,
}: {
  open: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Ta bort canvas?</AlertDialogTitle>
          <AlertDialogDescription>
            Canvasen och allt dess innehall tas bort permanent.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Avbryt</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Ta bort
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
