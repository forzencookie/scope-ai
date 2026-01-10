"use client"

import * as React from "react"
import { Sparkles, PanelLeft, type LucideIcon } from "lucide-react"

import { NavMain, NavSettings, NavAIConversations } from "./sidebar-nav"
import { UserTeamSwitcher } from "./user-team-switcher"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
  useSidebar,
} from "@/components/ui/sidebar"
import { SettingsDialog } from "../settings"

// Import data from the data layer
import {
  mockUser,
  mockTeams,
  navPlatform,
  navSettings
} from "../../data/app-navigation"

interface AppSidebarProps extends Omit<React.ComponentProps<typeof Sidebar>, "variant"> {
  /** 'default' shows full navigation, 'minimal' shows empty sidebar with custom header */
  variant?: "default" | "minimal"
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
      // Closing: Replace URL to remove param without adding history stack (user expects to stay on current page)
      // or simply rely on router.back() if we tracked history?
      // "Back button closes dialog" works if we pushed.
      // If user clicks "X", we want to remove the param.
      // Using replace() here is safe.
      const params = new URLSearchParams(searchParams?.toString())
      params.delete("settings")
      router.replace(`${pathname}?${params.toString()}`)
    } else if (open && !settingsParam) {
      // Opening via other means (if any), push state
      handleOpenSettings()
    }
    setSettingsOpen(open)
  }

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
                  // If collapsed, clicking anywhere on the button (the logo) expands it
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
        <SidebarRail />
      </Sidebar>
    )
  }

  return (
    <>
      <Sidebar collapsible="icon" {...props}>
        <SidebarHeader>
          <UserTeamSwitcher user={mockUser} teams={mockTeams} />
        </SidebarHeader>
        <SidebarContent>
          <NavMain items={navPlatform} />
          <NavAIConversations />
        </SidebarContent>
        <SidebarFooter>
          <NavSettings items={navSettings} onSettingsClick={handleOpenSettings} />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SettingsDialog
        open={settingsOpen}
        onOpenChange={handleSettingsOpenChange}
        defaultTab={settingsParam || undefined}
      />
    </>
  )
}
