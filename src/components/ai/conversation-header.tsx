"use client"

import { useCompany } from "@/providers/company-provider"
import { useChatContext } from "@/providers/chat-provider"
import { useMemo } from "react"

function formatDateTime(timestamp: number): string {
    const date = new Date(timestamp)
    const day = date.getDate()
    const months = [
        'januari', 'februari', 'mars', 'april', 'maj', 'juni',
        'juli', 'augusti', 'september', 'oktober', 'november', 'december',
    ]
    const month = months[date.getMonth()]
    const year = date.getFullYear()
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')

    return `${day} ${month} ${year}, ${hours}:${minutes}`
}

export function ConversationHeader() {
    const { company } = useCompany()
    const { conversations, currentConversationId } = useChatContext()

    const conversation = useMemo(
        () => conversations.find(c => c.id === currentConversationId),
        [conversations, currentConversationId]
    )

    const timestamp = conversation?.createdAt ?? Date.now()
    const companyName = company?.name

    return (
        <div className="border-2 border-dashed border-border/50 rounded-xl p-3 flex items-center gap-3">
            {/* Small pixel mascot */}
            <div className="shrink-0 rounded-lg bg-amber-500/10 p-1.5">
                <svg width="32" height="32" viewBox="0 0 16 16" shapeRendering="crispEdges">
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
            </div>

            {/* Info */}
            <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">Scooby</p>
                <p className="text-xs text-muted-foreground">
                    {formatDateTime(timestamp)}
                </p>
                <p className="text-xs text-muted-foreground/70">
                    {companyName ? `Scope AI · ${companyName}` : 'Scope AI · Inget företag kopplat'}
                </p>
            </div>
        </div>
    )
}
