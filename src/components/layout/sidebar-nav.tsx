"use client"

import * as React from "react"
import { ChevronRight, type LucideIcon, Folder, Forward, MoreHorizontal, Trash2, BadgeCheck, Palette, ChevronsUpDown, CreditCard, LogOut, Settings, Sparkles, User, Sun, Moon, Monitor, Check, Plus, Loader2 } from "lucide-react"
import { useTheme } from "next-themes"
import Link from "next/link"
import { cn } from "@/lib/utils"

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useTextMode } from "@/providers/text-mode-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupAction,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { SettingsDialog } from "../settings"

// ============================================================================
// NavSection - Shadcn-style section with "More" dropdown
// ============================================================================

export function NavSection({
  items,
  label,
  ...props
}: {
  items: {
    title: string
    titleEnkel?: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
  }[]
  label: string
  icon?: LucideIcon
}) {
  const { isMobile } = useSidebar()
  const { isEnkel } = useTextMode()

  // Helper to get the correct title based on mode
  const getTitle = (item: { title: string; titleEnkel?: string }) => {
    return isEnkel && item.titleEnkel ? item.titleEnkel : item.title
  }

  // Split items into visible (first 3) and hidden (rest)
  const visibleItems = items.slice(0, 3)
  const hiddenItems = items.slice(3)

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel className="pl-1 flex items-center">
        {label}
        {props.icon && <props.icon className="ml-2 h-4 w-4 text-muted-foreground" />}
      </SidebarGroupLabel>

      <SidebarMenu>
        {visibleItems.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton asChild tooltip={getTitle(item)} className="pl-1">
              <Link href={item.url}>
                <span>{getTitle(item)}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}

        {hiddenItems.length > 0 && (
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="text-sidebar-foreground/70 pl-1">
                  <MoreHorizontal className="text-sidebar-foreground/70" />
                  <span>Mer</span>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-48 rounded-lg"
                side={isMobile ? "bottom" : "right"}
                align={isMobile ? "end" : "start"}
              >
                {hiddenItems.map((item) => (
                  <DropdownMenuItem key={item.title} asChild>
                    <Link href={item.url} className="cursor-pointer">
                      <span>{item.title}</span>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        )}
      </SidebarMenu>
    </SidebarGroup >
  )
}

// ============================================================================
// NavSettings - Simple settings navigation
// ============================================================================

export function NavSettings({
  items,
  onSettingsClick,
  icon: Icon,
}: {
  items: { title: string; titleEnkel?: string; url: string; icon?: LucideIcon }[]
  onSettingsClick?: () => void
  icon?: LucideIcon
}) {
  const { isEnkel } = useTextMode()

  // Helper to get the correct title based on mode
  const getTitle = (item: { title: string; titleEnkel?: string }) => {
    return isEnkel && item.titleEnkel ? item.titleEnkel : item.title
  }

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel className="pl-1 flex items-center">
        {isEnkel ? "Övrigt" : "Mer"}
        {Icon && <Icon className="ml-2 h-4 w-4 text-muted-foreground" />}
      </SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const displayTitle = getTitle(item)
          return (
            <SidebarMenuItem key={item.title}>
              {item.title === "Inställningar" && onSettingsClick ? (
                <SidebarMenuButton onClick={onSettingsClick} tooltip={displayTitle} className="pl-1">
                  <span>{displayTitle}</span>
                </SidebarMenuButton>
              ) : (
                <SidebarMenuButton asChild tooltip={displayTitle} className="pl-1">
                  <Link href={item.url}>
                    <span>{displayTitle}</span>
                  </Link>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}


const AI_STORAGE_KEY = 'ai-robot-conversations' // Legacy, kept for reference

interface AIConversation {
  id: string
  title: string
  updatedAt: number
}

export function NavAIConversations() {
  const [conversations, setConversations] = React.useState<AIConversation[]>([])
  const [totalCount, setTotalCount] = React.useState(0)
  const [isOpen, setIsOpen] = React.useState(true)
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

  // Always show the section header, even if empty
  // (conversations list will just be empty inside)

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center group/label">
          <SidebarGroupLabel className="flex-1 p-0">
            <Link
              href="/dashboard/konversationer"
              className="flex h-8 w-full items-center px-2 text-xs font-medium text-sidebar-foreground/70 outline-none ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md transition-colors"
            >
              AI Konversationer
            </Link>
          </SidebarGroupLabel>
          <CollapsibleTrigger asChild>
            <button className="h-6 w-6 flex items-center justify-center rounded hover:bg-sidebar-accent text-sidebar-foreground/70 transition-colors ml-1">
              <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", isOpen && "rotate-90")} />
            </button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          <SidebarMenu>
            {isLoading ? (
              // Skeleton with spinner while loading
              <SidebarMenuItem>
                <div className="flex h-8 w-full items-center px-2 gap-2">
                  <div className="h-4 flex-1 rounded bg-sidebar-accent/50 animate-pulse" />
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                </div>
              </SidebarMenuItem>
            ) : conversations.length === 0 ? (
              // Empty state
              <SidebarMenuItem>
                <span className="text-xs text-muted-foreground px-2 py-1">
                  Inga konversationer än
                </span>
              </SidebarMenuItem>
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
                <SidebarMenuButton asChild className="text-muted-foreground">
                  <Link href="/dashboard/konversationer">
                    <span>Visa alla ({totalCount})</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </CollapsibleContent>
      </Collapsible>
    </SidebarGroup>
  )
}

// ============================================================================
// NavUser - User profile dropdown in sidebar
// ============================================================================

export function NavUser({
  user,
}: {
  user: { name: string; email: string; avatar: string }
}) {
  const { isMobile } = useSidebar()
  const [settingsOpen, setSettingsOpen] = React.useState(false)
  const { theme, setTheme } = useTheme()

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg bg-muted"><User className="h-4 w-4" /></AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight transition-[opacity,width] duration-200 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:w-0">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
                <ChevronsUpDown className="ml-auto size-4 transition-[opacity,width] duration-200 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:w-0" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg" side={isMobile ? "bottom" : "right"} align="end" sideOffset={4}>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="rounded-lg bg-muted"><User className="h-4 w-4" /></AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="truncate text-xs">{user.email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="my-1" />
              <DropdownMenuGroup className="py-0">
                <DropdownMenuItem><Sparkles />Uppgradera till Pro</DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator className="my-1" />
              <DropdownMenuGroup className="py-0">
                <DropdownMenuItem><BadgeCheck />Konto</DropdownMenuItem>
                <DropdownMenuItem><CreditCard />Fakturering</DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger><Palette className="mr-2 h-4 w-4" />Utseende</DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem onClick={() => setTheme("light")}>
                        <Sun className="mr-2 h-4 w-4" />
                        Ljus
                        {theme === "light" && <Check className="ml-auto h-4 w-4" />}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTheme("dark")}>
                        <Moon className="mr-2 h-4 w-4" />
                        Mörk
                        {theme === "dark" && <Check className="ml-auto h-4 w-4" />}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setTheme("system")}>
                        <Monitor className="mr-2 h-4 w-4" />
                        System
                        {theme === "system" && <Check className="ml-auto h-4 w-4" />}
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
                <DropdownMenuItem onSelect={() => setSettingsOpen(true)}><Settings />Inställningar</DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator className="my-1" />
              <DropdownMenuItem><LogOut />Logga ut</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  )
}
