"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { Search, CalendarDays, BookOpen, Users, PieChart, Building2, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { PixelBearStatic } from "@/components/ai/mascots/bear"

const MAX_RECENT = 5

export type ActivityCategory = "handelser" | "bokforing" | "loner" | "rapporter" | "agare"

export interface RecentActivity {
    id: string
    label: string
    category: ActivityCategory
    timestamp: number
}

const categoryMeta: Record<ActivityCategory, { label: string; icon: typeof CalendarDays; color: string }> = {
    handelser: { label: "Händelser", icon: CalendarDays, color: "text-emerald-500" },
    bokforing: { label: "Bokföring", icon: BookOpen, color: "text-blue-500" },
    loner: { label: "Löner", icon: Users, color: "text-violet-500" },
    rapporter: { label: "Rapporter", icon: PieChart, color: "text-amber-500" },
    agare: { label: "Ägare", icon: Building2, color: "text-rose-500" },
}

interface SearchDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
    const [query, setQuery] = useState("")
    const [activeIndex, setActiveIndex] = useState(0)
    const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
    const inputRef = useRef<HTMLInputElement>(null)

    // Load recent activities on open
    useEffect(() => {
        if (open) {
            try {
                const stored = localStorage.getItem("scope-recent-activities")
                if (stored) setRecentActivities(JSON.parse(stored).slice(0, MAX_RECENT))
            } catch { /* ignore */ }
            setQuery("")
            setActiveIndex(0)
        }
    }, [open])

    // Global CMD+K shortcut
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault()
                onOpenChange(!open)
            }
        }
        window.addEventListener("keydown", handler)
        return () => window.removeEventListener("keydown", handler)
    }, [open, onOpenChange])

    // Filter recent activities by query
    const filtered = useMemo(() => {
        if (!query.trim()) return recentActivities
        const q = query.toLowerCase()
        return recentActivities.filter(
            a => a.label.toLowerCase().includes(q) || categoryMeta[a.category]?.label.toLowerCase().includes(q)
        )
    }, [query, recentActivities])

    // Reset active index when list changes
    useEffect(() => { setActiveIndex(0) }, [filtered.length])

    // Keyboard navigation
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (filtered.length === 0) return
        if (e.key === "ArrowDown") {
            e.preventDefault()
            setActiveIndex(i => (i + 1) % filtered.length)
        } else if (e.key === "ArrowUp") {
            e.preventDefault()
            setActiveIndex(i => (i - 1 + filtered.length) % filtered.length)
        } else if (e.key === "Enter" && filtered[activeIndex]) {
            e.preventDefault()
            // Could navigate to a detail view in the future
        }
    }, [filtered, activeIndex])

    const hasActivities = recentActivities.length > 0
    const showEmpty = query ? filtered.length === 0 : !hasActivities

    return (
        <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                <DialogPrimitive.Content
                    aria-describedby={undefined}
                    className="fixed z-50 top-[20%] left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] sm:w-[480px] bg-popover rounded-xl shadow-2xl border border-border/30 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-98 data-[state=open]:zoom-in-98 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 duration-200 outline-none"
                    onKeyDown={handleKeyDown}
                >
                    <DialogPrimitive.Title className="sr-only">Sök</DialogPrimitive.Title>

                    {/* Search input */}
                    <div className="flex items-center gap-3 px-4 h-14">
                        <Search className="h-5 w-5 text-muted-foreground/60 shrink-0" />
                        <input
                            ref={inputRef}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Sök aktiviteter..."
                            className="flex-1 bg-transparent text-[15px] placeholder:text-muted-foreground/40 outline-none"
                            autoFocus
                        />
                        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground/50 bg-muted/50 rounded">
                            ESC
                        </kbd>
                    </div>

                    <div className="h-px bg-border/40" />

                    {/* Content */}
                    <div className="py-2">
                        {showEmpty ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                <PixelBearStatic size={48} className="mb-3 opacity-40" />
                                <p className="text-sm text-muted-foreground/60">
                                    {query ? `Inga resultat för "${query}"` : "Inga senaste aktiviteter"}
                                </p>
                            </div>
                        ) : (
                            <>
                                <p className="px-5 pb-1 pt-1 text-[11px] font-medium text-muted-foreground/50 uppercase tracking-wider">
                                    Senaste aktiviteter
                                </p>
                                {filtered.map((activity, index) => {
                                    const meta = categoryMeta[activity.category]
                                    const Icon = meta?.icon || CalendarDays
                                    return (
                                        <button
                                            key={activity.id}
                                            onMouseEnter={() => setActiveIndex(index)}
                                            className={cn(
                                                "flex items-center gap-3 w-full px-5 py-2.5 text-left transition-colors",
                                                index === activeIndex
                                                    ? "bg-accent dark:bg-accent/50"
                                                    : "hover:bg-accent/30"
                                            )}
                                        >
                                            <Icon className={cn("h-4 w-4 shrink-0", meta?.color)} />
                                            <span className="text-sm flex-1 truncate">{activity.label}</span>
                                            <span className="text-[11px] text-muted-foreground/40 shrink-0">
                                                {formatRelativeTime(activity.timestamp)}
                                            </span>
                                            {index === activeIndex && (
                                                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                                            )}
                                        </button>
                                    )
                                })}
                            </>
                        )}
                    </div>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    )
}

function formatRelativeTime(ts: number): string {
    const diff = Date.now() - ts
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return "just nu"
    if (mins < 60) return `${mins} min sedan`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h sedan`
    const days = Math.floor(hours / 24)
    return `${days}d sedan`
}

/** Call from anywhere in the app to log a recent activity */
export function addRecentActivity(activity: Omit<RecentActivity, "id" | "timestamp">) {
    try {
        const stored = localStorage.getItem("scope-recent-activities")
        const existing: RecentActivity[] = stored ? JSON.parse(stored) : []
        const entry: RecentActivity = { ...activity, id: `${Date.now()}`, timestamp: Date.now() }
        const updated = [entry, ...existing.filter(a => a.label !== activity.label)].slice(0, MAX_RECENT)
        localStorage.setItem("scope-recent-activities", JSON.stringify(updated))
    } catch { /* ignore */ }
}
