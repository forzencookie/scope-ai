import { useState, useCallback, useEffect } from "react"
import { useInventarier } from "@/hooks/use-inventarier"
import { useVerifications } from "@/hooks/use-verifications"
import { useToast } from "@/components/ui/toast"
import { useTextMode } from "@/providers/text-mode-provider"
import { useBulkSelection } from "@/components/shared/bulk-action-toolbar"
import { type Inventarie } from '@/services/inventarie-service'

export function useInventarierLogic() {
    const { text } = useTextMode()
    const { inventarier, isLoading, stats, fetchInventarier, addInventarie } = useInventarier()
    const { addVerification } = useVerifications()
    const toast = useToast()
    
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [newAsset, setNewAsset] = useState<Partial<Inventarie>>({
        livslangdAr: 5
    })

    // Initial fetch
    useEffect(() => {
        fetchInventarier()
    }, [fetchInventarier])

    const handleDepreciate = useCallback(async () => {
        // Simple straight-line depreciation (monthly)
        const totalMonthly = inventarier.reduce((acc, curr) => {
            if (!curr.livslangdAr || curr.status === 'såld' || curr.status === 'avskriven') return acc;
            const monthly = curr.inkopspris / (curr.livslangdAr * 12);
            return acc + monthly;
        }, 0);

        if (totalMonthly <= 0) {
            toast.error("Inget att skriva av", "Inga aktiva inventarier hittades.");
            return;
        }

        const amount = Math.round(totalMonthly);

        await addVerification({
            date: new Date().toISOString().split('T')[0],
            description: `Månatlig avskrivning inventarier`,
            sourceType: 'generated',
            rows: [
                { account: '7832', debit: amount, credit: 0, description: 'Avskrivning inventarier' },
                { account: '1229', debit: 0, credit: amount, description: 'Ack. avskrivning inv.' }
            ]
        });

        toast.success("Bokfört", `Avskrivning på ${amount} kr har bokförts.`);
    }, [inventarier, addVerification, toast])

    const handleAddAsset = useCallback(async () => {
        if (!newAsset.namn || !newAsset.inkopspris) return

        try {
            await addInventarie({
                namn: newAsset.namn,
                kategori: newAsset.kategori || 'Inventarier',
                inkopsdatum: newAsset.inkopsdatum || new Date().toISOString().split('T')[0],
                inkopspris: Number(newAsset.inkopspris),
                livslangdAr: Number(newAsset.livslangdAr) || 5,
            })
            setIsDialogOpen(false)
            setNewAsset({ livslangdAr: 5 })
        } catch {
            // Error handled in hook (logged)
        }
    }, [newAsset, addInventarie])

    const selection = useBulkSelection(inventarier)

    return {
        // State
        isDialogOpen, setIsDialogOpen,
        newAsset, setNewAsset,
        isLoading,
        text,

        // Data
        inventarier,
        stats,
        selection,
        
        // Handlers
        handleDepreciate,
        handleAddAsset
    }
}
