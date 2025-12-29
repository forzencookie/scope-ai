"use client"

import { useState } from "react"
import { Plus, Monitor, Package, PenTool, MoreHorizontal, TrendingDown, Calendar, Tag, Banknote, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    DataTable,
    DataTableHeader,
    DataTableHeaderCell,
    DataTableBody,
    DataTableRow,
    DataTableCell,
    DataTableEmpty,
} from "@/components/ui/data-table"
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

    const totalValue = assets.reduce((sum, asset) => sum + asset.currentValue, 0)
    const totalPurchase = assets.reduce((sum, asset) => sum + asset.purchasePrice, 0)

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">{text.assets.title}</h2>
                    <p className="text-muted-foreground">
                        {text.assets.subtitle}
                    </p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            {text.assets.addAsset}
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

            <StatCardGrid columns={4}>
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
                <StatCard
                    label="Ackumulerade Avskrivningar"
                    value={formatCurrency(totalPurchase - totalValue)}
                    headerIcon={TrendingDown}
                />
            </StatCardGrid>

            <DataTable title="Tillgångar">
                <DataTableHeader>
                    <DataTableHeaderCell icon={Tag} label="Namn" />
                    <DataTableHeaderCell label="Kategori" />
                    <DataTableHeaderCell icon={Calendar} label="Inköpsdatum" />
                    <DataTableHeaderCell icon={Banknote} label="Anskaffningsvärde" align="right" />
                    <DataTableHeaderCell label="Bokfört värde" align="right" />
                    <DataTableHeaderCell icon={Clock} label="Livslängd" align="center" />
                    <DataTableHeaderCell width="50px" />
                </DataTableHeader>
                <DataTableBody>
                    {assets.length === 0 ? (
                        <DataTableEmpty message="Inga tillgångar registrerade" colSpan={7} />
                    ) : (
                        assets.map((asset) => (
                            <DataTableRow key={asset.id}>
                                <DataTableCell bold>{asset.name}</DataTableCell>
                                <DataTableCell muted>{asset.category}</DataTableCell>
                                <DataTableCell muted>{asset.purchaseDate}</DataTableCell>
                                <DataTableCell align="right" mono>{formatCurrency(asset.purchasePrice)}</DataTableCell>
                                <DataTableCell align="right" mono bold>{formatCurrency(asset.currentValue)}</DataTableCell>
                                <DataTableCell align="center" muted>{asset.usefulLifeYears} år</DataTableCell>
                                <DataTableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <span className="sr-only">Öppna meny</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Åtgärder</DropdownMenuLabel>
                                            <DropdownMenuItem>Redigera</DropdownMenuItem>
                                            <DropdownMenuItem>Gör avskrivning</DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem className="text-red-600">Avyttra/Sälj</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </DataTableCell>
                            </DataTableRow>
                        ))
                    )}
                </DataTableBody>
            </DataTable>
        </div>
    )
}
