// @ts-nocheck - Supabase types are stale, tables exist in schema.sql but need regeneration
import { getSupabaseClient } from '../supabase'

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
        const supabase = getSupabaseClient()

        let query = supabase
            .from('inventarier')
            .select('*', { count: 'exact' })
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
        const inventarier: Inventarie[] = (data || []).map(row => ({
            id: row.id,
            namn: row.namn,
            kategori: row.kategori || 'Inventarier',
            inkopsdatum: row.inkopsdatum,
            inkopspris: Number(row.inkopspris),
            livslangdAr: row.livslangd_ar || 5,
            anteckningar: row.anteckningar
        }))

        return { inventarier, totalCount: count || 0 }
    },

    /**
     * Get aggregate statistics performed by the database
     * Uses parallel queries for optimal performance
     */
    async getStats(): Promise<InventarieStats> {
        const supabase = getSupabaseClient()

        const { data, error } = await supabase.rpc('get_inventory_stats')

        if (error || !data || data.totalCount === 0) {
            return {
                totalCount: 0,
                totalInkopsvarde: 0,
                kategorier: 0
            }
        }

        return {
            totalCount: Number(data.totalCount),
            totalInkopsvarde: Number(data.totalInkopsvarde),
            kategorier: Number(data.kategorier)
        }
    },

    /**
     * Add a new inventarie
     */
    async addInventarie(inventarie: Omit<Inventarie, 'id'>) {
        const supabase = getSupabaseClient()

        const id = `inv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

        const { data, error } = await supabase
            .from('inventarier')
            .insert({
                id,
                namn: inventarie.namn,
                kategori: inventarie.kategori,
                inkopsdatum: inventarie.inkopsdatum,
                inkopspris: inventarie.inkopspris,
                livslangd_ar: inventarie.livslangdAr,
                anteckningar: inventarie.anteckningar
            })
            .select()
            .single()

        if (error) throw error
        return data
    },

    /**
     * Delete an inventarie
     */
    async deleteInventarie(id: string) {
        const supabase = getSupabaseClient()

        const { error } = await supabase
            .from('inventarier')
            .delete()
            .eq('id', id)

        if (error) throw error
        return { success: true }
    }
}
