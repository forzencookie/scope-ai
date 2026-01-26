"use client"

import * as React from "react"
import { Plus, Loader2 } from "lucide-react"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { PixelDog } from "./pixel-dog"

// ============================================================================
// NavAIConversations - AI conversation history in sidebar with pixel dog
// ============================================================================

interface AIConversation {
  id: string
  title: string
  updatedAt: number
}

export function NavAIConversations() {
  const [conversations, setConversations] = React.useState<AIConversation[]>([])
  const [totalCount, setTotalCount] = React.useState(0)
  const [isLoading, setIsLoading] = React.useState(true)

  // Fetch conversations from Supabase via API
  const fetchConversations = React.useCallback(async () => {
    try {
      const res = await fetch('/api/chat/history')
      if (res.ok) {
        const data = await res.json()
        // Map to sidebar format
        const mapped = data.map((conv: { id: string; title: string; updated_at?: string; created_at: string }) => ({
          id: conv.id,
          title: conv.title || 'Ny konversation',
          updatedAt: new Date(conv.updated_at || conv.created_at).getTime()
        }))
        // Sort by most recent first
        const sorted = mapped.sort((a: AIConversation, b: AIConversation) => b.updatedAt - a.updatedAt)
        setConversations(sorted.slice(0, 4))
        setTotalCount(sorted.length)
      }
    } catch (error) {
      console.error('Failed to fetch AI conversations:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Initial load
  React.useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  // Listen for update events to refresh the list
  React.useEffect(() => {
    const handleUpdate = () => {
      fetchConversations()
    }

    window.addEventListener('ai-conversations-updated', handleUpdate)

    // Polling every 30 seconds (only when tab is visible)
    const pollInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchConversations()
      }
    }, 30000)

    // Refetch when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchConversations()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('ai-conversations-updated', handleUpdate)
      clearInterval(pollInterval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [fetchConversations])

  // Handler to open AI mode with history
  const handleOpenAIHistory = () => {
    window.dispatchEvent(new CustomEvent("open-ai-chat", { detail: { showHistory: true } }))
  }

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden flex-1 flex flex-col">
      {/* Header - clicking opens AI mode with history */}
      <SidebarGroupLabel className="p-0">
        <button
          onClick={handleOpenAIHistory}
          className="flex h-8 w-full items-center px-2 text-xs font-medium text-sidebar-foreground/70 outline-none ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md transition-colors"
        >
          AI Konversationer
        </button>
      </SidebarGroupLabel>

      {/* Conversations list with rounded border - grows to fill space */}
      <div className="mt-1 rounded-lg border-2 border-dotted border-black/30 dark:border-white/50 flex-1 flex flex-col group/dog">
        <SidebarMenu className="p-1 flex-1 flex flex-col">
          {isLoading ? (
            // Skeleton with spinner while loading
            <SidebarMenuItem>
              <div className="flex h-8 w-full items-center px-2 gap-2">
                <div className="h-4 flex-1 rounded bg-sidebar-accent/50 animate-pulse" />
                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
              </div>
            </SidebarMenuItem>
          ) : conversations.length === 0 ? (
            // Empty state - minimalistic with interactive pixel dog and simple button
            <div className="flex-1 flex flex-col items-center justify-center py-8 px-4">
              {/* Interactive Pixel Art Dog */}
              <PixelDog className="mb-4" />
              <p className="text-sm text-muted-foreground text-center mb-1">
                Inga konversationer än
              </p>
              <p className="text-xs text-muted-foreground/70 text-center mb-4">
                Ställ en fråga till AI:n
              </p>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent("open-ai-chat"))}
                className="inline-flex items-center gap-2 h-9 px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
              >
                <Plus className="h-4 w-4" />
                Starta chatt
              </button>
            </div>
          ) : (
            conversations.map((conv) => (
              <SidebarMenuItem key={conv.id}>
                <SidebarMenuButton
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent("load-conversation", { detail: conv.id }))
                  }}
                >
                  <span className="truncate">{conv.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))
          )}
          {totalCount > 4 && (
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleOpenAIHistory} className="text-muted-foreground">
                <span>Visa alla ({totalCount})</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </div>
    </SidebarGroup>
  )
}
