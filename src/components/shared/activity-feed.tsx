"use client"

/**
 * Activity Feed
 *
 * Shows the history of actions: who did what and when.
 * "Johan bokförde transaktion 'Inköp kontorsmaterial' · 14:32"
 */

import * as React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import {
  Plus,
  Pencil,
  Trash2,
  BookCheck,
  Send,
  CheckCircle,
  XCircle,
  CreditCard,
  Archive,
  RotateCcw,
  Download,
  Upload,
  UserPlus,
  UserMinus,
  LogIn,
  LogOut,
  ChevronDown,
  History,
  type LucideIcon,
} from "lucide-react"
import {
  useActivityLog,
  formatActivityTime,
  ACTION_LABELS,
  ENTITY_LABELS,
  type ActivityLogEntry,
  type ActivityAction,
  type EntityType,
} from "@/hooks/use-activity-log"
import Link from "next/link"

// ============================================================================
// Action Icons
// ============================================================================

const ACTION_ICONS: Record<ActivityAction, LucideIcon> = {
  created: Plus,
  updated: Pencil,
  deleted: Trash2,
  booked: BookCheck,
  sent: Send,
  approved: CheckCircle,
  rejected: XCircle,
  paid: CreditCard,
  archived: Archive,
  restored: RotateCcw,
  exported: Download,
  imported: Upload,
  invited: UserPlus,
  removed: UserMinus,
  login: LogIn,
  logout: LogOut,
}

const ACTION_COLORS: Record<ActivityAction, string> = {
  created: "bg-green-500/10 text-green-600",
  updated: "bg-blue-500/10 text-blue-600",
  deleted: "bg-red-500/10 text-red-600",
  booked: "bg-purple-500/10 text-purple-600",
  sent: "bg-cyan-500/10 text-cyan-600",
  approved: "bg-green-500/10 text-green-600",
  rejected: "bg-red-500/10 text-red-600",
  paid: "bg-emerald-500/10 text-emerald-600",
  archived: "bg-gray-500/10 text-gray-600",
  restored: "bg-amber-500/10 text-amber-600",
  exported: "bg-indigo-500/10 text-indigo-600",
  imported: "bg-indigo-500/10 text-indigo-600",
  invited: "bg-blue-500/10 text-blue-600",
  removed: "bg-red-500/10 text-red-600",
  login: "bg-gray-500/10 text-gray-600",
  logout: "bg-gray-500/10 text-gray-600",
}

// ============================================================================
// Entity Links
// ============================================================================

function getEntityLink(entityType: EntityType, entityId: string | null): string | null {
  if (!entityId) return null

  const routes: Record<EntityType, string> = {
    transactions: `/dashboard/bokforing/transaktioner?id=${entityId}`,
    customerinvoices: `/dashboard/bokforing/fakturor?id=${entityId}`,
    supplierinvoices: `/dashboard/bokforing/fakturor?id=${entityId}`,
    receipts: `/dashboard/bokforing/kvitton?id=${entityId}`,
    verifications: `/dashboard/bokforing/verifikationer?id=${entityId}`,
    payslips: `/dashboard/loner/lonebesked?id=${entityId}`,
    employees: `/dashboard/loner/team?id=${entityId}`,
    shareholders: `/dashboard/agare/aktiebok?id=${entityId}`,
    companies: `/dashboard/installningar`,
    profiles: `/dashboard/installningar`,
  }

  return routes[entityType] || null
}

// ============================================================================
// Components
// ============================================================================

interface ActivityItemProps {
  activity: ActivityLogEntry
  showAvatar?: boolean
}

export function ActivityItem({ activity, showAvatar = true }: ActivityItemProps) {
  const Icon = ACTION_ICONS[activity.action] ?? Pencil
  const colorClass = ACTION_COLORS[activity.action] ?? "bg-gray-500/10 text-gray-600"
  const link = getEntityLink(activity.entityType, activity.entityId)

  const who = activity.userName || activity.userEmail?.split("@")[0] || "Okänd"
  const action = ACTION_LABELS[activity.action] || activity.action
  const entityLabel = ENTITY_LABELS[activity.entityType] || activity.entityType

  return (
    <div className="flex items-start gap-3 py-3">
      {showAvatar && (
        <Avatar className="h-8 w-8 mt-0.5">
          <AvatarFallback className="text-xs bg-muted">
            {getInitials(who)}
          </AvatarFallback>
        </Avatar>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-sm">
          <span className="font-medium">{who}</span>
          <span className="text-muted-foreground"> {action} </span>
          {link ? (
            <Link href={link} className="font-medium hover:underline text-primary">
              {activity.entityName || entityLabel}
            </Link>
          ) : (
            <span className="font-medium">{activity.entityName || entityLabel}</span>
          )}
        </p>

        {/* Show changes if any */}
        {activity.changes && Object.keys(activity.changes).length > 0 && (
          <div className="mt-1 text-xs text-muted-foreground">
            {Object.entries(activity.changes).map(([key, change]) => (
              <span key={key} className="mr-2">
                {key}: {String(change.from)} → {String(change.to)}
              </span>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground mt-0.5">
          {formatActivityTime(activity.createdAt)}
        </p>
      </div>

      <div className={cn("flex h-8 w-8 items-center justify-center rounded-full", colorClass)}>
        <Icon className="h-4 w-4" />
      </div>
    </div>
  )
}

interface ActivityFeedProps {
  /** Filter by entity type */
  entityType?: EntityType
  /** Filter by specific entity ID */
  entityId?: string
  /** Maximum height */
  maxHeight?: string | number
  /** Maximum number of activities to load initially */
  limit?: number
  /** Show title */
  showTitle?: boolean
  /** Title text */
  title?: string
  /** Class name */
  className?: string
}

export function ActivityFeed({
  entityType,
  entityId,
  maxHeight = 400,
  limit = 20,
  showTitle = true,
  title = "Aktivitet",
  className,
}: ActivityFeedProps) {
  const { activities, loading, hasMore, loadMore } = useActivityLog({
    entityType,
    entityId,
    limit,
    realtime: true,
  })

  if (loading && activities.length === 0) {
    return (
      <Card className={className}>
        {showTitle && (
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <History className="h-4 w-4" />
              {title}
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (activities.length === 0) {
    return (
      <Card className={className}>
        {showTitle && (
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <History className="h-4 w-4" />
              {title}
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Ingen aktivitet ännu
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      {showTitle && (
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <History className="h-4 w-4" />
            {title}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className="pt-0">
        <ScrollArea style={{ maxHeight }}>
          <div className="divide-y">
            {activities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>

          {hasMore && (
            <div className="pt-3">
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={loadMore}
                disabled={loading}
              >
                <ChevronDown className="h-4 w-4 mr-2" />
                Visa mer
              </Button>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

/**
 * Compact activity timeline for sidebars
 */
export function ActivityTimeline({
  entityType,
  entityId,
  limit = 5,
  className,
}: {
  entityType?: EntityType
  entityId?: string
  limit?: number
  className?: string
}) {
  const { activities, loading } = useActivityLog({
    entityType,
    entityId,
    limit,
    realtime: true,
  })

  if (loading) {
    return (
      <div className={cn("space-y-3", className)}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-2 w-2 rounded-full" />
            <Skeleton className="h-3 w-full" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={cn("space-y-2", className)}>
      {activities.map((activity) => {
        const who = activity.userName || activity.userEmail?.split("@")[0] || "Okänd"
        const action = ACTION_LABELS[activity.action]
        const colorClass = ACTION_COLORS[activity.action]

        return (
          <div key={activity.id} className="flex items-start gap-2 text-xs">
            <div className={cn("h-2 w-2 rounded-full mt-1.5", colorClass.replace("text-", "bg-").replace("/10", ""))} />
            <div className="flex-1 min-w-0">
              <span className="font-medium">{who}</span>
              <span className="text-muted-foreground"> {action} </span>
              <span className="font-medium truncate">{activity.entityName}</span>
              <span className="text-muted-foreground block">
                {formatActivityTime(activity.createdAt)}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ============================================================================
// Helpers
// ============================================================================

function getInitials(name: string): string {
  return name
    .split(/[\s@]+/)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("")
}
