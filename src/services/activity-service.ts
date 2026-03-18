import { createBrowserClient } from '@/lib/database/client'
import type { Database, Json } from '@/types/database'
import type { ActivitySummary } from '@/lib/ai-schema'

type ActivityLogRow = Database['public']['Tables']['activity_log']['Row']

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

function mapRow(row: ActivityLogRow): ActivityLogEntry {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name || 'System',
    userEmail: row.user_email,
    companyId: row.company_id || '', // Should never be empty in a real scenario
    action: (row.action || 'updated') as ActivityAction,
    entityType: (row.entity_type || 'transactions') as EntityType,
    entityId: row.entity_id,
    entityName: row.entity_name || 'Objekt',
    changes: row.changes as Record<string, { from: unknown; to: unknown }> | null,
    createdAt: new Date(row.created_at),
  }
}

export const activityService = {
  async getActivities({
    companyId,
    entityType,
    entityId,
    dateFilter,
    limit = 20,
    offset = 0
  }: {
    companyId: string
    entityType?: EntityType
    entityId?: string
    dateFilter?: Date | null
    limit?: number
    offset?: number
  }): Promise<{ activities: ActivityLogEntry[]; hasMore: boolean }> {
    const supabase = createBrowserClient()

    let query = supabase
      .from("activity_log")
      .select("*", { count: 'exact' })
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (entityType) {
      query = query.eq("entity_type", entityType)
    }

    if (entityId) {
      query = query.eq("id", entityId)
    }

    if (dateFilter) {
      const dayStart = new Date(dateFilter)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(dateFilter)
      dayEnd.setHours(23, 59, 59, 999)
      query = query.gte("created_at", dayStart.toISOString()).lte("created_at", dayEnd.toISOString())
    }

    const { data, error, count } = await query
    if (error) throw error

    const activities = (data || []).map(mapRow)
    const totalCount = count || 0
    const hasMore = offset + activities.length < totalCount

    return { activities, hasMore }
  },

  async logActivity({
    userId,
    companyId,
    userName,
    userEmail,
    action,
    entityType,
    entityId,
    entityName,
    changes,
    metadata
  }: {
    userId: string
    companyId: string
    userName: string
    userEmail?: string | null
    action: ActivityAction
    entityType: EntityType
    entityId?: string
    entityName?: string
    changes?: Record<string, { from: unknown; to: unknown }>
    metadata?: Record<string, unknown>
  }) {
    const supabase = createBrowserClient()

    const { data, error } = await supabase.from("activity_log").insert({
      user_id: userId,
      company_id: companyId,
      user_name: userName,
      user_email: userEmail ?? null,
      action,
      entity_type: entityType,
      entity_id: entityId,
      entity_name: entityName,
      changes: (changes as unknown as Json) ?? null,
      metadata: (metadata as unknown as Json) ?? null,
    }).select().single()

    if (error) throw error
    return mapRow(data)
  },

  /**
   * Get activity summary statistics
   */
  async getActivitySummary(companyId: string, days: number = 30): Promise<ActivitySummary> {
    const supabase = createBrowserClient()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data, error } = await supabase
      .from("activity_log")
      .select("action, entity_type, metadata")
      .eq("company_id", companyId)
      .gte("created_at", startDate.toISOString())

    if (error) throw error

    const totalEvents = data.length
    const bySource: Record<string, number> = {}
    const byType: Record<string, number> = {}

    data.forEach(row => {
      // Safely extract source from metadata JSON
      const metadata = row.metadata as Record<string, unknown> | null
      const source = (metadata && typeof metadata.source === 'string') 
        ? metadata.source 
        : 'system'
        
      const type = row.entity_type || 'other'
      bySource[source] = (bySource[source] || 0) + 1
      byType[type] = (byType[type] || 0) + 1
    })

    const topType = Object.entries(byType).sort((a, b) => b[1] - a[1])[0]?.[0]

    return {
      period: `senaste ${days} dagarna`,
      totalEvents,
      bySource,
      byType,
      highlights: [
        `${totalEvents} händelser loggade senaste perioden.`,
        topType ? `Mest aktiva kategori: ${topType}.` : 'Ingen aktivitet loggad.'
      ]
    }
  }
}
