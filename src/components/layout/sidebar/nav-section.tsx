"use client"

import * as React from "react"
import { MoreHorizontal, type LucideIcon } from "lucide-react"
import Link from "next/link"

import { useTextMode } from "@/providers/text-mode-provider"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

// ============================================================================
// NavSection - Shadcn-style section with "More" dropdown for overflow items
// ============================================================================

interface NavSectionItem {
  title: string
  titleEnkel?: string
  url: string
  icon?: LucideIcon
  isActive?: boolean
}

interface NavSectionProps {
  items: NavSectionItem[]
  label: string
  icon?: LucideIcon
}

export function NavSection({ items, label, icon: Icon }: NavSectionProps) {
  const { isMobile } = useSidebar()
  const { isEnkel } = useTextMode()

  // Helper to get the correct title based on mode
  const getTitle = (item: NavSectionItem) => {
    return isEnkel && item.titleEnkel ? item.titleEnkel : item.title
  }

  // Split items into visible (first 3) and hidden (rest)
  const visibleItems = items.slice(0, 3)
  const hiddenItems = items.slice(3)

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel className="pl-1 flex items-center">
        {label}
        {Icon && <Icon className="ml-2 h-4 w-4 text-muted-foreground" />}
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
    </SidebarGroup>
  )
}
