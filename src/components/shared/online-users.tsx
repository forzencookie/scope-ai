"use client"

/**
 * Online Users Indicator
 *
 * Shows avatars of team members currently online/viewing the same page.
 * Used in the header or page headers for collaboration awareness.
 */

import * as React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Circle, Edit, Eye, Users } from "lucide-react"
import type { PresenceUser } from "@/hooks/use-realtime"

interface OnlineUsersProps {
  users: PresenceUser[]
  maxVisible?: number
  size?: "sm" | "md" | "lg"
  showStatus?: boolean
  className?: string
}

const SIZE_CONFIG = {
  sm: { avatar: "h-6 w-6", text: "text-xs", overlap: "-ml-1.5" },
  md: { avatar: "h-8 w-8", text: "text-sm", overlap: "-ml-2" },
  lg: { avatar: "h-10 w-10", text: "text-base", overlap: "-ml-2.5" },
}

export function OnlineUsers({
  users,
  maxVisible = 5,
  size = "md",
  showStatus = true,
  className,
}: OnlineUsersProps) {
  const config = SIZE_CONFIG[size]
  const visibleUsers = users.slice(0, maxVisible)
  const hiddenCount = users.length - maxVisible

  if (users.length === 0) {
    return null
  }

  return (
    <div className={cn("flex items-center", className)}>
      <div className="flex">
        {visibleUsers.map((user, index) => (
          <HoverCard key={user.id} openDelay={200}>
            <HoverCardTrigger asChild>
              <div
                className={cn(
                  "relative cursor-pointer",
                  index > 0 && config.overlap
                )}
              >
                <Avatar
                  className={cn(
                    config.avatar,
                    "border-2 border-background ring-2 ring-background"
                  )}
                >
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {getInitials(user.name || user.email)}
                  </AvatarFallback>
                </Avatar>
                {/* Online indicator */}
                <span className="absolute bottom-0 right-0 block h-2 w-2 rounded-full bg-green-500 ring-1 ring-background" />
                {/* Editing indicator */}
                {user.isEditing && (
                  <span className="absolute -top-1 -right-1 block h-3 w-3 rounded-full bg-amber-500 ring-1 ring-background flex items-center justify-center">
                    <Edit className="h-2 w-2 text-white" />
                  </span>
                )}
              </div>
            </HoverCardTrigger>
            <HoverCardContent align="center" className="w-64">
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback>{getInitials(user.name || user.email)}</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold">{user.name || "Team Member"}</h4>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                  {showStatus && (
                    <div className="flex items-center gap-1 text-xs">
                      {user.isEditing ? (
                        <>
                          <Edit className="h-3 w-3 text-amber-500" />
                          <span className="text-amber-600">Redigerar</span>
                        </>
                      ) : (
                        <>
                          <Eye className="h-3 w-3 text-green-500" />
                          <span className="text-green-600">Online</span>
                        </>
                      )}
                    </div>
                  )}
                  {user.currentPage && (
                    <p className="text-xs text-muted-foreground">
                      Visar: {formatPageName(user.currentPage)}
                    </p>
                  )}
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        ))}

        {/* Hidden users count */}
        {hiddenCount > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  "relative flex items-center justify-center rounded-full bg-muted border-2 border-background",
                  config.avatar,
                  config.overlap
                )}
              >
                <span className={cn(config.text, "font-medium text-muted-foreground")}>
                  +{hiddenCount}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{hiddenCount} fler online</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  )
}

/**
 * Compact badge showing online user count
 */
export function OnlineUsersBadge({
  count,
  className,
}: {
  count: number
  className?: string
}) {
  if (count === 0) return null

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 bg-green-500/10 text-green-700 border-green-500/20",
        className
      )}
    >
      <Circle className="h-2 w-2 fill-green-500 text-green-500" />
      {count} online
    </Badge>
  )
}

/**
 * Edit conflict warning
 */
export function EditConflictWarning({
  editor,
  className,
}: {
  editor: PresenceUser
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-sm",
        className
      )}
    >
      <Avatar className="h-6 w-6">
        <AvatarImage src={editor.avatar} alt={editor.name} />
        <AvatarFallback className="text-xs">
          {getInitials(editor.name || editor.email)}
        </AvatarFallback>
      </Avatar>
      <span className="text-amber-700">
        <strong>{editor.name || "Någon"}</strong> redigerar detta just nu
      </span>
    </div>
  )
}

// ============================================================================
// Helpers
// ============================================================================

function getInitials(name?: string): string {
  if (!name) return "?"
  return name
    .split(/[\s@]+/)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("")
}

function formatPageName(path: string): string {
  const segments = path.split("/").filter(Boolean)
  const lastSegment = segments[segments.length - 1] || "Dashboard"
  return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1)
}
