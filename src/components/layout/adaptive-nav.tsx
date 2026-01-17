"use client"

import * as React from "react"
import { ChevronRight } from "lucide-react"
import Link from "next/link"

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem
} from "@/components/ui/sidebar"

import { useCompany } from "@/providers/company-provider"
import { useTextMode } from "@/providers/text-mode-provider"
import type { NavItem } from "@/types"

// ============================================================================
// AdaptiveNavMain - Feature-aware navigation component
// ============================================================================

export function AdaptiveNavMain({
  items,
  label = "Platform",
}: {
  items: NavItem[]
  label?: string
}) {
  const { hasFeature } = useCompany()
  const { isEnkel } = useTextMode()

  // Helper to get the correct title based on mode
  const getTitle = (item: { title: string; titleEnkel?: string }) => {
    return isEnkel && item.titleEnkel ? item.titleEnkel : item.title
  }

  // Filter items based on features
  const filteredItems = items.map(item => {
    // If item has a feature key and user doesn't have access, skip it
    if (item.featureKey && !hasFeature(item.featureKey)) {
      return null
    }

    // Filter sub-items based on features
    const filteredSubItems = item.items?.filter(subItem => {
      if (subItem.featureKey && !hasFeature(subItem.featureKey)) {
        return false
      }
      return true
    })

    // If all sub-items are filtered out, hide the parent too
    if (item.items && filteredSubItems?.length === 0) {
      return null
    }

    return {
      ...item,
      items: filteredSubItems,
    }
  }).filter(Boolean) as NavItem[]

  // Don't render the group if no items are visible
  if (filteredItems.length === 0) {
    return null
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarMenu>
        {filteredItems.map((item) => {
          const displayTitle = getTitle(item)
          return item.items && item.items.length > 0 ? (
            <Collapsible key={item.title} asChild defaultOpen={item.isActive} className="group/collapsible">
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={displayTitle}>
                  <Link href={item.url}>
                    {item.icon && <item.icon />}
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
              <SidebarMenuButton asChild tooltip={displayTitle}>
                <Link href={item.url}>
                  {item.icon && <item.icon />}
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
