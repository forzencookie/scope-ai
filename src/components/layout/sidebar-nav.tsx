// @ts-nocheck
"use client"

import * as React from "react"
import { ChevronRight, type LucideIcon, Folder, Forward, MoreHorizontal, Trash2, BadgeCheck, Palette, ChevronsUpDown, CreditCard, LogOut, Settings, Sparkles, User, Sun, Moon, Monitor, Check, Plus, Loader2 } from "lucide-react"
import { useTheme } from "next-themes"
import Link from "next/link"
import { cn } from "@/lib/utils"

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useTextMode } from "@/providers/text-mode-provider"
import { useCompany } from "@/providers/company-provider"
import type { FeatureKey } from "@/lib/company-types"
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
import { SettingsDialog } from "@/components/installningar/settings-dialog"

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
// NavCollapsibleSection - Collapsible section with localStorage persistence
// ============================================================================

export function NavCollapsibleSection({
  items,
  label,
  storageKey,
  defaultOpen = false,
  icon: Icon,
}: {
  items: {
    title: string
    titleEnkel?: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    featureKey?: FeatureKey
  }[]
  label: string
  storageKey: string
  defaultOpen?: boolean
  icon?: LucideIcon
}) {
  const { isEnkel } = useTextMode()
  const { hasFeature } = useCompany()

  // Filter items based on company features
  const filteredItems = React.useMemo(() => {
    return items.filter(item => {
      if (!item.featureKey) return true // No feature requirement = always show
      return hasFeature(item.featureKey)
    })
  }, [items, hasFeature])

  // Initialize from localStorage
  const [isOpen, setIsOpen] = React.useState(() => {
    if (typeof window === 'undefined') return defaultOpen
    const stored = localStorage.getItem(`sidebar-section-${storageKey}`)
    return stored !== null ? stored === 'true' : defaultOpen
  })

  // Persist to localStorage
  const handleOpenChange = React.useCallback((open: boolean) => {
    setIsOpen(open)
    localStorage.setItem(`sidebar-section-${storageKey}`, String(open))
  }, [storageKey])

  // Helper to get the correct title based on mode
  const getTitle = (item: { title: string; titleEnkel?: string }) => {
    return isEnkel && item.titleEnkel ? item.titleEnkel : item.title
  }

  if (filteredItems.length === 0) return null

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden py-0">
      <Collapsible open={isOpen} onOpenChange={handleOpenChange}>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton className="h-8">
            <span className="flex-1 text-left text-sm">{label}</span>
            <ChevronRight className={cn(
              "h-4 w-4 text-muted-foreground/50 transition-transform duration-200",
              isOpen && "rotate-90"
            )} />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenu>
            {filteredItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild tooltip={getTitle(item)} className="pl-6 h-8">
                  <Link href={item.url}>
                    <span className="text-sm">{getTitle(item)}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </CollapsibleContent>
      </Collapsible>
    </SidebarGroup>
  )
}

// ============================================================================
// NavSettings - Simple section header with items (not collapsible, not a card)
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

  const label = isEnkel ? "Övrigt" : "Mer"

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel className="px-2 text-xs font-medium text-muted-foreground/70 flex items-center gap-1.5">
        {Icon && <Icon className="h-4 w-4" />}
        {label}
      </SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const displayTitle = getTitle(item)
          return (
            <SidebarMenuItem key={item.title}>
              {item.title === "Inställningar" && onSettingsClick ? (
                <SidebarMenuButton onClick={onSettingsClick} tooltip={displayTitle} className="h-8">
                  <span className="text-sm">{displayTitle}</span>
                </SidebarMenuButton>
              ) : (
                <SidebarMenuButton asChild tooltip={displayTitle} className="h-8">
                  <Link href={item.url}>
                    <span className="text-sm">{displayTitle}</span>
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
              <div
                className="mb-4 cursor-pointer"
                onClick={() => {
                  // Little bark animation
                  const dog = document.getElementById('pixel-dog')
                  if (dog) {
                    dog.classList.add('animate-bounce')
                    setTimeout(() => dog.classList.remove('animate-bounce'), 500)
                  }
                }}
              >
                <svg id="pixel-dog" width="48" height="48" viewBox="0 0 16 16" shapeRendering="crispEdges">
                  {/* Ears - wiggle on hover */}
                  <rect x="2" y="2" width="2" height="3" className="fill-amber-600 dark:fill-amber-500 origin-bottom group-hover/dog:animate-pulse" />
                  <rect x="12" y="2" width="2" height="3" className="fill-amber-600 dark:fill-amber-500 origin-bottom group-hover/dog:animate-pulse" />
                  {/* Head */}
                  <rect x="3" y="4" width="10" height="6" className="fill-amber-400 dark:fill-amber-300" />
                  {/* Face markings */}
                  <rect x="5" y="5" width="6" height="4" className="fill-amber-100 dark:fill-amber-50" />
                  {/* Eyes - visible by default, hidden on hover */}
                  <g className="group-hover/dog:hidden">
                    <rect x="5" y="6" width="2" height="2" className="fill-gray-800 dark:fill-gray-900" />
                    <rect x="9" y="6" width="2" height="2" className="fill-gray-800 dark:fill-gray-900" />
                    <rect x="5" y="6" width="1" height="1" className="fill-white" />
                    <rect x="9" y="6" width="1" height="1" className="fill-white" />
                  </g>

                  {/* Closed Eyes (^ ^) - hidden by default, visible on hover */}
                  <g className="hidden group-hover/dog:block">
                    {/* Left Eye ^ */}
                    <rect x="5" y="7" width="1" height="1" className="fill-gray-800 dark:fill-gray-900" />
                    <rect x="6" y="6" width="1" height="1" className="fill-gray-800 dark:fill-gray-900" />
                    <rect x="7" y="7" width="1" height="1" className="fill-gray-800 dark:fill-gray-900" />

                    {/* Right Eye ^ */}
                    <rect x="9" y="7" width="1" height="1" className="fill-gray-800 dark:fill-gray-900" />
                    <rect x="10" y="6" width="1" height="1" className="fill-gray-800 dark:fill-gray-900" />
                    <rect x="11" y="7" width="1" height="1" className="fill-gray-800 dark:fill-gray-900" />
                  </g>
                  {/* Nose */}
                  <rect x="7" y="8" width="2" height="1" className="fill-gray-800 dark:fill-gray-900" />
                  {/* Tongue - always visible for happy face */}
                  <rect x="7" y="9" width="2" height="1" className="fill-pink-400" />
                  {/* Body */}
                  <rect x="4" y="10" width="8" height="4" className="fill-amber-400 dark:fill-amber-300" />
                  {/* Chest */}
                  <rect x="6" y="10" width="4" height="3" className="fill-amber-100 dark:fill-amber-50" />
                  {/* Tail - static */}
                  <rect x="12" y="11" width="2" height="2" className="fill-amber-600 dark:fill-amber-500 origin-left" />
                  {/* Feet */}
                  <rect x="4" y="14" width="2" height="1" className="fill-amber-600 dark:fill-amber-500" />
                  <rect x="10" y="14" width="2" height="1" className="fill-amber-600 dark:fill-amber-500" />
                </svg>
              </div>
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
