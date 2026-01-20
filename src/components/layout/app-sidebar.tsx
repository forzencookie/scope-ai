"use client"


import * as React from "react"
import { PanelLeft, Sparkles, type LucideIcon, Monitor, Calculator, Users, PieChart, Briefcase, Settings2, FileText, PiggyBank } from "lucide-react"

import { NavSettings, NavSection } from "./sidebar-nav"
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
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar"
import { SettingsDialog } from "../settings"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { SidebarModeDropdown } from "./sidebar-mode-dropdown"
import { hasFeature } from "@/lib/company-types"
import type { CompanyType, FeatureKey } from "@/lib/company-types"
import type { NavItem } from "@/types"
import { AI_CHAT_EVENT } from "@/lib/ai-context"

// Import data from the data layer
import {
  mockUser,
  mockTeams,
  navBokforing,
  navRapporter,
  navLoner,
  navAgare,
  navSettings
} from "../../data/app-navigation"

export type SidebarMode = "navigation" | "ai-chat"
export type NavTab = "verksamhet" | "bolaget"

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

// Helper to filter and render a group of modules
function ModuleGroup({ items, label, companyType, icon: Icon }: { items: NavItem[], label: string, companyType: CompanyType, icon?: LucideIcon }) {
  // Filter items based on company features
  const filteredItems = React.useMemo(() => {
    return items.filter(item => {
      // If item requires a feature key, check it
      if (item.featureKey && !hasFeature(companyType, item.featureKey)) {
        return false
      }
      return true
    })
  }, [items, companyType])

  if (filteredItems.length === 0) return null

  return <NavSection items={filteredItems} label={label} icon={Icon} />
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

  // Use the first team as active for now (in real app this would be more complex)
  const activeTeam = mockTeams[0]

  // Sidebar mode state (internal state for uncontrolled)
  const [internalMode, setInternalMode] = React.useState<SidebarMode>("navigation")

  // Use controlled mode if provided, otherwise internal
  const sidebarMode = mode ?? internalMode

  // Navigation tab state (Verksamhet vs Bolaget)
  const [navTab, setNavTab] = React.useState<NavTab>("verksamhet")

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
    const handleOpenAIChat = (e: Event) => {
      const customEvent = e as CustomEvent
      setInternalMode("ai-chat")
      if (onModeChange) onModeChange("ai-chat")
    }

    const handleLoadConversation = (e: Event) => {
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

  // Toggle sidebar mode
  const toggleMode = React.useCallback(() => {
    const newMode = sidebarMode === "navigation" ? "ai-chat" : "navigation"
    if (onModeChange) {
      onModeChange(newMode)
    } else {
      setInternalMode(newMode)
    }
  }, [sidebarMode, onModeChange])

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
        <SidebarHeader className="h-12 p-0 flex items-center px-2 mt-1">
          <SidebarModeDropdown mode={sidebarMode} onModeChange={onModeChange || setInternalMode} />
        </SidebarHeader>

        <SidebarContent>
          {sidebarMode === "navigation" ? (
            <>
              {/* Tab Toggle Buttons */}
              <div className="px-3 py-2 flex gap-1">
                <Button
                  variant={navTab === "verksamhet" ? "secondary" : "ghost"}
                  size="sm"
                  className="flex-1 h-8"
                  onClick={() => setNavTab("verksamhet")}
                >
                  <span className="text-xs">Verksamhet</span>
                </Button>
                <Button
                  variant={navTab === "bolaget" ? "secondary" : "ghost"}
                  size="sm"
                  className="flex-1 h-8"
                  onClick={() => setNavTab("bolaget")}
                >
                  <span className="text-xs">Bolaget</span>
                </Button>
              </div>

              {/* Verksamhet Tab: Platform, Bokföring, Löner */}
              {navTab === "verksamhet" && (
                <>
                  <ModuleGroup items={navBokforing} label="Bokföring" companyType={activeTeam.companyType} icon={FileText} />
                  <ModuleGroup items={navLoner} label="Löner" companyType={activeTeam.companyType} icon={PiggyBank} />
                </>
              )}

              {/* Bolag Tab: Rapporter, Ägare, Settings */}
              {navTab === "bolaget" && (
                <>
                  <ModuleGroup items={navRapporter} label="Rapporter" companyType={activeTeam.companyType} icon={Calculator} />
                  <ModuleGroup items={navAgare} label="Ägare & Styrning" companyType={activeTeam.companyType} icon={Users} />
                  <NavSettings items={navSettings} onSettingsClick={handleOpenSettings} icon={Settings2} />
                </>
              )}
            </>
          ) : (
            <AIChatSidebar mode={sidebarMode} onModeChange={onModeChange || setInternalMode} />
          )}
        </SidebarContent>

        {sidebarMode === "navigation" && (
          <SidebarFooter>
            <UserTeamSwitcher user={mockUser} teams={mockTeams} />
          </SidebarFooter>
        )}


      </Sidebar>

    </>
  )
}


