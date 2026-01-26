"use client"


import * as React from "react"
import { PanelLeft, Sparkles, type LucideIcon, Settings2, LayoutGrid } from "lucide-react"

import { NavSettings, NavCollapsibleSection, NavAIConversations } from "./sidebar"
import { UserTeamSwitcher } from "./user-team-switcher"
import { AIChatSidebar } from "./ai-chat-sidebar"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
  useSidebar,
} from "@/components/ui/sidebar"
import { SettingsDialog } from "@/components/installningar/settings-dialog"
import { SidebarModeDropdown } from "./sidebar-mode-dropdown"
import { AI_CHAT_EVENT } from "@/lib/ai/context"
import { useAuth } from "@/hooks/use-auth"

// Import data from the data layer
import {
  navBokforing,
  navRapporter,
  navLoner,
  navAgare,
  navSettings
} from "../../data/app-navigation"
import { getTeams } from "@/services/navigation"
import { Building2, Box } from "lucide-react"

// Default team based on company provider
const defaultTeam = {
  id: 'default',
  name: 'Mitt Företag',
  logo: Building2,
  plan: 'Free',
}

export type SidebarMode = "navigation" | "ai-chat"

interface AppSidebarProps extends Omit<React.ComponentProps<typeof Sidebar>, "variant"> {
  /** 'default' shows full navigation, 'minimal' shows empty sidebar with custom header */
  variant?: "default" | "minimal" | "inset"
  /** Custom header config for minimal variant */
  minimalHeader?: {
    icon?: LucideIcon
    iconClassName?: string
    title: string
    subtitle?: string
  }
  /** Mode of the sidebar (controlled) */
  mode?: SidebarMode
  /** Callback when mode changes */
  onModeChange?: (mode: SidebarMode) => void
}



export function AppSidebar({
  variant = "default",
  minimalHeader,
  mode,
  onModeChange,
  ...props
}: AppSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const settingsParam = searchParams?.get("settings")
  const { state, toggleSidebar } = useSidebar()
  const { user } = useAuth()

  // Build user object from auth, with fallbacks
  const currentUser = {
    name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Användare',
    email: user?.email || '',
    avatar: user?.user_metadata?.avatar_url || '',
  }

  // Teams state - fetched from API
  const [teams, setTeams] = React.useState([defaultTeam])
  
  React.useEffect(() => {
    getTeams().then(response => {
      if (response.success && response.data && response.data.length > 0) {
        // Map teams to include logo icons
        const mappedTeams = response.data.map((team, i) => ({
          id: team.id || `team-${i}`,
          name: team.name,
          logo: i === 0 ? Box : Building2,
          plan: team.plan || 'Free',
        }))
        setTeams(mappedTeams)
      }
    }).catch(console.error)
  }, [])

  // Sidebar mode state (internal state for uncontrolled)
  const [internalMode, setInternalMode] = React.useState<SidebarMode>("navigation")

  // Use controlled mode if provided, otherwise internal
  const sidebarMode = mode ?? internalMode

  // State for settings dialog
  const [settingsOpen, setSettingsOpen] = React.useState(!!settingsParam)

  // Sync state with URL param
  React.useEffect(() => {
    setSettingsOpen(!!settingsParam)
  }, [settingsParam])

  // Handle opening settings (pushes to history for back button support)
  const handleOpenSettings = React.useCallback(() => {
    const params = new URLSearchParams(searchParams?.toString())
    params.set("settings", "Konto") // Default tab
    router.push(`${pathname}?${params.toString()}`)
  }, [router, pathname, searchParams])

  // Handle dialog state change
  const handleSettingsOpenChange = (open: boolean) => {
    if (!open && settingsParam) {
      const params = new URLSearchParams(searchParams?.toString())
      params.delete("settings")
      router.replace(`${pathname}?${params.toString()}`)
    } else if (open && !settingsParam) {
      handleOpenSettings()
    }
    setSettingsOpen(open)
  }

  // Handle global AI chat events
  React.useEffect(() => {
    const handleOpenAIChat = () => {
      setInternalMode("ai-chat")
      if (onModeChange) onModeChange("ai-chat")
    }

    const handleLoadConversation = () => {
      setInternalMode("ai-chat")
      if (onModeChange) onModeChange("ai-chat")
    }

    window.addEventListener(AI_CHAT_EVENT, handleOpenAIChat)
    window.addEventListener("load-conversation", handleLoadConversation)

    return () => {
      window.removeEventListener(AI_CHAT_EVENT, handleOpenAIChat)
      window.removeEventListener("load-conversation", handleLoadConversation)
    }
  }, [onModeChange])

  // Default minimal header for AI workspace style
  const header = minimalHeader ?? {
    icon: Sparkles,
    iconClassName: "text-purple-500",
    title: "AI Workspace",
    subtitle: "Ditt AI-verktyg"
  }
  const HeaderIcon = header.icon ?? Sparkles

  if (variant === "minimal") {
    return (
      <Sidebar {...props} collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-default hover:bg-transparent"
                onClick={() => {
                  if (state === "collapsed") {
                    toggleSidebar()
                  }
                }}
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <HeaderIcon className={`size-4 ${header.iconClassName ?? "text-purple-500"}`} />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{header.title}</span>
                  {header.subtitle && (
                    <span className="truncate text-xs text-muted-foreground">{header.subtitle}</span>
                  )}
                </div>
              </SidebarMenuButton>
              <SidebarMenuAction
                showOnHover
                className="cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation()
                  toggleSidebar()
                }}
              >
                <PanelLeft />
                <span className="sr-only">Toggle Sidebar</span>
              </SidebarMenuAction>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          {/* Empty - minimal variant has no navigation */}
        </SidebarContent>
      </Sidebar>
    )
  }

  // Determine sidebar variant to pass to underlying Sidebar
  const sidebarVariant = variant === "inset" ? "inset" : undefined

  return (
    <>
      <SettingsDialog
        open={settingsOpen}
        onOpenChange={handleSettingsOpenChange}
        defaultTab={settingsParam || undefined}
      />
      <Sidebar
        collapsible="offcanvas"
        variant={sidebarVariant}
        style={
          {
            "--sidebar-width": sidebarMode === "ai-chat" ? "400px" : "300px",
          } as React.CSSProperties
        }
        {...props}
      >
        <SidebarHeader className="p-0 px-2 pt-1">
          <SidebarModeDropdown mode={sidebarMode} onModeChange={onModeChange || setInternalMode} />
        </SidebarHeader>

        <SidebarContent>
          {sidebarMode === "navigation" ? (
            <>
              {/* Section header for modules */}
              <div className="px-4 pt-4 pb-1 flex items-center gap-1.5">
                <LayoutGrid className="h-4 w-4 text-muted-foreground/70" />
                <span className="text-xs font-medium text-muted-foreground/70">Moduler</span>
              </div>

              {/* Collapsible navigation items */}
              <NavCollapsibleSection
                items={navBokforing}
                label="Bokföring"
                storageKey="bokforing"
              />
              <NavCollapsibleSection
                items={navLoner}
                label="Löner"
                storageKey="loner"
              />
              <NavCollapsibleSection
                items={navRapporter}
                label="Rapporter"
                storageKey="rapporter"
              />
              <NavCollapsibleSection
                items={navAgare}
                label="Ägare & Styrning"
                storageKey="agare"
              />

              {/* AI Conversations section - fills middle space */}
              <NavAIConversations />

              {/* Settings section at bottom - simple header style */}
              <NavSettings items={navSettings} onSettingsClick={handleOpenSettings} icon={Settings2} />
            </>
          ) : (
            <AIChatSidebar mode={sidebarMode} onModeChange={onModeChange || setInternalMode} />
          )}
        </SidebarContent>

        {sidebarMode === "navigation" && (
          <SidebarFooter>
            <UserTeamSwitcher user={currentUser} teams={teams} />
          </SidebarFooter>
        )}


      </Sidebar>

    </>
  )
}


