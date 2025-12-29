"use client"

import * as React from "react"
import { ChevronRight, type LucideIcon, Folder, Forward, MoreHorizontal, Trash2, BadgeCheck, Palette, ChevronsUpDown, CreditCard, LogOut, Settings, Sparkles, User, Sun, Moon, Monitor, Check, Plus } from "lucide-react"
import { useTheme } from "next-themes"
import Link from "next/link"
import { cn } from "@/lib/utils"

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useTextMode } from "@/providers/text-mode-provider"

// Icon color configuration for sidebar items (using both advanced and easy mode keys)
const iconColors: Record<string, { bg: string; icon: string }> = {
  // Economy - Advanced
  "Bokföring": { bg: "bg-emerald-500/15", icon: "text-emerald-500" },
  "Min bokföring": { bg: "bg-emerald-500/15", icon: "text-emerald-500" },
  "Rapporter": { bg: "bg-orange-500/15", icon: "text-orange-500" },
  "Löner": { bg: "bg-pink-500/15", icon: "text-pink-500" },
  "Ägare & Styrning": { bg: "bg-indigo-500/15", icon: "text-indigo-500" },
  "Ägarinfo": { bg: "bg-indigo-500/15", icon: "text-indigo-500" },
  // Settings
  "Inställningar": { bg: "bg-slate-500/15", icon: "text-slate-500" },
  "Företagsstatistik": { bg: "bg-cyan-500/15", icon: "text-cyan-500" },
  "Statistik": { bg: "bg-cyan-500/15", icon: "text-cyan-500" },
}

// Helper component for styled icons
function IconWrapper({ title, Icon }: { title: string; Icon: LucideIcon }) {
  const colors = iconColors[title]
  if (!colors) {
    // No color config - render plain icon
    return <Icon className="size-4" />
  }
  return (
    <span className={cn("flex items-center justify-center size-6 rounded", colors.bg)}>
      <Icon className={cn("size-4", colors.icon)} />
    </span>
  )
}
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuPortal } from "@/components/ui/dropdown-menu"
import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuAction, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, useSidebar } from "@/components/ui/sidebar"
import { SettingsDialog } from "../settings"

// ============================================================================
// NavMain - Main sidebar navigation with collapsible submenus
// ============================================================================

export function NavMain({
  items,
  label,
}: {
  items: {
    title: string
    titleEnkel?: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    muted?: boolean
    items?: { title: string; titleEnkel?: string; url: string }[]
  }[]
  label?: string
}) {
  const { isEnkel } = useTextMode()

  // Helper to get the correct title based on mode
  const getTitle = (item: { title: string; titleEnkel?: string }) => {
    return isEnkel && item.titleEnkel ? item.titleEnkel : item.title
  }

  return (
    <SidebarGroup>
      {label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarMenu>
        {items.map((item) => {
          const displayTitle = getTitle(item)
          return item.items && item.items.length > 0 ? (
            <Collapsible key={item.title} asChild defaultOpen={item.isActive} className="group/collapsible">
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={displayTitle}>
                  <Link href={item.url}>
                    {item.icon && <IconWrapper title={displayTitle} Icon={item.icon} />}
                    <span className="transition-opacity duration-200 group-data-[collapsible=icon]:opacity-0">{displayTitle}</span>
                  </Link>
                </SidebarMenuButton>
                <CollapsibleTrigger asChild>
                  <SidebarMenuAction className="data-[state=open]:rotate-90">
                    <ChevronRight />
                    <span className="sr-only">Toggle</span>
                  </SidebarMenuAction>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items?.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton asChild>
                          <Link href={subItem.url}><span>{getTitle(subItem)}</span></Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          ) : (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild tooltip={displayTitle} className={item.muted ? "opacity-50 hover:opacity-100 transition-opacity" : ""}>
                <Link href={item.url}>
                  {item.icon && <IconWrapper title={displayTitle} Icon={item.icon} />}
                  <span className="transition-opacity duration-200 group-data-[collapsible=icon]:opacity-0">{displayTitle}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}

// ============================================================================
// NavProjects - Projects list with dropdown actions
// ============================================================================

export function NavProjects({
  projects,
}: {
  projects: { name: string; url: string; icon: LucideIcon }[]
}) {
  const { isMobile } = useSidebar()

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Projects</SidebarGroupLabel>
      <SidebarMenu>
        {projects.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton asChild>
              <a href={item.url}>
                <item.icon />
                <span>{item.name}</span>
              </a>
            </SidebarMenuButton>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuAction showOnHover>
                  <MoreHorizontal />
                  <span className="sr-only">More</span>
                </SidebarMenuAction>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48 rounded-lg" side={isMobile ? "bottom" : "right"} align={isMobile ? "end" : "start"}>
                <DropdownMenuItem><Folder className="text-muted-foreground" /><span>View Project</span></DropdownMenuItem>
                <DropdownMenuItem><Forward className="text-muted-foreground" /><span>Share Project</span></DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem><Trash2 className="text-muted-foreground" /><span>Delete Project</span></DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        ))}
        <SidebarMenuItem>
          <SidebarMenuButton className="text-sidebar-foreground/70">
            <MoreHorizontal className="text-sidebar-foreground/70" />
            <span>More</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  )
}

// ============================================================================
// NavSettings - Simple settings navigation
// ============================================================================

export function NavSettings({
  items,
  onSettingsClick,
}: {
  items: { title: string; titleEnkel?: string; url: string; icon?: LucideIcon }[]
  onSettingsClick?: () => void
}) {
  const { isEnkel } = useTextMode()

  // Helper to get the correct title based on mode
  const getTitle = (item: { title: string; titleEnkel?: string }) => {
    return isEnkel && item.titleEnkel ? item.titleEnkel : item.title
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{isEnkel ? "Övrigt" : "Mer"}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const displayTitle = getTitle(item)
          return (
            <SidebarMenuItem key={item.title}>
              {item.title === "Inställningar" && onSettingsClick ? (
                <SidebarMenuButton onClick={onSettingsClick} tooltip={displayTitle}>
                  {item.icon && <IconWrapper title={displayTitle} Icon={item.icon} />}
                  <span className="transition-opacity duration-200 group-data-[collapsible=icon]:opacity-0">{displayTitle}</span>
                </SidebarMenuButton>
              ) : (
                <SidebarMenuButton asChild tooltip={displayTitle}>
                  <Link href={item.url}>
                    {item.icon && <IconWrapper title={displayTitle} Icon={item.icon} />}
                    <span className="transition-opacity duration-200 group-data-[collapsible=icon]:opacity-0">{displayTitle}</span>
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

// Export IconWrapper and iconColors for use in other components
export { IconWrapper, iconColors }

// ============================================================================
// NavAIConversations - Quick access to recent AI conversations in sidebar
// ============================================================================

const AI_STORAGE_KEY = 'ai-robot-conversations'

interface AIConversation {
  id: string
  title: string
  updatedAt: number
}

export function NavAIConversations() {
  const [conversations, setConversations] = React.useState<AIConversation[]>([])
  const [isOpen, setIsOpen] = React.useState(true)

  // Load conversations from localStorage
  React.useEffect(() => {
    const stored = localStorage.getItem(AI_STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as AIConversation[]
        setConversations(parsed.slice(0, 4)) // Only show first 4
      } catch {
        console.error('Failed to parse AI conversations')
      }
    }
  }, [])

  // Listen for storage changes (when conversations are updated)
  React.useEffect(() => {
    const handleStorageChange = () => {
      const stored = localStorage.getItem(AI_STORAGE_KEY)
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as AIConversation[]
          setConversations(parsed.slice(0, 4))
        } catch {
          // Silent fail
        }
      }
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const totalCount = React.useMemo(() => {
    const stored = localStorage.getItem(AI_STORAGE_KEY)
    if (stored) {
      try {
        return JSON.parse(stored).length
      } catch {
        return 0
      }
    }
    return 0
  }, [conversations])

  if (conversations.length === 0) return null

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center">
          <SidebarGroupLabel className="flex-1">AI Konversationer</SidebarGroupLabel>
          <CollapsibleTrigger asChild>
            <button className="h-5 w-5 flex items-center justify-center rounded hover:bg-muted text-muted-foreground">
              <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", isOpen && "rotate-90")} />
            </button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          <SidebarMenu>
            {conversations.map((conv) => (
              <SidebarMenuItem key={conv.id}>
                <SidebarMenuButton asChild>
                  <Link href={`/dashboard/ai-robot?conversation=${conv.id}`}>
                    <span className="truncate">{conv.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
            {totalCount > 4 && (
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="text-muted-foreground">
                  <Link href="/dashboard/ai-robot">
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
