import { createBrowserClient } from '@/lib/database/client'
import { nullToUndefined } from '@/lib/utils'


// Types matching schema.sql inventarier table
export type Inventarie = {
    id: string
    namn: string
    kategori: string
    inkopsdatum: string
    inkopspris: number
    livslangdAr: number
    anteckningar?: string
    status?: 'aktiv' | 'såld' | 'avskriven'
}

export type InventarieStats = {
    totalCount: number           // Number of assets
    totalInkopsvarde: number     // Sum of purchase prices
    kategorier: number           // Number of unique categories
}

export const inventarieService = {
    /**
     * Get all inventarier with optional filters
     */
    async getInventarier({
        limit = 100,
        offset = 0,
        kategori
    }: {
        limit?: number
        offset?: number
        kategori?: string
    } = {}) {
        const supabase = createBrowserClient()

        // Get company context for explicit filtering
        const { data: company } = await supabase.from('companies').select('id').single()
        if (!company) return { inventarier: [], totalCount: 0 }

        let query = supabase
            .from('inventarier')
            .select('*', { count: 'exact' })
            .eq('company_id', company.id)
            .order('inkopsdatum', { ascending: false })
            .range(offset, offset + limit - 1)

        if (kategori) {
            query = query.eq('kategori', kategori)
        }

        const { data, error, count } = await query

        if (error) throw error

        // Return empty if no real data exists
        if (!data || data.length === 0) {
            return {
                inventarier: [],
                totalCount: 0
            }
        }

        // Map snake_case DB columns to camelCase for UI
        const inventarier: Inventarie[] = (data || []).map((row) => ({
            id: row.id,
            namn: row.namn ?? '',
            kategori: row.kategori || 'Inventarier',
            inkopsdatum: row.inkopsdatum ?? '',
            inkopspris: Number(row.inkopspris),
            livslangdAr: row.livslangd_ar || 5,
            anteckningar: nullToUndefined(row.anteckningar),
        }))

        return { inventarier, totalCount: count || 0 }
    },

    /**
     * Get aggregate statistics performed by the database
     * Uses parallel queries for optimal performance
     */
    async getStats(): Promise<InventarieStats> {
        const supabase = createBrowserClient()

        const { data, error } = await supabase.rpc('get_inventory_stats')

        if (error) {
            console.error('get_inventory_stats error:', error)
            return { totalCount: 0, totalInkopsvarde: 0, kategorier: 0 }
        }

        // Handle array return (RETURNS TABLE) — RPC returns Json
        const raw = Array.isArray(data) ? data[0] : data
        const stats = (raw && typeof raw === 'object' && !Array.isArray(raw))
            ? raw as Record<string, unknown>
            : null

        if (!stats) {
            return {
                totalCount: 0,
                totalInkopsvarde: 0,
                kategorier: 0
            }
        }

        return {
            totalCount: Number(stats.total_items || 0),
            totalInkopsvarde: Number(stats.total_value || 0),
            kategorier: Number(stats.category_count || stats.active_items || 0)
        }
    },

    /**
     * Add a new inventarie
     */
    async addInventarie(inventarie: Omit<Inventarie, 'id'>) {
        const supabase = createBrowserClient()

        // Get current user and company context for security
        const [{ data: { user } }, { data: company }] = await Promise.all([
            supabase.auth.getUser(),
            supabase.from('companies').select('id').single()
        ])

        if (!user || !company) throw new Error('Ingen inloggad användare eller företag saknas')

        const id = crypto.randomUUID()

        const { data, error } = await supabase
            .from('inventarier')
            .insert({
                id,
                user_id: user.id,
                company_id: company.id,
                namn: inventarie.namn,
                kategori: inventarie.kategori,
                inkopsdatum: inventarie.inkopsdatum,
                inkopspris: inventarie.inkopspris,
                livslangd_ar: inventarie.livslangdAr,
                anteckningar: inventarie.anteckningar,
            })
            .select()
            .single()

        if (error) throw error
        return data
    },

    /**
     * Update the status of an inventarie (e.g. aktiv → såld)
     */
    async updateStatus(id: string, status: 'aktiv' | 'såld' | 'avskriven') {
        const supabase = createBrowserClient()

        const { data, error } = await supabase
            .from('inventarier')
            .update({ status })
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return data
    },

    /**
     * Delete an inventarie
     */
    async deleteInventarie(id: string) {
        const supabase = createBrowserClient()

        const { error } = await supabase
            .from('inventarier')
            .delete()
            .eq('id', id)

        if (error) throw error
        return { success: true }
    }
}
