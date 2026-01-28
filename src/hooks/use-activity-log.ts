"use client"

/**
 * useActivityLog - Hook for fetching and displaying activity history
 *
 * Shows who did what and when - the audit trail for accountability.
 * "Johan booked transaction 'Inköp kontorsmaterial' at 14:32"
 */

import { useState, useEffect, useCallback } from "react"
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
// Main Hook
// ============================================================================

export function useActivityLog({
  entityType,
  entityId,
  limit = 20,
  realtime = true,
}: UseActivityLogOptions = {}): UseActivityLogReturn {
  const { user } = useAuth()
  const [activities, setActivities] = useState<ActivityLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)

  const supabase = getSupabaseClient()

  // Fetch activities
  const fetchActivities = useCallback(
    async (reset = false) => {
      if (!user) return

      try {
        setLoading(true)
        const currentOffset = reset ? 0 : offset

        let query = supabase
          .from("activity_log")
          .select("*")
          .order("created_at", { ascending: false })
          .range(currentOffset, currentOffset + limit - 1)

        if (entityType) {
          query = query.eq("entity_type", entityType)
        }

        if (entityId) {
          query = query.eq("entity_id", entityId)
        }

        const { data, error: fetchError } = await query

        if (fetchError) throw fetchError

        const mapped: ActivityLogEntry[] = (data || []).map((row) => ({
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
        }))

        if (reset) {
          setActivities(mapped)
          setOffset(limit)
        } else {
          setActivities((prev) => [...prev, ...mapped])
          setOffset((prev) => prev + limit)
        }

        setHasMore(mapped.length === limit)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to fetch activities"))
      } finally {
        setLoading(false)
      }
    },
    [user, supabase, entityType, entityId, limit, offset]
  )

  // Initial fetch
  useEffect(() => {
    let isMounted = true
    
    if (isMounted) {
      fetchActivities(true)
    }
    
    return () => { isMounted = false }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, entityType, entityId])

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
          const newActivity: ActivityLogEntry = {
            id: payload.new.id,
            userId: payload.new.user_id,
            userName: payload.new.user_name,
            userEmail: payload.new.user_email,
            companyId: payload.new.company_id,
            action: payload.new.action as ActivityAction,
            entityType: payload.new.entity_type as EntityType,
            entityId: payload.new.entity_id,
            entityName: payload.new.entity_name,
            changes: payload.new.changes,
            createdAt: new Date(payload.new.created_at),
          }

          // Only add if it matches our filters
          if (entityType && newActivity.entityType !== entityType) return
          if (entityId && newActivity.entityId !== entityId) return

          setActivities((prev) => [newActivity, ...prev])
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [realtime, user, entityType, entityId, supabase])

  return {
    activities,
    loading,
    error,
    hasMore,
    loadMore: () => fetchActivities(false),
    refresh: () => fetchActivities(true),
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
