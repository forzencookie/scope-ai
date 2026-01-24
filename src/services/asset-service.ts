import { getSupabaseClient } from '@/lib/database/supabase'

export type Asset = {
    id: string
    name: string
    description?: string
    category: 'equipment' | 'furniture' | 'vehicle' | 'it' | 'other'
    purchaseDate: string
    purchaseValue: number
    currentValue: number
    depreciationRate: number
    depreciationMethod: 'linear' | 'declining'
    usefulLifeYears: number
    location?: string
    serialNumber?: string
    status: 'active' | 'disposed' | 'sold'
    disposedDate?: string
    disposedValue?: number
}

export type AssetStats = {
    totalAssets: number
    totalValue: number
    yearlyDepreciation: number
    activeCount: number
}

export const assetService = {
    /**
     * Get all assets for current user.
     */
    async getAssets(): Promise<Asset[]> {
        const supabase = getSupabaseClient()
        const { data, error } = await supabase
            .from('assets')
            .select('*')
            .order('purchase_date', { ascending: false })

        if (error) {
            console.error('Failed to fetch assets:', error)
            return []
        }

        return (data || []).map((a: any) => ({
            id: a.id,
            name: a.name,
            description: a.description,
            category: a.category || 'other',
            purchaseDate: a.purchase_date,
            purchaseValue: Number(a.purchase_value) || 0,
            currentValue: Number(a.current_value) || Number(a.purchase_value) || 0,
            depreciationRate: Number(a.depreciation_rate) || 20,
            depreciationMethod: a.depreciation_method || 'linear',
            usefulLifeYears: a.useful_life_years || 5,
            location: a.location,
            serialNumber: a.serial_number,
            status: a.status || 'active',
            disposedDate: a.disposed_date,
            disposedValue: a.disposed_value ? Number(a.disposed_value) : undefined,
        }))
    },

    /**
     * Get asset statistics.
     */
    async getStats(): Promise<AssetStats> {
        const assets = await this.getAssets()
        const activeAssets = assets.filter(a => a.status === 'active')

        const totalValue = activeAssets.reduce((sum, a) => sum + a.currentValue, 0)
        const yearlyDepreciation = activeAssets.reduce((sum, a) => {
            return sum + (a.currentValue * (a.depreciationRate / 100))
        }, 0)

        return {
            totalAssets: assets.length,
            totalValue,
            yearlyDepreciation,
            activeCount: activeAssets.length,
        }
    },
}
