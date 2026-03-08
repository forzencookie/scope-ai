"use client"

import { useMemo } from "react"
import { useChatContext } from "@/providers/chat-provider"
import { Button } from "@/components/ui/button"
import {
    Plus,
    Search,
    MessageSquare,
    Settings,
    PanelLeft,
    Receipt,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Conversation } from "@/lib/chat-types"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"

function groupConversationsByDate(conversations: Conversation[]) {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const yesterday = today - 86400000
    const lastWeek = today - 7 * 86400000

    const groups: { label: string; convs: Conversation[] }[] = [
        { label: "Idag", convs: [] },
        { label: "Igår", convs: [] },
        { label: "Förra veckan", convs: [] },
        { label: "Tidigare", convs: [] },
    ]

    for (const conv of conversations) {
        const ts = conv.createdAt
        if (ts >= today) groups[0].convs.push(conv)
        else if (ts >= yesterday) groups[1].convs.push(conv)
        else if (ts >= lastWeek) groups[2].convs.push(conv)
        else groups[3].convs.push(conv)
    }

    return groups.filter(g => g.convs.length > 0)
}

// Placeholder activity items — later this comes from DB
const activityItems: { id: string; label: string; icon: typeof Receipt; time: string }[] = []

interface ChatHistorySidebarProps {
    onOpenSettings: () => void
    collapsed: boolean
    onToggleCollapse: () => void
}

export function ChatHistorySidebar({ onOpenSettings, collapsed, onToggleCollapse }: ChatHistorySidebarProps) {
    const {
        conversations,
        currentConversationId,
        loadConversation,
        handleNewConversation,
    } = useChatContext()

    const grouped = useMemo(
        () => groupConversationsByDate(conversations),
        [conversations]
    )

    return (
        <TooltipProvider delayDuration={0}>
            <div
                className={cn(
                    "hidden md:flex flex-col h-full shrink-0 transition-all duration-200 ease-in-out",
                    collapsed ? "w-[60px]" : "w-[260px] lg:w-[280px]"
                )}
            >
                {/* Top bar */}
                <div className={cn(
                    "flex items-center px-3 py-3",
                    collapsed ? "justify-center" : "justify-between"
                )}>
                    {collapsed ? (
                        /* Collapsed: logo acts as expand button */
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={onToggleCollapse}
                                    className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-accent transition-colors"
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src="/scope-ai-logo.svg" alt="Scope" className="h-6 w-6" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="right">Expandera</TooltipContent>
                        </Tooltip>
                    ) : (
                        /* Expanded: logo restarts, separate collapse button */
                        <>
                            <button
                                onClick={() => window.location.href = '/dashboard'}
                                className="flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-accent transition-colors"
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src="/scope-ai-logo.svg" alt="Scope" className="h-6 w-6" />
                                <span className="text-lg font-bold tracking-tight">Scope</span>
                            </button>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground"
                                        onClick={onToggleCollapse}
                                    >
                                        <PanelLeft className="h-[18px] w-[18px]" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="right">Minimera</TooltipContent>
                            </Tooltip>
                        </>
                    )}
                </div>

                {/* Action buttons */}
                <div className={cn("px-2 pb-2 flex flex-col gap-1", collapsed && "items-center")}>
                    {collapsed ? (
                        <>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 rounded-lg"
                                        onClick={handleNewConversation}
                                    >
                                        <Plus className="h-[18px] w-[18px]" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="right">Ny chatt</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 rounded-lg text-muted-foreground"
                                    >
                                        <Search className="h-[18px] w-[18px]" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="right">Sök</TooltipContent>
                            </Tooltip>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={handleNewConversation}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-foreground/10 text-sm font-medium transition-colors border-0 outline-none"
                            >
                                <Plus className="h-[18px] w-[18px] shrink-0" />
                                <span>Ny chatt</span>
                            </button>
                            <button
                                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                            >
                                <Search className="h-[18px] w-[18px] shrink-0" />
                                <span>Sök</span>
                            </button>
                        </>
                    )}
                </div>

                {/* Scrollable history area */}
                <div className="flex-1 overflow-y-auto px-2 scrollbar-thin">
                    {collapsed ? (
                        /* Collapsed: just icons for recent conversations */
                        <div className="flex flex-col items-center gap-1 pt-2">
                            {conversations.slice(0, 8).map((conv) => (
                                <Tooltip key={conv.id}>
                                    <TooltipTrigger asChild>
                                        <button
                                            onClick={() => loadConversation(conv.id)}
                                            className={cn(
                                                "flex items-center justify-center w-9 h-9 rounded-lg transition-colors",
                                                conv.id === currentConversationId
                                                    ? "bg-accent text-accent-foreground"
                                                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                                            )}
                                        >
                                            <MessageSquare className="h-4 w-4" />
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="right">{conv.title}</TooltipContent>
                                </Tooltip>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-5 pt-1">
                            {/* Section: Konversationer (AI chats) */}
                            <div>
                                <div className="px-3 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    Konversationer
                                </div>
                                {conversations.length === 0 ? (
                                    <div className="px-3 py-3 text-sm text-muted-foreground">
                                        Inga konversationer ännu
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-3">
                                        {grouped.map((group) => (
                                            <div key={group.label}>
                                                <div className="px-3 py-1 text-[11px] font-medium text-muted-foreground/70">
                                                    {group.label}
                                                </div>
                                                <div className="flex flex-col gap-0.5">
                                                    {group.convs.map((conv) => (
                                                        <button
                                                            key={conv.id}
                                                            onClick={() => loadConversation(conv.id)}
                                                            className={cn(
                                                                "flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg text-left transition-colors w-full",
                                                                conv.id === currentConversationId
                                                                    ? "bg-accent text-accent-foreground font-medium"
                                                                    : "hover:bg-accent/50 text-foreground/80"
                                                            )}
                                                        >
                                                            <MessageSquare className="h-4 w-4 shrink-0 opacity-50" />
                                                            <span className="truncate">{conv.title}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Section: Aktiviteter (completed actions) */}
                            <div>
                                <div className="px-3 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    Aktiviteter
                                </div>
                                {activityItems.length === 0 ? (
                                    <div className="px-3 py-3 text-sm text-muted-foreground">
                                        Inga aktiviteter ännu
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-0.5">
                                        {activityItems.map((item) => (
                                            <div
                                                key={item.id}
                                                className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg text-foreground/80"
                                            >
                                                <item.icon className="h-4 w-4 shrink-0 opacity-50" />
                                                <span className="truncate flex-1">{item.label}</span>
                                                <span className="text-[11px] text-muted-foreground shrink-0">{item.time}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Bottom: Settings */}
                <div className={cn("px-2 py-3", collapsed && "flex justify-center")}>
                    {collapsed ? (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 rounded-lg text-muted-foreground"
                                    onClick={onOpenSettings}
                                >
                                    <Settings className="h-[18px] w-[18px]" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right">Inställningar</TooltipContent>
                        </Tooltip>
                    ) : (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start gap-2.5 text-muted-foreground text-sm h-10 px-3"
                            onClick={onOpenSettings}
                        >
                            <Settings className="h-[18px] w-[18px]" />
                            <span>Inställningar</span>
                        </Button>
                    )}
                </div>
            </div>
        </TooltipProvider>
    )
}
