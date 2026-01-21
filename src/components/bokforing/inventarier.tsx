"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Plus, Package, Calendar, Tag, Banknote, Clock, Monitor, Armchair, Car, Wrench } from "lucide-react"
import { cn } from "@/lib/utils"
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

    // Calculate category breakdown
    const categoryBreakdown = useMemo(() => {
        const breakdown: Record<string, { count: number; value: number; icon: typeof Monitor }> = {}

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
        })

        return breakdown
    }, [inventarier])

    const totalValue = stats?.totalInkopsvarde || 0

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

            {/* Asset Value Overview */}
            <div className="rounded-xl border bg-gradient-to-br from-slate-50 to-zinc-50 dark:from-slate-950/40 dark:to-zinc-950/40 p-5">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                    {/* Total Value Section */}
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                            <Package className="h-7 w-7 text-slate-600 dark:text-slate-400" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Totalt tillgångsvärde</p>
                            <p className="text-3xl font-bold tabular-nums">{formatCurrency(totalValue)}</p>
                            <p className="text-sm text-muted-foreground">
                                {stats?.totalCount || 0} tillgångar i {stats?.kategorier || 0} kategorier
                            </p>
                        </div>
                    </div>

                    {/* Category Breakdown */}
                    {Object.keys(categoryBreakdown).length > 0 && (
                        <div className="flex flex-wrap gap-3">
                            {Object.entries(categoryBreakdown).map(([category, data]) => {
                                const Icon = data.icon
                                const percentage = totalValue > 0 ? Math.round((data.value / totalValue) * 100) : 0

                                return (
                                    <div
                                        key={category}
                                        className="flex items-center gap-3 px-4 py-3 rounded-lg bg-background border border-border/50 min-w-[140px]"
                                    >
                                        <div className={cn(
                                            "h-9 w-9 rounded-lg flex items-center justify-center",
                                            "bg-muted"
                                        )}>
                                            <Icon className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{category}</p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-muted-foreground">{data.count} st</span>
                                                <span className="text-xs text-muted-foreground">•</span>
                                                <span className="text-xs font-medium">{percentage}%</span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Value Distribution Bar */}
                {Object.keys(categoryBreakdown).length > 1 && (
                    <div className="mt-4 pt-4 border-t">
                        <p className="text-xs text-muted-foreground mb-2">Värdefördelning</p>
                        <div className="h-2 rounded-full bg-muted overflow-hidden flex">
                            {Object.entries(categoryBreakdown).map(([category, data], index) => {
                                const percentage = totalValue > 0 ? (data.value / totalValue) * 100 : 0
                                const colors = [
                                    'bg-slate-500',
                                    'bg-blue-500',
                                    'bg-emerald-500',
                                    'bg-amber-500',
                                    'bg-violet-500',
                                ]
                                return (
                                    <div
                                        key={category}
                                        className={cn("h-full transition-all", colors[index % colors.length])}
                                        style={{ width: `${percentage}%` }}
                                        title={`${category}: ${formatCurrency(data.value)}`}
                                    />
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>

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
