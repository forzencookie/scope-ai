"use client"

/**
 * useActivityLog - Hook for fetching and displaying activity history
 *
 * This is the ACCOUNTABILITY AUDIT TRAIL — "who did what and when".
 * Example: "Johan booked transaction 'Inköp kontorsmaterial' at 14:32"
 *
 * Backed by the `events` table which provides hash chain integrity,
 * typed sources/categories, and a unified timeline.
 */

import { useState, useCallback } from "react"
import { useQuery } from "@tanstack/react-query"
import { useAuth } from "./use-auth"
import { createBrowserClient } from "@/lib/database/client"
import { useCompany } from "@/providers/company-provider"
import type { Database, Json } from "@/types/database"

type EventsRow = Database['public']['Tables']['events']['Row']

// ============================================================================
// Types (preserved for backwards-compat with activity-feed.tsx)
// ============================================================================

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
  | "customer_invoices"
  | "supplier_invoices"
  | "receipts"
  | "verifications"
  | "payslips"
  | "employees"
  | "shareholders"
  | "companies"
  | "profiles"
  | "roadmaps"
  | "tax_reports"
  | "financial_periods"
  | "benefits"
  | "inventarier"

export interface ActivityLogEntry {
  id: string
  userId: string | null
  userName: string
  userEmail: string | null
  companyId: string
  action: ActivityAction
  entityType: EntityType
  entityId: string | null
  entityName: string
  changes: Record<string, { from: unknown; to: unknown }> | null
  createdAt: Date
}

// ============================================================================
// Row mapper: events → ActivityLogEntry
// ============================================================================

function mapEventToActivity(row: EventsRow): ActivityLogEntry {
  const metadata = (row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata))
    ? row.metadata as Record<string, unknown>
    : null

  const relatedTo = Array.isArray(row.related_to) ? row.related_to as Array<Record<string, unknown>> : []
  const firstRelated = relatedTo[0]

  return {
    id: row.id,
    userId: row.user_id,
    userName: row.actor_name || 'System',
    userEmail: null,
    companyId: row.company_id || '',
    action: (row.action || 'updated') as ActivityAction,
    entityType: ((metadata?.entityType as string) || (firstRelated?.type as string) || 'transactions') as EntityType,
    entityId: (metadata?.entityId as string) || (firstRelated?.id as string) || null,
    entityName: row.title || 'Objekt',
    changes: (metadata?.changes as Record<string, { from: unknown; to: unknown }>) || null,
    createdAt: new Date(row.timestamp ?? row.created_at ?? Date.now()),
  }
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

// ============================================================================
// Options
// ============================================================================

interface UseActivityLogOptions {
  entityType?: EntityType
  entityId?: string
  dateFilter?: Date | null
  limit?: number
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
// Main Hook
// ============================================================================

export function useActivityLog({
  entityType,
  entityId,
  dateFilter,
  limit = 20,
}: UseActivityLogOptions = {}): UseActivityLogReturn {
  const { user } = useAuth()
  const { company } = useCompany()
  const companyId = company?.id
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
      if (!companyId) return []

      let query = supabase
        .from('events')
        .select('*', { count: 'exact' })
        .eq('company_id', companyId)
        .order('timestamp', { ascending: false })
        .range(0, limit - 1)

      if (entityType) {
        // Filter by entity type stored in metadata or related_to
        query = query.contains('metadata', { entityType })
      }

      if (dateFilter) {
        const dayStart = new Date(dateFilter)
        dayStart.setHours(0, 0, 0, 0)
        const dayEnd = new Date(dateFilter)
        dayEnd.setHours(23, 59, 59, 999)
        query = query
          .gte('timestamp', dayStart.toISOString())
          .lte('timestamp', dayEnd.toISOString())
      }

      const { data, count } = await query

      const activities = (data || []).map(mapEventToActivity)
      const totalCount = count || 0
      setHasMore(activities.length < totalCount)
      setLoadMoreOffset(limit)
      setExtraActivities([])
      return activities
    },
    enabled: !!user && !!companyId,
    staleTime: 2 * 60 * 1000,
  })

  const activities = extraActivities.length > 0
    ? [...initialActivities, ...extraActivities]
    : initialActivities

  const loadMore = useCallback(async () => {
    if (!user || !companyId) return

    let query = supabase
      .from('events')
      .select('*', { count: 'exact' })
      .eq('company_id', companyId)
      .order('timestamp', { ascending: false })
      .range(loadMoreOffset, loadMoreOffset + limit - 1)

    if (entityType) {
      query = query.contains('metadata', { entityType })
    }

    if (dateFilter) {
      const dayStart = new Date(dateFilter)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(dateFilter)
      dayEnd.setHours(23, 59, 59, 999)
      query = query
        .gte('timestamp', dayStart.toISOString())
        .lte('timestamp', dayEnd.toISOString())
    }

    const { data, count } = await query

    const newActivities = (data || []).map(mapEventToActivity)
    setExtraActivities(prev => [...prev, ...newActivities])
    setLoadMoreOffset(prev => prev + limit)
    setHasMore(loadMoreOffset + newActivities.length < (count || 0))
  }, [user, companyId, entityType, limit, loadMoreOffset, dateFilter, supabase])

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

  const userName = (user.user_metadata?.full_name || user.email?.split("@")[0]) as string

  await supabase.from('events').insert({
    user_id: user.id,
    company_id: company.id,
    source: 'user',
    category: 'bokföring',
    action: params.action,
    title: params.entityName ?? `${params.entityType} ${params.action}`,
    actor_type: 'user',
    actor_id: user.id,
    actor_name: userName,
    metadata: {
      entityType: params.entityType,
      entityId: params.entityId,
      changes: params.changes as unknown as Json,
      ...params.metadata,
    } as unknown as Json,
    related_to: params.entityId
      ? [{ type: params.entityType, id: params.entityId }] as unknown as Json
      : null,
  })
}

// ============================================================================
// Format activity for display
// ============================================================================

export function formatActivity(activity: ActivityLogEntry): string {
  const who = activity.userName || "Någon"
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
