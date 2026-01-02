"use client"

import { useState } from "react"
import { Plus, Monitor, Package, PenTool, Calendar, Tag, Banknote, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { useBulkSelection } from "@/components/shared/bulk-action-toolbar"
import {
    Table3Header,
    Table3Rows,
    Table3Row,
} from "@/components/bokforing/report-table"
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

interface Asset {
    id: string
    name: string
    category: string
    purchaseDate: string
    purchasePrice: number
    usefulLifeYears: number
    depreciationMethod: string
    currentValue: number
}

// Mock data for initial view
const initialAssets: Asset[] = [
    {
        id: "1",
        name: "MacBook Pro M3 Max",
        category: "Datorer",
        purchaseDate: "2024-01-15",
        purchasePrice: 34995,
        usefulLifeYears: 3,
        depreciationMethod: "Linjär",
        currentValue: 29000
    },
    {
        id: "2",
        name: "Kontorsstol Herman Miller",
        category: "Inventarier",
        purchaseDate: "2024-02-01",
        purchasePrice: 15400,
        usefulLifeYears: 5,
        depreciationMethod: "Linjär",
        currentValue: 14100
    }
]

export function InventarierTable() {
    const { text } = useTextMode()
    const [assets, setAssets] = useState<Asset[]>(initialAssets)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [newAsset, setNewAsset] = useState<Partial<Asset>>({
        usefulLifeYears: 5,
        depreciationMethod: "Linjär"
    })

    const handleAddAsset = () => {
        if (!newAsset.name || !newAsset.purchasePrice) return

        const asset: Asset = {
            id: Math.random().toString(36).substr(2, 9),
            name: newAsset.name,
            category: newAsset.category || "Inventarier",
            purchaseDate: newAsset.purchaseDate || new Date().toISOString().split('T')[0],
            purchasePrice: Number(newAsset.purchasePrice),
            usefulLifeYears: Number(newAsset.usefulLifeYears) || 5,
            depreciationMethod: "Linjär",
            currentValue: Number(newAsset.purchasePrice) // Start at full value
        }

        setAssets([...assets, asset])
        setIsDialogOpen(false)
        setNewAsset({ usefulLifeYears: 5, depreciationMethod: "Linjär" })
    }

    const selection = useBulkSelection(assets)

    const totalValue = assets.reduce((sum, asset) => sum + asset.currentValue, 0)
    const totalPurchase = assets.reduce((sum, asset) => sum + asset.purchasePrice, 0)

    return (
        <div className="space-y-6">
            {/* Header Section (Moved to Top) */}
            <div className="flex items-center justify-between pb-2">
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
                                    value={newAsset.name || ""}
                                    onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
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
                                    value={newAsset.category || ""}
                                    onChange={(e) => setNewAsset({ ...newAsset, category: e.target.value })}
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
                                    value={newAsset.purchasePrice || ""}
                                    onChange={(e) => setNewAsset({ ...newAsset, purchasePrice: Number(e.target.value) })}
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
                                    value={newAsset.purchaseDate || ""}
                                    onChange={(e) => setNewAsset({ ...newAsset, purchaseDate: e.target.value })}
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
                                    value={newAsset.usefulLifeYears || ""}
                                    onChange={(e) => setNewAsset({ ...newAsset, usefulLifeYears: Number(e.target.value) })}
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
                    label="Totalt Bokfört Värde"
                    value={formatCurrency(totalValue)}
                    headerIcon={Monitor}
                />
                <StatCard
                    label="Anskaffningsvärde"
                    value={formatCurrency(totalPurchase)}
                    headerIcon={Package}
                />
                <StatCard
                    label="Antal Tillgångar"
                    value={assets.length}
                    subtitle="inventarier"
                    headerIcon={PenTool}
                />
            </StatCardGrid>

            {/* Table Section */}
            <div>
                <div className="border-b-2 border-border/60 mb-4" />

                <div className="flex items-center justify-between pb-4">
                    <h3 className="text-base font-semibold text-muted-foreground uppercase tracking-wider">Inventarieförteckning</h3>
                </div>


                <Table3Header
                    gridCols={15}
                    columns={[
                        { label: "Namn", icon: Tag, span: 4 },
                        { label: "Kategori", span: 2 },
                        { label: "Inköpsdatum", icon: Calendar, span: 2 },
                        { label: "Ansk. värde", icon: Banknote, span: 2 },
                        { label: "Bokfört värde", span: 2 },
                        { label: "Livslängd", icon: Clock, span: 2 },
                    ]}
                    trailing={
                        <Checkbox
                            checked={selection.allSelected && assets.length > 0}
                            onCheckedChange={selection.toggleAll}
                            className="mr-2"
                        />
                    }
                />

                <Table3Rows>
                    {assets.map((asset) => (
                        <Table3Row
                            key={asset.id}
                            gridCols={15}
                            selected={selection.isSelected(asset.id)}
                            onClick={() => selection.toggleItem(asset.id)}
                            className="cursor-pointer group"
                        >
                            <div style={{ gridColumn: 'span 4' }} className="font-medium">
                                {asset.name}
                            </div>
                            <div style={{ gridColumn: 'span 2' }} className="text-muted-foreground">
                                {asset.category}
                            </div>
                            <div style={{ gridColumn: 'span 2' }} className="text-muted-foreground tabular-nums">
                                {asset.purchaseDate}
                            </div>
                            <div style={{ gridColumn: 'span 2' }} className="font-mono text-muted-foreground">
                                {formatCurrency(asset.purchasePrice)}
                            </div>
                            <div style={{ gridColumn: 'span 2' }} className="font-mono font-medium">
                                {formatCurrency(asset.currentValue)}
                            </div>
                            <div style={{ gridColumn: 'span 2' }} className="flex items-center h-8">
                                <span className="text-muted-foreground">{asset.usefulLifeYears} år</span>
                            </div>
                            <div
                                style={{ gridColumn: 'span 1' }}
                                className="flex justify-end items-center opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <Checkbox
                                    checked={selection.isSelected(asset.id)}
                                    onCheckedChange={() => selection.toggleItem(asset.id)}
                                    className="mr-2"
                                />
                            </div>
                        </Table3Row>
                    ))}

                    {assets.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>Inga tillgångar registrerade än</p>
                        </div>
                    )}
                </Table3Rows>
            </div>
        </div>
    )
}
