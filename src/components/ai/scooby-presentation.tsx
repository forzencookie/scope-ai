"use client"

/**
 * ScoobyPresentation — Walkthrough intro header
 *
 * Replaces stat-cards at the top of walkthroughs with a Scooby-branded
 * presentation header. Uses the same dashed amber border + pixel mascot
 * style as ConversationHeader in the chat interface.
 *
 * This is "Scooby presenting" — the walkthrough is his summary/explanation
 * of the data, not a dashboard.
 */

// ─── Scooby Mascot (pixel art, same as conversation-header.tsx) ─────────────

function ScoobyMascot({ size = 32 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 16 16" shapeRendering="crispEdges">
            <rect x="2" y="2" width="2" height="3" className="fill-amber-600 dark:fill-amber-500" />
            <rect x="12" y="2" width="2" height="3" className="fill-amber-600 dark:fill-amber-500" />
            <rect x="3" y="4" width="10" height="6" className="fill-amber-400 dark:fill-amber-300" />
            <rect x="5" y="5" width="6" height="4" className="fill-amber-100 dark:fill-amber-50" />
            <rect x="5" y="6" width="2" height="2" className="fill-gray-800 dark:fill-gray-900" />
            <rect x="9" y="6" width="2" height="2" className="fill-gray-800 dark:fill-gray-900" />
            <rect x="5" y="6" width="1" height="1" className="fill-white" />
            <rect x="9" y="6" width="1" height="1" className="fill-white" />
            <rect x="7" y="8" width="2" height="1" className="fill-gray-800 dark:fill-gray-900" />
            <rect x="7" y="9" width="2" height="1" className="fill-pink-400" />
            <rect x="4" y="10" width="8" height="4" className="fill-amber-400 dark:fill-amber-300" />
            <rect x="6" y="10" width="4" height="3" className="fill-amber-100 dark:fill-amber-50" />
            <rect x="12" y="11" width="2" height="2" className="fill-amber-600 dark:fill-amber-500" />
            <rect x="4" y="14" width="2" height="1" className="fill-amber-600 dark:fill-amber-500" />
            <rect x="10" y="14" width="2" height="1" className="fill-amber-600 dark:fill-amber-500" />
        </svg>
    )
}

// ─── Component ──────────────────────────────────────────────────────────────

export interface ScoobyHighlight {
    label: string
    value: string
    detail?: string
}

export interface ScoobyPresentationProps {
    /** Scooby's summary text — what he's presenting */
    message: string
    /** Key figures shown in compact boxes */
    highlights: ScoobyHighlight[]
}

export function ScoobyPresentation({ message, highlights }: ScoobyPresentationProps) {
    return (
        <div className="border-2 border-dashed border-amber-400/50 dark:border-amber-500/30 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-3">
                <div className="shrink-0 rounded-lg bg-amber-500/10 p-1.5">
                    <ScoobyMascot size={32} />
                </div>
                <div className="min-w-0">
                    <p className="text-sm text-muted-foreground">{message}</p>
                </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
                {highlights.map((h, i) => (
                    <div key={i} className="rounded-md bg-muted/30 px-3 py-2">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{h.label}</p>
                        <p className="text-base font-bold tabular-nums">{h.value}</p>
                        {h.detail && (
                            <p className="text-[10px] text-muted-foreground">{h.detail}</p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}
