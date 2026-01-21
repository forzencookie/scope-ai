"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Package, Calendar, Tag, Banknote, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { useBulkSelection } from "@/components/shared/bulk-action-toolbar"
import {
    GridTableHeader,
    GridTableRows,
    GridTableRow,
} from "@/components/ui/grid-table"
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

import { formatCurrency } from "@/lib/utils"
import { StatCard, StatCardGrid } from "@/components/ui/stat-card"
import { useTextMode } from "@/providers/text-mode-provider"
import { inventarieService, type Inventarie, type InventarieStats } from "@/lib/services/inventarie-service"

export function InventarierTable() {
    const { text } = useTextMode()
    const [inventarier, setInventarier] = useState<Inventarie[]>([])
    const [stats, setStats] = useState<InventarieStats | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [newAsset, setNewAsset] = useState<Partial<Inventarie>>({
        livslangdAr: 5
    })

    // Fetch inventarier using service for single source of truth
    const fetchInventarier = useCallback(async () => {
        try {
            const [listData, statsData] = await Promise.all([
                inventarieService.getInventarier(),
                inventarieService.getStats()
            ])
            setInventarier(listData.inventarier)
            setStats(statsData)
        } catch (error) {
            console.error('Failed to fetch inventarier:', error)
            setInventarier([])
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchInventarier()
    }, [fetchInventarier])

    const handleAddAsset = async () => {
        if (!newAsset.namn || !newAsset.inkopspris) return

        try {
            await inventarieService.addInventarie({
                namn: newAsset.namn,
                kategori: newAsset.kategori || 'Inventarier',
                inkopsdatum: newAsset.inkopsdatum || new Date().toISOString().split('T')[0],
                inkopspris: Number(newAsset.inkopspris),
                livslangdAr: Number(newAsset.livslangdAr) || 5,
            })
            setIsDialogOpen(false)
            setNewAsset({ livslangdAr: 5 })
            // Refresh data
            fetchInventarier()
        } catch (error) {
            console.error('Failed to add inventarie:', error)
        }
    }

    const selection = useBulkSelection(inventarier)

    return (
        <div className="space-y-6">
            {/* Header Section (Moved to Top) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold tracking-tight">Tillgångar</h2>
                    <p className="text-muted-foreground">
                        Datorer, möbler och andra saker du äger.
                    </p>
                </div>
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

            <StatCardGrid columns={3}>
                <StatCard
                    label="Totalt Inköpsvärde"
                    value={formatCurrency(stats?.totalInkopsvarde || 0)}
                    headerIcon={Banknote}
                />
                <StatCard
                    label="Antal Tillgångar"
                    value={stats?.totalCount || 0}
                    subtitle="registrerade"
                    headerIcon={Package}
                />
                <StatCard
                    label="Kategorier"
                    value={stats?.kategorier || 0}
                    subtitle="olika typer"
                    headerIcon={Tag}
                />
            </StatCardGrid>

            {/* Table Section */}
            <div>
                <div className="border-b-2 border-border/60 mb-4" />

                <div className="flex items-center justify-between pb-4">
                    <h3 className="text-base font-semibold text-muted-foreground uppercase tracking-wider">Inventarieförteckning</h3>
                </div>


                <div className="w-full overflow-x-auto pb-2">
                    <div className="min-w-[800px] px-2">
                        <GridTableHeader
                            gridCols={14}
                            columns={[
                                { label: "Namn", icon: Tag, span: 4 },
                                { label: "Kategori", span: 2 },
                                { label: "Inköpsdatum", icon: Calendar, span: 2 },
                                { label: "Inköpspris", icon: Banknote, span: 3 },
                                { label: "Livslängd", icon: Clock, span: 2 },
                            ]}
                            trailing={
                                <Checkbox
                                    checked={selection.allSelected && inventarier.length > 0}
                                    onCheckedChange={selection.toggleAll}
                                    className="mr-2"
                                />
                            }
                        />

                        <GridTableRows>
                            {inventarier.map((item) => (
                                <GridTableRow
                                    key={item.id}
                                    gridCols={14}
                                    selected={selection.isSelected(item.id)}
                                    onClick={() => selection.toggleItem(item.id)}
                                    className="cursor-pointer group"
                                >
                                    <div style={{ gridColumn: 'span 4' }} className="font-medium truncate">
                                        {item.namn}
                                    </div>
                                    <div style={{ gridColumn: 'span 2' }} className="text-muted-foreground truncate">
                                        {item.kategori}
                                    </div>
                                    <div style={{ gridColumn: 'span 2' }} className="text-muted-foreground tabular-nums truncate">
                                        {item.inkopsdatum}
                                    </div>
                                    <div style={{ gridColumn: 'span 3' }} className="font-mono font-medium truncate">
                                        {formatCurrency(item.inkopspris)}
                                    </div>
                                    <div style={{ gridColumn: 'span 2' }} className="flex items-center h-8 truncate">
                                        <span className="text-muted-foreground">{item.livslangdAr} år</span>
                                    </div>
                                    <div
                                        style={{ gridColumn: 'span 1' }}
                                        className="flex justify-end items-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <Checkbox
                                            checked={selection.isSelected(item.id)}
                                            onCheckedChange={() => selection.toggleItem(item.id)}
                                            className="mr-2"
                                        />
                                    </div>
                                </GridTableRow>
                            ))}

                            {inventarier.length === 0 && !isLoading && (
                                <div className="text-center py-12 text-muted-foreground">
                                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>Inga tillgångar registrerade än</p>
                                </div>
                            )}

                            {isLoading && (
                                <div className="text-center py-12 text-muted-foreground">
                                    <p>Laddar...</p>
                                </div>
                            )}
                        </GridTableRows>
                    </div>
                </div>
            </div>
        </div>
    )
}
