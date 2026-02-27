"use client"

/**
 * useActivityLog - Hook for fetching and displaying activity history
 *
 * Shows who did what and when - the audit trail for accountability.
 * "Johan booked transaction 'Inköp kontorsmaterial' at 14:32"
 */

import { useState, useEffect, useCallback } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "./use-auth"
import { getSupabaseClient } from "@/lib/database/supabase"

// ============================================================================
// Types
// ============================================================================

export interface ActivityLogEntry {
  id: string
  userId: string | null
  userName: string | null
  userEmail: string | null
  companyId: string | null
  action: ActivityAction
  entityType: EntityType
  entityId: string | null
  entityName: string | null
  changes: Record<string, { from: unknown; to: unknown }> | null
  createdAt: Date
}

export type ActivityAction =
  | "created"
  | "updated"
  | "deleted"
  | "booked"
  | "sent"
  | "approved"
  | "rejected"
  | "paid"
  | "archived"
  | "restored"
  | "exported"
  | "imported"
  | "invited"
  | "removed"
  | "login"
  | "logout"

export type EntityType =
  | "transactions"
  | "customerinvoices"
  | "supplierinvoices"
  | "receipts"
  | "verifications"
  | "payslips"
  | "employees"
  | "shareholders"
  | "companies"
  | "profiles"

interface UseActivityLogOptions {
  /** Filter by entity type */
  entityType?: EntityType
  /** Filter by specific entity ID */
  entityId?: string
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
  customerinvoices: "kundfaktura",
  supplierinvoices: "leverantörsfaktura",
  receipts: "kvitto",
  verifications: "verifikation",
  payslips: "lönebesked",
  employees: "anställd",
  shareholders: "aktieägare",
  companies: "företag",
  profiles: "profil",
}

// ============================================================================
// Query Keys
// ============================================================================

export const activityLogQueryKeys = {
  all: ["activity-log"] as const,
  list: (entityType?: string, entityId?: string) =>
    [...activityLogQueryKeys.all, "list", entityType, entityId] as const,
}

// ============================================================================
// Row mapper
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(row: any): ActivityLogEntry {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    userEmail: row.user_email,
    companyId: row.company_id,
    action: row.action as ActivityAction,
    entityType: row.entity_type as EntityType,
    entityId: row.entity_id,
    entityName: row.entity_name,
    changes: row.changes as Record<string, { from: unknown; to: unknown }> | null,
    createdAt: new Date(row.created_at),
  }
}

// ============================================================================
// Main Hook
// ============================================================================

export function useActivityLog({
  entityType,
  entityId,
  limit = 20,
  realtime = true,
}: UseActivityLogOptions = {}): UseActivityLogReturn {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [extraActivities, setExtraActivities] = useState<ActivityLogEntry[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [loadMoreOffset, setLoadMoreOffset] = useState(0)

  const supabase = getSupabaseClient()

  const {
    data: initialActivities = [],
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: activityLogQueryKeys.list(entityType, entityId),
    queryFn: async () => {
      let query = supabase
        .from("activity_log")
        .select("*")
        .order("created_at", { ascending: false })
        .range(0, limit - 1)

      if (entityType) {
        query = query.eq("entity_type", entityType)
      }

      if (entityId) {
        query = query.eq("entity_id", entityId)
      }

      const { data, error: fetchError } = await query
      if (fetchError) throw fetchError

      const mapped = (data || []).map(mapRow)
      setHasMore(mapped.length === limit)
      setLoadMoreOffset(limit)
      setExtraActivities([])
      return mapped
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

    let query = supabase
      .from("activity_log")
      .select("*")
      .order("created_at", { ascending: false })
      .range(loadMoreOffset, loadMoreOffset + limit - 1)

    if (entityType) {
      query = query.eq("entity_type", entityType)
    }

    if (entityId) {
      query = query.eq("entity_id", entityId)
    }

    const { data, error: fetchError } = await query
    if (fetchError) return

    const mapped = (data || []).map(mapRow)
    setExtraActivities(prev => [...prev, ...mapped])
    setLoadMoreOffset(prev => prev + limit)
    setHasMore(mapped.length === limit)
  }, [user, supabase, entityType, entityId, limit, loadMoreOffset])

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
          const newActivity = mapRow(payload.new)

          // Only add if it matches our filters
          if (entityType && newActivity.entityType !== entityType) return
          if (entityId && newActivity.entityId !== entityId) return

          // Prepend to the query cache
          queryClient.setQueryData<ActivityLogEntry[]>(
            activityLogQueryKeys.list(entityType, entityId),
            (old) => old ? [newActivity, ...old] : [newActivity]
          )
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [realtime, user, entityType, entityId, supabase, queryClient])

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
  const supabase = getSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  // Type assertion needed because Supabase types may be out of sync with actual schema
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from("activity_log") as any).insert({
    user_id: user.id,
    user_name: user.user_metadata?.full_name || user.email?.split("@")[0],
    user_email: user.email,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId,
    entity_name: params.entityName,
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
