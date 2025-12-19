"use client"

import * as React from "react"
import { Sparkles, PanelLeft, type LucideIcon } from "lucide-react"

import { NavMain, NavSettings, NavUser } from "./sidebar-nav"
import { AdaptiveNavMain } from "./adaptive-nav"
import { TeamSwitcher } from "./team-switcher"
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
} from "@/data/navigation"

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
  const [settingsOpen, setSettingsOpen] = React.useState(false)
  const { state, toggleSidebar } = useSidebar()

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
          <TeamSwitcher teams={mockTeams} />
        </SidebarHeader>
        <SidebarContent>
          <NavMain items={navPlatform} />
        </SidebarContent>
        <SidebarFooter>
          <NavSettings items={navSettings} onSettingsClick={() => setSettingsOpen(true)} />
          <NavUser user={mockUser} />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  )
}
