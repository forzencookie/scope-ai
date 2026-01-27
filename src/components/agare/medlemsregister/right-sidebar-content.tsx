"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { AppStatusBadge } from "@/components/ui/status-badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { type MembershipChange } from "@/types/ownership"
import { type MembershipChangeType } from "@/lib/status-types"

interface RightSidebarContentProps {
  changes: MembershipChange[]
  getMembershipChangeTypeLabel: (changeType: MembershipChange['changeType']) => MembershipChangeType
  formatDate: (date: string) => string
}

export function RightSidebarContent({
  changes,
  getMembershipChangeTypeLabel,
  formatDate
}: RightSidebarContentProps) {
  const [sidebarElement, setSidebarElement] = useState<HTMLElement | null>(null)

  useEffect(() => {
    // Find the sidebar slot and update state, but only if we are on desktop
    const checkSidebar = () => {
      const el = document.getElementById('page-right-sidebar')
      // Check if element exists AND is visible (display != none)
      if (el && window.getComputedStyle(el).display !== 'none') {
        setSidebarElement(el)
      } else {
        setSidebarElement(null)
      }
    }

    checkSidebar()
    window.addEventListener('resize', checkSidebar)
    return () => window.removeEventListener('resize', checkSidebar)
  }, [])

  const content = (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Senaste aktivitet</CardTitle>
        <CardDescription className="text-xs">
          Medlemsändringar och händelser
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {changes.map((change) => {
            const changeLabel = getMembershipChangeTypeLabel(change.changeType)
            return (
              <div key={change.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{change.memberName}</p>
                    <p className="text-xs text-muted-foreground truncate">{change.details}</p>
                  </div>
                  <AppStatusBadge status={changeLabel} size="sm" className="shrink-0" />
                </div>
                <div className="text-xs text-muted-foreground tabular-nums shrink-0 ml-auto">
                  {formatDate(change.date)}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )

  // If sidebar slot exists and is visible, portal content there
  if (sidebarElement) {
    return createPortal(content, sidebarElement)
  }

  // Fallback: render inline (for smaller screens or if slot not found)
  return content
}
