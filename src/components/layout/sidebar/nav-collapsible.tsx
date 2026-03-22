"use client"

import * as React from "react"
import { ChevronRight, type LucideIcon } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useCompany } from "@/providers/company-provider"
import type { FeatureKey } from "@/lib/company-types"
import { useQuery } from "@tanstack/react-query"
import { pendingBookingQueryKeys } from "@/hooks/use-pending-bookings"
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuBadge,
} from "@/components/ui/sidebar"

// ============================================================================
// NavCollapsibleSection - Collapsible section with localStorage persistence
// ============================================================================

interface NavCollapsibleItem {
  title: string
  url: string
  icon?: LucideIcon
  isActive?: boolean
  featureKey?: FeatureKey
  badgeKey?: string
}

interface NavCollapsibleSectionProps {
  items: NavCollapsibleItem[]
  label: string
  storageKey: string
  defaultOpen?: boolean
  icon?: LucideIcon
}

export function NavCollapsibleSection({
  items,
  label,
  storageKey,
  defaultOpen = false,
  icon: _Icon,
}: NavCollapsibleSectionProps) {
  const { hasFeature } = useCompany()

  // Filter items based on company features
  const filteredItems = React.useMemo(() => {
    return items.filter(item => {
      if (!item.featureKey) return true // No feature requirement = always show
      return hasFeature(item.featureKey)
    })
  }, [items, hasFeature])

  // Initialize from localStorage
  const [isOpen, setIsOpen] = React.useState(() => {
    if (typeof window === 'undefined') return defaultOpen
    const stored = localStorage.getItem(`sidebar-section-${storageKey}`)
    return stored !== null ? stored === 'true' : defaultOpen
  })
  
  // Track if we're currently toggling to prevent rapid clicks
  const isToggling = React.useRef(false)
  const saveTimeout = React.useRef<NodeJS.Timeout | null>(null)

  // Persist to localStorage with debouncing
  const handleOpenChange = React.useCallback((open: boolean) => {
    // Prevent rapid toggles
    if (isToggling.current) return
    isToggling.current = true
    
    setIsOpen(open)
    
    // Debounce localStorage write to prevent excessive writes
    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current)
    }
    saveTimeout.current = setTimeout(() => {
      localStorage.setItem(`sidebar-section-${storageKey}`, String(open))
    }, 100)
    
    // Reset toggle lock after animation
    setTimeout(() => {
      isToggling.current = false
    }, 200)
  }, [storageKey])
  
  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current)
      }
    }
  }, [])

  // Helper to get the title
  const getTitle = (item: { title: string }) => {
    return item.title
  }

  // Share the pending-bookings query with usePendingBookings() — React Query deduplicates
  const hasBadgeItems = filteredItems.some(item => item.badgeKey)
  const { data: pendingData } = useQuery({
    queryKey: pendingBookingQueryKeys.list(),
    queryFn: async () => {
      const res = await fetch('/api/pending-bookings')
      if (!res.ok) return { bookings: [], pendingCount: 0 }
      return res.json() as Promise<{ bookings: unknown[]; pendingCount: number }>
    },
    staleTime: 2 * 60 * 1000,
    enabled: hasBadgeItems,
  })
  const badgeCounts: Record<string, number> = React.useMemo(() => {
    return { 'pending-bookings': pendingData?.pendingCount || 0 }
  }, [pendingData])

  if (filteredItems.length === 0) return null

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden py-0">
      <Collapsible open={isOpen} onOpenChange={handleOpenChange}>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton className="h-8">
            <span className="flex-1 text-left text-sm">{label}</span>
            <ChevronRight className={cn(
              "h-4 w-4 text-muted-foreground/50 transition-transform duration-200",
              isOpen && "rotate-90"
            )} />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenu>
            {filteredItems.map((item) => {
              const badgeCount = item.badgeKey ? badgeCounts?.[item.badgeKey] || 0 : 0
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={getTitle(item)} className="pl-6 h-8">
                    <Link href={item.url}>
                      <span className="text-sm">{getTitle(item)}</span>
                    </Link>
                  </SidebarMenuButton>
                  {badgeCount > 0 && (
                    <SidebarMenuBadge>{badgeCount}</SidebarMenuBadge>
                  )}
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </CollapsibleContent>
      </Collapsible>
    </SidebarGroup>
  )
}
