"use client"

import * as React from "react"
import { type LucideIcon } from "lucide-react"
import Link from "next/link"

import { useTextMode } from "@/providers/text-mode-provider"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

// ============================================================================
// NavSettings - Simple section header with items (not collapsible, not a card)
// ============================================================================

interface NavSettingsItem {
  title: string
  titleEnkel?: string
  url: string
  icon?: LucideIcon
}

interface NavSettingsProps {
  items: NavSettingsItem[]
  onSettingsClick?: () => void
  icon?: LucideIcon
}

export function NavSettings({
  items,
  onSettingsClick,
  icon: Icon,
}: NavSettingsProps) {
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
