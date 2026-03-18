"use client"

/**
 * useActivityLog - Hook for fetching and displaying activity history
 *
 * This is the ACCOUNTABILITY AUDIT TRAIL — "who did what and when".
 * Example: "Johan booked transaction 'Inköp kontorsmaterial' at 14:32"
 *
 * ARCHITECTURE NOTE (Phase 7B):
 * There are two event systems in the app, serving different purposes:
 *
 * 1. `activity_log` table (THIS hook) — Audit trail for accountability
 *    - Tracks user/system actions with field-level diffs
 *    - Auto-triggered on DB changes (transactions trigger)
 *    - Used by: ActivityFeed, Arkiv tab (calendar day view)
 *
 * 2. `events` table (useEvents hook) — Company timeline/calendar
 *    - Tracks company-level happenings from all sources (AI, system, authority)
 *    - Has workflow status, corporate action types, proof/hash chain
 *    - Used by: Översikt tab, EventsCalendar, AI tools
 *
 * These are intentionally separate: activity_log = granular audit,
 * events = high-level company narrative.
 */

import { useState, useEffect, useCallback } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "./use-auth"
import { createBrowserClient } from "@/lib/database/client"
import { activityService, type ActivityLogEntry, type ActivityAction, type EntityType } from "@/services/activity-service"

export type { ActivityLogEntry, ActivityAction, EntityType }

// ============================================================================
// Types
// ============================================================================

interface UseActivityLogOptions {
  /** Filter by entity type */
  entityType?: EntityType
  /** Filter by specific entity ID */
  entityId?: string
  /** Filter by specific date (shows only that day's entries) */
  dateFilter?: Date | null
  /** Number of entries to fetch */
  limit?: number
  /** Enable real-time updates */
  realtime?: boolean
}

interface UseActivityLogReturn {
  activities: ActivityLogEntry[]
  loading: boolean
  error: Error | null
  hasMore: boolean
  loadMore: () => Promise<void>
  refresh: () => Promise<void>
}

// ============================================================================
// Action Labels (Swedish)
// ============================================================================

export const ACTION_LABELS: Record<ActivityAction, string> = {
  created: "skapade",
  updated: "uppdaterade",
  deleted: "raderade",
  booked: "bokförde",
  sent: "skickade",
  approved: "godkände",
  rejected: "avvisade",
  paid: "markerade som betald",
  archived: "arkiverade",
  restored: "återställde",
  exported: "exporterade",
  imported: "importerade",
  invited: "bjöd in",
  removed: "tog bort",
  login: "loggade in",
  logout: "loggade ut",
}

export const ENTITY_LABELS: Record<EntityType, string> = {
  transactions: "transaktion",
  customer_invoices: "kundfaktura",
  supplier_invoices: "leverantörsfaktura",
  receipts: "kvitto",
  verifications: "verifikation",
  payslips: "lönebesked",
  employees: "anställd",
  shareholders: "aktieägare",
  companies: "företag",
  profiles: "profil",
  roadmaps: "canvas",
  tax_reports: "skatterapport",
  financial_periods: "räkenskapsperiod",
  benefits: "förmån",
  inventarier: "inventarie",
}

// ============================================================================
// Query Keys
// ============================================================================

export const activityLogQueryKeys = {
  all: ["activity-log"] as const,
  list: (entityType?: string, entityId?: string, dateFilter?: string) =>
    [...activityLogQueryKeys.all, "list", entityType, entityId, dateFilter] as const,
}

import type { Database } from "@/types/database"
type ActivityLogRow = Database['public']['Tables']['activity_log']['Row']

// ============================================================================
// Main Hook
// ============================================================================

export function useActivityLog({
  entityType,
  entityId,
  dateFilter,
  limit = 20,
  realtime = true,
}: UseActivityLogOptions = {}): UseActivityLogReturn {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [extraActivities, setExtraActivities] = useState<ActivityLogEntry[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [loadMoreOffset, setLoadMoreOffset] = useState(0)

  const supabase = createBrowserClient()

  const {
    data: initialActivities = [],
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: activityLogQueryKeys.list(entityType, entityId, dateFilter?.toISOString()?.split('T')[0]),
    queryFn: async () => {
      // Get company info first for explicit filtering
      const { data: company } = await supabase.from('companies').select('id').single()
      if (!company) return []

      const result = await activityService.getActivities({
        companyId: company.id,
        entityType,
        entityId,
        dateFilter,
        limit,
        offset: 0
      })

      setHasMore(result.hasMore)
      setLoadMoreOffset(limit)
      setExtraActivities([])
      return result.activities
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
  })

  // Combine initial data with any "load more" pages
  const activities = extraActivities.length > 0
    ? [...initialActivities, ...extraActivities]
    : initialActivities

  // Load more (pagination beyond the initial query)
  const loadMore = useCallback(async () => {
    if (!user) return

    // Get company info first for explicit filtering
    const { data: company } = await supabase.from('companies').select('id').single()
    if (!company) return

    const result = await activityService.getActivities({
      companyId: company.id,
      entityType,
      entityId,
      dateFilter,
      limit,
      offset: loadMoreOffset
    })

    setExtraActivities(prev => [...prev, ...result.activities])
    setLoadMoreOffset(prev => prev + limit)
    setHasMore(result.hasMore)
  }, [user, supabase, entityType, entityId, limit, loadMoreOffset, dateFilter])

  // Real-time subscription
  useEffect(() => {
    if (!realtime || !user) return

    const channel = supabase
      .channel("activity_log_changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "activity_log",
        },
          (payload) => {
            // In a real app we'd map this using the service
            // For simplicity in the subscription:
            const newRow = payload.new as ActivityLogRow
            
            // Only add if it matches our filters (basic check)
            if (entityType && newRow.entity_type !== entityType) return
            if (entityId && newRow.entity_id !== entityId) return

            refetch() // Easiest way to maintain consistency with mapping
          }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [realtime, user, entityType, entityId, supabase, refetch])

  const refresh = useCallback(async () => {
    await refetch()
  }, [refetch])

  return {
    activities,
    loading,
    error: error instanceof Error ? error : null,
    hasMore,
    loadMore,
    refresh,
  }
}

// ============================================================================
// Helper to log activity manually (for client-side actions)
// ============================================================================

export async function logActivity(params: {
  action: ActivityAction
  entityType: EntityType
  entityId?: string
  entityName?: string
  changes?: Record<string, { from: unknown; to: unknown }>
  metadata?: Record<string, unknown>
}) {
  const supabase = createBrowserClient()

  const [{ data: { user } }, { data: company }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from('companies').select('id').single()
  ])

  if (!user || !company) return

  return activityService.logActivity({
    userId: user.id,
    companyId: company.id,
    userName: (user.user_metadata?.full_name || user.email?.split("@")[0]) as string,
    userEmail: user.email ?? null,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    entityName: params.entityName,
    changes: params.changes,
    metadata: params.metadata,
  })
}

// ============================================================================
// Format activity for display
// ============================================================================

export function formatActivity(activity: ActivityLogEntry): string {
  const who = activity.userName || activity.userEmail?.split("@")[0] || "Någon"
  const action = ACTION_LABELS[activity.action] || activity.action
  const what = activity.entityName || ENTITY_LABELS[activity.entityType] || activity.entityType

  return `${who} ${action} ${what}`
}

export function formatActivityTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return "just nu"
  if (minutes < 60) return `${minutes} min sedan`
  if (hours < 24) return `${hours} tim sedan`
  if (days < 7) return `${days} dagar sedan`

  return date.toLocaleDateString("sv-SE", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}
