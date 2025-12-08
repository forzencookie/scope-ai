"use client"

import * as React from "react"
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Calendar,
  Command,
  Frame,
  GalleryVerticalEnd,
  PieChart,
  Settings2,
  Sparkles,
  Building2,
  Users,
  Puzzle,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavSettings } from "@/components/nav-settings"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

// This is sample data.
const data = {
  user: {
    name: "Rice",
    email: "Free Plan",
    avatar: "",
  },
  teams: [
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
  navPlatform: [
    {
      title: "AI Robot",
      url: "/ai-robot",
      icon: Bot,
      isActive: true,
    },
    {
      title: "Dagbok",
      url: "/dagbok",
      icon: Calendar,
    },
    {
      title: "Företagsstatistik",
      url: "/company-statistics",
      icon: Building2,
    },
  ],
  navEconomy: [
    {
      title: "Bokföring",
      url: "/accounting",
      icon: BookOpen,
      items: [
        {
          title: "Transaktioner",
          url: "/accounting?tab=transaktioner",
        },
        {
          title: "AI-matchning",
          url: "/accounting?tab=ai-matchning",
        },
        {
          title: "Underlag",
          url: "/accounting?tab=underlag",
        },
        {
          title: "Verifikationer",
          url: "/accounting?tab=verifikationer",
        },
        {
          title: "Fakturor",
          url: "/accounting?tab=fakturor",
        },
      ],
    },
    {
      title: "Rapporter",
      url: "/reports",
      icon: PieChart,
      items: [
        {
          title: "Momsdeklaration",
          url: "/reports?tab=momsdeklaration",
        },
        {
          title: "Inkomstdeklaration",
          url: "/reports?tab=inkomstdeklaration",
        },
        {
          title: "Årsredovisning",
          url: "/reports?tab=arsredovisning",
        },
      ],
    },
    {
      title: "Löner",
      url: "/payroll",
      icon: Frame,
      items: [
        {
          title: "Lönebesked",
          url: "/payroll?tab=lonebesked",
        },
        {
          title: "AGI",
          url: "/payroll?tab=agi",
        },
        {
          title: "Utdelning",
          url: "/payroll?tab=utdelning",
        },
      ],
    },
  ],
  navSettings: [
    {
      title: "Företags information",
      url: "/settings/company-info",
      icon: Building2,
    },
    {
      title: "Team och anställda",
      url: "/settings/team",
      icon: Users,
    },
    {
      title: "Integrationer",
      url: "/settings/integrations",
      icon: Puzzle,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navPlatform} />
        <NavMain items={data.navEconomy} label="Ekonomi" />
        <NavSettings items={data.navSettings} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
