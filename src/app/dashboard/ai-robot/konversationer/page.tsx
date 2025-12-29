"use client"

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { MessageSquare, Trash2, Plus, Search } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface Conversation {
    id: string
    title: string
    messages: any[]
    createdAt: number
    updatedAt: number
}

const STORAGE_KEY = 'ai-robot-conversations'

export default function KonversationerPage() {
    const router = useRouter()
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [searchQuery, setSearchQuery] = useState("")

    // Load conversations from localStorage
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
            try {
                const parsed = JSON.parse(stored) as Conversation[]
                setConversations(parsed)
            } catch {
                console.error('Failed to parse stored conversations')
            }
        }
    }, [])

    // Delete a conversation
    const deleteConversation = (conversationId: string, e: React.MouseEvent) => {
        e.stopPropagation()
        const updated = conversations.filter(c => c.id !== conversationId)
        setConversations(updated)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    }

    // Filter conversations by search
    const filteredConversations = conversations.filter(conv =>
        conv.title.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="flex flex-col h-svh">
            {/* Header */}
            <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                <div className="flex items-center gap-2 px-4 flex-1">
                    <SidebarTrigger className="-ml-1" />
                    <Separator
                        orientation="vertical"
                        className="mr-2 data-[orientation=vertical]:h-4"
                    />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <Link href="/dashboard/ai-robot" className="text-muted-foreground hover:text-foreground transition-colors">
                                    AI Robot
                                </Link>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Konversationer</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
                <div className="flex items-center gap-2 px-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-full hover:bg-muted"
                        aria-label="Ny konversation"
                        onClick={() => router.push('/dashboard/ai-robot')}
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
            </header>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 pb-8">
                <div className="w-full max-w-2xl mx-auto py-6">
                    <h1 className="text-2xl font-semibold mb-6">Konversationer</h1>

                    {/* Search */}
                    <div className="relative mb-6">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Sök konversationer..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-10 pl-10 pr-4 rounded-lg border border-border/60 bg-muted/30 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20"
                        />
                    </div>

                    {/* Conversations list */}
                    {filteredConversations.length === 0 ? (
                        <div className="text-center py-12">
                            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                            <p className="text-muted-foreground">
                                {searchQuery ? "Inga konversationer hittades" : "Inga konversationer ännu"}
                            </p>
                            <Button
                                variant="outline"
                                className="mt-4"
                                onClick={() => router.push('/dashboard/ai-robot')}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Starta ny konversation
                            </Button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {filteredConversations.map((conv) => (
                                <button
                                    key={conv.id}
                                    onClick={() => router.push(`/dashboard/ai-robot?conversation=${conv.id}`)}
                                    className={cn(
                                        "flex items-center gap-3 p-4 rounded-xl border border-border/50 text-left transition-colors group",
                                        "bg-card hover:bg-muted/50"
                                    )}
                                >
                                    <MessageSquare className="h-5 w-5 shrink-0 text-muted-foreground" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{conv.title}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(conv.updatedAt).toLocaleDateString('sv-SE')} · {conv.messages.length} meddelanden
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                                        onClick={(e) => deleteConversation(conv.id, e)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
