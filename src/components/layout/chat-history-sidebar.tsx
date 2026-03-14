"use client"

import { useMemo, useState } from "react"
import { useChatContext } from "@/providers/chat-provider"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    Plus,
    Search,
    MessageSquare,
    Settings,
    PanelLeft,
    Receipt,
    User,
    Trash2,
} from "lucide-react"
import { UserTeamSwitcher } from "@/components/layout/user-team-switcher"
import { Box } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Conversation } from "@/lib/chat-types"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { SearchDialog } from "@/components/layout/search-dialog"

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
    collapsed: boolean
    onToggleCollapse: () => void
    onOpenSettings: () => void
}

export function ChatHistorySidebar({ collapsed, onToggleCollapse, onOpenSettings }: ChatHistorySidebarProps) {
    const { user } = useAuth()
    const {
        conversations,
        currentConversationId,
        loadConversation,
        handleNewConversation,
        deleteConversation,
    } = useChatContext()

    const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Användare'
    const userEmail = user?.email || ''
    const userAvatar = user?.user_metadata?.avatar_url || ''

    const [searchOpen, setSearchOpen] = useState(false)

    // Filter out incognito conversations from sidebar
    const visibleConversations = useMemo(
        () => conversations.filter(c => !c.isIncognito),
        [conversations]
    )

    const grouped = useMemo(
        () => groupConversationsByDate(visibleConversations),
        [visibleConversations]
    )

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation()
        deleteConversation(id)
    }

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
                                        onClick={() => setSearchOpen(true)}
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
                                onClick={() => setSearchOpen(true)}
                                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-accent dark:hover:bg-accent/50 hover:text-foreground transition-colors"
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
                            {visibleConversations.slice(0, 8).map((conv) => (
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
                                {visibleConversations.length === 0 ? (
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
                                                        <div
                                                            key={conv.id}
                                                            className={cn(
                                                                "group flex items-center justify-between gap-2.5 px-3 py-2 text-sm rounded-lg transition-colors w-full cursor-pointer",
                                                                conv.id === currentConversationId
                                                                    ? "bg-accent text-accent-foreground font-medium"
                                                                    : "hover:bg-accent/50 text-foreground/80"
                                                            )}
                                                            onClick={() => loadConversation(conv.id)}
                                                        >
                                                            <span className="truncate flex-1">{conv.title}</span>
                                                            <button
                                                                onClick={(e) => handleDelete(e, conv.id)}
                                                                className={cn(
                                                                    "shrink-0 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive",
                                                                    // Show icon immediately if it's the active conversation to make it clear you can delete it
                                                                    conv.id === currentConversationId && "opacity-50 hover:opacity-100"
                                                                )}
                                                                title="Radera chatt"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>
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

                {/* Bottom: Settings + User */}
                <div className={cn("px-2 py-3 flex flex-col gap-1", collapsed && "items-center")}>
                    {collapsed ? (
                        <>
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
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div>
                                        <UserTeamSwitcher
                                            user={{ name: userName, email: userEmail, avatar: userAvatar }}
                                            teams={[{ name: 'Mitt Företag', logo: Box }]}
                                            compact
                                        />
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent side="right">{userName}</TooltipContent>
                            </Tooltip>
                        </>
                    ) : (
                        <>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start gap-2.5 text-muted-foreground text-sm h-10 px-3"
                                onClick={onOpenSettings}
                            >
                                <Settings className="h-[18px] w-[18px]" />
                                <span>Inställningar</span>
                            </Button>
                            <UserTeamSwitcher
                                user={{ name: userName, email: userEmail, avatar: userAvatar }}
                                teams={[{ name: 'Mitt Företag', logo: Box }]}
                            />
                        </>
                    )}
                </div>
            </div>
            <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
        </TooltipProvider>
    )
}
