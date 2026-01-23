"use client"

import { useState, useEffect } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useBulkSelection } from "@/components/shared/bulk-action-toolbar"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useTextMode } from "@/providers/text-mode-provider"
import { type Inventarie } from "@/lib/services/inventarie-service"

// Custom Hook & Components
import { useInventarier } from "@/hooks/use-inventarier"
import { useVerifications } from "@/hooks/use-verifications"
import { useToast } from "@/components/ui/toast"
import { InventarierStats } from "./inventarier/stats"
import { InventarierGrid } from "./inventarier/grid"
import { Calculator } from "lucide-react"

export function InventarierTable() {
    const { text } = useTextMode()
    const { inventarier, isLoading, stats, fetchInventarier, addInventarie } = useInventarier()
    const { addVerification } = useVerifications()
    const { toast } = useToast()
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [newAsset, setNewAsset] = useState<Partial<Inventarie>>({
        livslangdAr: 5
    })

    // Initial fetch
    useEffect(() => {
        fetchInventarier()
    }, [fetchInventarier])

    const handleDepreciate = async () => {
        // Simple straight-line depreciation (monthly)
        const totalMonthly = inventarier.reduce((acc, curr) => {
            if (!curr.livslangdAr || curr.status === 'såld' || curr.status === 'avskriven') return acc;
            const monthly = curr.inkopspris / (curr.livslangdAr * 12);
            return acc + monthly;
        }, 0);

        if (totalMonthly <= 0) {
            toast({ title: "Inget att skriva av", description: "Inga aktiva inventarier hittades.", variant: "destructive" });
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

        toast({ title: "Bokfört", description: `Avskrivning på ${amount} kr har bokförts.` });
    }

    const handleAddAsset = async () => {
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
        } catch (error) {
            // Error handled in hook (logged)
        }
    }

    const selection = useBulkSelection(inventarier)

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold tracking-tight">Tillgångar</h2>
                    <p className="text-muted-foreground">
                        Datorer, möbler och andra saker du äger.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2" onClick={handleDepreciate}>
                        <Calculator className="h-4 w-4" />
                        Bokför avskrivning
                    </Button>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <Plus className="h-4 w-4" />
                                Lägg till
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{text.assets.newAsset}</DialogTitle>
                            <DialogDescription>
                                {text.assets.newAssetDesc}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">
                                    Namn
                                </Label>
                                <Input
                                    id="name"
                                    value={newAsset.namn || ""}
                                    onChange={(e) => setNewAsset({ ...newAsset, namn: e.target.value })}
                                    className="col-span-3"
                                    placeholder="t.ex. MacBook Pro"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="category" className="text-right">
                                    Kategori
                                </Label>
                                <Input
                                    id="category"
                                    value={newAsset.kategori || ""}
                                    onChange={(e) => setNewAsset({ ...newAsset, kategori: e.target.value })}
                                    className="col-span-3"
                                    placeholder="Datorer, Inventarier..."
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="price" className="text-right">
                                    Inköpspris
                                </Label>
                                <Input
                                    id="price"
                                    type="number"
                                    value={newAsset.inkopspris || ""}
                                    onChange={(e) => setNewAsset({ ...newAsset, inkopspris: Number(e.target.value) })}
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="date" className="text-right">
                                    Datum
                                </Label>
                                <Input
                                    id="date"
                                    type="date"
                                    value={newAsset.inkopsdatum || ""}
                                    onChange={(e) => setNewAsset({ ...newAsset, inkopsdatum: e.target.value })}
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="life" className="text-right">
                                    Livslängd (år)
                                </Label>
                                <Input
                                    id="life"
                                    type="number"
                                    value={newAsset.livslangdAr || ""}
                                    onChange={(e) => setNewAsset({ ...newAsset, livslangdAr: Number(e.target.value) })}
                                    className="col-span-3"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Avbryt</Button>
                            <Button onClick={handleAddAsset}>Spara</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Stats Component */}
            <InventarierStats stats={stats} />

            {/* Table Section */}
            <div>
                <div className="border-b-2 border-border/60 mb-4" />

                <div className="flex items-center justify-between pb-4">
                    <h3 className="text-base font-semibold text-muted-foreground uppercase tracking-wider">Inventarieförteckning</h3>
                </div>

                <InventarierGrid
                    inventarier={inventarier}
                    isLoading={isLoading}
                    selection={selection}
                />
            </div>
        </div>
    )
}
