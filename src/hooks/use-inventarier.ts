"use client"

import { useState, useCallback, useMemo } from "react"
import { inventarieService, type Inventarie } from '@/services/inventarie-service'
import { Monitor, Armchair, Car, Wrench, Package } from "lucide-react"

export function useInventarier() {
    const [inventarier, setInventarier] = useState<Inventarie[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)

    const fetchInventarier = useCallback(async () => {
        setIsLoading(true)
        setError(null)
        try {
            const listData = await inventarieService.getInventarier()
            setInventarier(listData.inventarier)
        } catch (err) {
            console.error('Failed to fetch inventarier:', err)
            setError(err instanceof Error ? err : new Error('Unknown error'))
        } finally {
            setIsLoading(false)
        }
    }, [])

    const addInventarie = useCallback(async (data: Omit<Inventarie, "id">) => {
        try {
            await inventarieService.addInventarie(data)
            await fetchInventarier()
            return true
        } catch (err) {
            console.error('Failed to add inventarie:', err)
            throw err
        }
    }, [fetchInventarier])

    // Derived statistics
    const stats = useMemo(() => {
        const breakdown: Record<string, { count: number; value: number; icon: typeof Monitor }> = {}
        let totalInkopsvarde = 0
        let totalCount = 0
        const categories = new Set<string>()

        // Category to icon mapping
        const iconMap: Record<string, typeof Monitor> = {
            'Datorer': Monitor,
            'Inventarier': Armchair,
            'Fordon': Car,
            'Verktyg': Wrench,
        }

        inventarier.forEach(item => {
            const cat = item.kategori || 'Övrigt'
            if (!breakdown[cat]) {
                breakdown[cat] = { count: 0, value: 0, icon: iconMap[cat] || Package }
            }
            breakdown[cat].count++
            breakdown[cat].value += item.inkopspris

            totalInkopsvarde += item.inkopspris
            totalCount++
            categories.add(cat)
        })

        return {
            breakdown,
            totalInkopsvarde,
            totalCount,
            kategorier: categories.size
        }
    }, [inventarier])

    return {
        inventarier,
        isLoading,
        error,
        stats,
        fetchInventarier,
        addInventarie
    }
}
