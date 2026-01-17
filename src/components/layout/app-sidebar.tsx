"use client"

import * as React from "react"
import { Sparkles, PanelLeft, Bot, Menu, type LucideIcon } from "lucide-react"

import { NavMain, NavSettings, NavAIConversations } from "./sidebar-nav"
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

// Import data from the data layer
import {
  mockUser,
  mockTeams,
  navPlatform,
  navSettings
} from "../../data/app-navigation"

type SidebarMode = "navigation" | "ai-chat"

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
}

export function AppSidebar({
  variant = "default",
  minimalHeader,
  ...props
}: AppSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const settingsParam = searchParams?.get("settings")
  const { state, toggleSidebar } = useSidebar()

  // Sidebar mode state
  const [sidebarMode, setSidebarMode] = React.useState<SidebarMode>("navigation")

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

  // Toggle sidebar mode
  const toggleMode = React.useCallback(() => {
    setSidebarMode(prev => prev === "navigation" ? "ai-chat" : "navigation")
  }, [])

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
      <Sidebar collapsible="offcanvas" variant={sidebarVariant} {...props}>
        <SidebarHeader>
          <UserTeamSwitcher user={mockUser} teams={mockTeams} />
          {/* Mode Toggle */}
          <div className="flex items-center justify-center gap-1 px-2 pt-1">
            <Button
              variant={sidebarMode === "navigation" ? "secondary" : "ghost"}
              size="sm"
              className="flex-1 h-8 text-xs gap-1.5"
              onClick={() => setSidebarMode("navigation")}
              title="Navigation"
            >
              <Menu className="h-3.5 w-3.5" />
              <span>Meny</span>
            </Button>
            <Button
              variant={sidebarMode === "ai-chat" ? "secondary" : "ghost"}
              size="sm"
              className="flex-1 h-8 text-xs gap-1.5"
              onClick={() => setSidebarMode("ai-chat")}
              title="AI Chat"
            >
              <Bot className="h-3.5 w-3.5" />
              <span>AI</span>
            </Button>
          </div>
        </SidebarHeader>

        <SidebarContent>
          {sidebarMode === "navigation" ? (
            <>
              <NavMain items={navPlatform} />
              <NavAIConversations />
            </>
          ) : (
            <AIChatSidebar />
          )}
        </SidebarContent>

        {sidebarMode === "navigation" && (
          <SidebarFooter>
            <NavSettings items={navSettings} onSettingsClick={handleOpenSettings} />
          </SidebarFooter>
        )}


      </Sidebar>

    </>
  )
}

