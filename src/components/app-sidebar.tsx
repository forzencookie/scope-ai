"use client"

import * as React from "react"

import { NavMain, NavSettings, NavUser } from "@/components/sidebar-nav"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

// Import data from the data layer
import { 
  mockUser, 
  mockTeams, 
  navPlatform, 
  navEconomy, 
  navSettings 
} from "@/data/navigation"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={mockTeams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navPlatform} />
        <NavMain items={navEconomy} label="Ekonomi" />
        <NavSettings items={navSettings} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={mockUser} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
