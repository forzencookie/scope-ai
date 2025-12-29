"use client"

import { useState, useEffect } from "react"
import { Plus, Building, Briefcase, Bitcoin, TrendingUp, TrendingDown, MoreHorizontal, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatCurrency } from "@/lib/utils"
import { StatCard, StatCardGrid } from "@/components/ui/stat-card"
import { DataTable, DataTableHeader, DataTableHeaderCell, DataTableBody, DataTableRow, DataTableCell } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { useTextMode } from "@/providers/text-mode-provider"
import type { Property, ShareHolding, CryptoHolding } from "@/lib/ai-tool-types"
import {
    listProperties,
    createProperty,
    deleteProperty,
    calculatePropertyBookValue,
    listShareHoldings,
    createShareHolding,
    deleteShareHolding,
    calculateUnrealizedGain,
    listCryptoHoldings,
    deleteCryptoHolding,
    getInvestmentSummary,
    type InvestmentSummary,
} from "@/lib/investments"

type InvestmentTab = 'properties' | 'shares' | 'crypto'

export function InvestmentsTable() {
    const { text } = useTextMode()
    const [activeTab, setActiveTab] = useState<InvestmentTab>('properties')
    const [properties, setProperties] = useState<Property[]>([])
    const [shares, setShares] = useState<ShareHolding[]>([])
    const [crypto, setCrypto] = useState<CryptoHolding[]>([])
    const [summary, setSummary] = useState<InvestmentSummary | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    // Dialog states
    const [showAddDialog, setShowAddDialog] = useState(false)
    const [formData, setFormData] = useState<Record<string, any>>({})

    // Load data
    useEffect(() => {
        async function load() {
            setIsLoading(true)
            const [props, shares, cryptos, sum] = await Promise.all([
                listProperties(),
                listShareHoldings(),
                listCryptoHoldings(),
                getInvestmentSummary(),
            ])
            setProperties(props)
            setShares(shares)
            setCrypto(cryptos)
            setSummary(sum)
            setIsLoading(false)
        }
        load()
    }, [])

    // Handlers
    const handleAdd = async () => {
        if (activeTab === 'properties') {
            const created = await createProperty({
                name: formData.name,
                propertyType: formData.propertyType,
                address: formData.address,
                purchaseDate: formData.purchaseDate ? new Date(formData.purchaseDate) : undefined,
                purchasePrice: parseFloat(formData.purchasePrice) || undefined,
                landValue: parseFloat(formData.landValue) || undefined,
                buildingValue: parseFloat(formData.buildingValue) || undefined,
                depreciationRate: parseFloat(formData.depreciationRate) || 2,
            })
            if (created) setProperties(prev => [created, ...prev])
        } else if (activeTab === 'shares') {
            const created = await createShareHolding({
                companyName: formData.companyName,
                orgNumber: formData.orgNumber,
                holdingType: formData.holdingType,
                sharesCount: parseInt(formData.sharesCount) || undefined,
                purchaseDate: formData.purchaseDate ? new Date(formData.purchaseDate) : undefined,
                purchasePrice: parseFloat(formData.purchasePrice) || undefined,
            })
            if (created) setShares(prev => [created, ...prev])
        }
        // Crypto would need transaction-based creation

        setShowAddDialog(false)
        setFormData({})

        // Refresh summary
        const newSummary = await getInvestmentSummary()
        setSummary(newSummary)
    }

    const handleDelete = async (type: InvestmentTab, id: string) => {
        if (type === 'properties') {
            await deleteProperty(id)
            setProperties(prev => prev.filter(p => p.id !== id))
        } else if (type === 'shares') {
            await deleteShareHolding(id)
            setShares(prev => prev.filter(s => s.id !== id))
        } else if (type === 'crypto') {
            await deleteCryptoHolding(id)
            setCrypto(prev => prev.filter(c => c.id !== id))
        }
        const newSummary = await getInvestmentSummary()
        setSummary(newSummary)
    }

    const formatDate = (date?: Date) => date?.toLocaleDateString('sv-SE') || '—'

    return (
        <div className="space-y-6">
            {/* Summary Stats */}
            <StatCardGrid columns={4}>
                <StatCard
                    label={text.investments.properties}
                    value={formatCurrency(summary?.properties.totalValue || 0)}
                    headerIcon={Building}
                />
                <StatCard
                    label={text.investments.shares}
                    value={formatCurrency(summary?.shares.totalValue || 0)}
                    headerIcon={Briefcase}
                />
                <StatCard
                    label={text.investments.crypto}
                    value={formatCurrency(summary?.crypto.totalValue || 0)}
                    headerIcon={Bitcoin}
                />
                <StatCard
                    label={text.investments.totalPortfolio}
                    value={formatCurrency(summary?.totalValue || 0)}
                    headerIcon={TrendingUp}
                />
            </StatCardGrid>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as InvestmentTab)}>
                <div className="flex items-center justify-between">
                    <TabsList>
                        <TabsTrigger value="properties">
                            <Building className="h-4 w-4 mr-2" />
                            {text.investments.properties} ({properties.length})
                        </TabsTrigger>
                        <TabsTrigger value="shares">
                            <Briefcase className="h-4 w-4 mr-2" />
                            {text.investments.shares} ({shares.length})
                        </TabsTrigger>
                        <TabsTrigger value="crypto">
                            <Bitcoin className="h-4 w-4 mr-2" />
                            {text.investments.crypto} ({crypto.length})
                        </TabsTrigger>
                    </TabsList>

                    {activeTab !== 'crypto' && (
                        <Button size="sm" onClick={() => setShowAddDialog(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            {text.investments.add}
                        </Button>
                    )}
                </div>

                <TabsContent value="properties" className="mt-4">
                    <DataTable title={text.investments.properties}>
                        <DataTableHeader>
                            <DataTableHeaderCell label={text.investments.name} />
                            <DataTableHeaderCell label={text.investments.type} />
                            <DataTableHeaderCell label={text.investments.purchasePrice} align="right" />
                            <DataTableHeaderCell label={text.investments.bookValue} align="right" />
                            <DataTableHeaderCell label={text.investments.depreciation} />
                            <DataTableHeaderCell label="" align="right" />
                        </DataTableHeader>
                        <DataTableBody>
                            {isLoading ? (
                                <DataTableRow><DataTableCell colSpan={6}>{text.investments.loading}</DataTableCell></DataTableRow>
                            ) : properties.length === 0 ? (
                                <DataTableRow>
                                    <DataTableCell colSpan={6}>
                                        <div className="text-center py-8 text-muted-foreground">
                                            {text.investments.noProperties}
                                        </div>
                                    </DataTableCell>
                                </DataTableRow>
                            ) : properties.map((p) => (
                                <DataTableRow key={p.id}>
                                    <DataTableCell bold>
                                        <div className="flex items-center gap-2">
                                            <Building className="h-4 w-4 text-muted-foreground" />
                                            {p.name}
                                        </div>
                                    </DataTableCell>
                                    <DataTableCell>
                                        <Badge variant="outline">{p.propertyType || 'Byggnad'}</Badge>
                                    </DataTableCell>
                                    <DataTableCell align="right">
                                        {formatCurrency(p.purchasePrice || 0)}
                                    </DataTableCell>
                                    <DataTableCell align="right" bold>
                                        {formatCurrency(calculatePropertyBookValue(p))}
                                    </DataTableCell>
                                    <DataTableCell>{p.depreciationRate}%/år</DataTableCell>
                                    <DataTableCell align="right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleDelete('properties', p.id)}>
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    {text.investments.remove}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </DataTableCell>
                                </DataTableRow>
                            ))}
                        </DataTableBody>
                    </DataTable>
                </TabsContent>

                <TabsContent value="shares" className="mt-4">
                    <DataTable title={text.investments.shares}>
                        <DataTableHeader>
                            <DataTableHeaderCell label={text.investments.company} />
                            <DataTableHeaderCell label={text.investments.sharesCount} align="right" />
                            <DataTableHeaderCell label={text.investments.purchasePrice} align="right" />
                            <DataTableHeaderCell label={text.investments.currentValue} align="right" />
                            <DataTableHeaderCell label={text.investments.gainLoss} align="right" />
                            <DataTableHeaderCell label="" align="right" />
                        </DataTableHeader>
                        <DataTableBody>
                            {isLoading ? (
                                <DataTableRow><DataTableCell colSpan={6}>{text.investments.loading}</DataTableCell></DataTableRow>
                            ) : shares.length === 0 ? (
                                <DataTableRow>
                                    <DataTableCell colSpan={6}>
                                        <div className="text-center py-8 text-muted-foreground">
                                            {text.investments.noShares}
                                        </div>
                                    </DataTableCell>
                                </DataTableRow>
                            ) : shares.map((s) => {
                                const gain = calculateUnrealizedGain(s)
                                return (
                                    <DataTableRow key={s.id}>
                                        <DataTableCell bold>
                                            <div className="flex items-center gap-2">
                                                <Briefcase className="h-4 w-4 text-muted-foreground" />
                                                <div>
                                                    <p>{s.companyName}</p>
                                                    {s.orgNumber && (
                                                        <p className="text-xs text-muted-foreground">{s.orgNumber}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </DataTableCell>
                                        <DataTableCell align="right">{s.sharesCount || '—'}</DataTableCell>
                                        <DataTableCell align="right">
                                            {formatCurrency(s.purchasePrice || 0)}
                                        </DataTableCell>
                                        <DataTableCell align="right" bold>
                                            {formatCurrency(s.currentValue || 0)}
                                        </DataTableCell>
                                        <DataTableCell align="right">
                                            <span className={gain >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                {gain >= 0 ? <TrendingUp className="h-4 w-4 inline mr-1" /> : <TrendingDown className="h-4 w-4 inline mr-1" />}
                                                {formatCurrency(Math.abs(gain))}
                                            </span>
                                        </DataTableCell>
                                        <DataTableCell align="right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleDelete('shares', s.id)}>
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        {text.investments.remove}
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </DataTableCell>
                                    </DataTableRow>
                                )
                            })}
                        </DataTableBody>
                    </DataTable>
                </TabsContent>

                <TabsContent value="crypto" className="mt-4">
                    <DataTable title={text.investments.crypto}>
                        <DataTableHeader>
                            <DataTableHeaderCell label={text.investments.currency} />
                            <DataTableHeaderCell label={text.investments.amount} align="right" />
                            <DataTableHeaderCell label={text.investments.purchasePrice} align="right" />
                            <DataTableHeaderCell label={text.investments.currentValue} align="right" />
                            <DataTableHeaderCell label="" align="right" />
                        </DataTableHeader>
                        <DataTableBody>
                            {isLoading ? (
                                <DataTableRow><DataTableCell colSpan={5}>{text.investments.loading}</DataTableCell></DataTableRow>
                            ) : crypto.length === 0 ? (
                                <DataTableRow>
                                    <DataTableCell colSpan={5}>
                                        <div className="text-center py-8 text-muted-foreground">
                                            {text.investments.noCrypto}
                                        </div>
                                    </DataTableCell>
                                </DataTableRow>
                            ) : crypto.map((c) => (
                                <DataTableRow key={c.id}>
                                    <DataTableCell bold>
                                        <div className="flex items-center gap-2">
                                            <Bitcoin className="h-4 w-4 text-orange-500" />
                                            {c.coin}
                                        </div>
                                    </DataTableCell>
                                    <DataTableCell align="right">{c.amount.toFixed(8)}</DataTableCell>
                                    <DataTableCell align="right">
                                        {formatCurrency(c.purchasePriceSek || 0)}
                                    </DataTableCell>
                                    <DataTableCell align="right" bold>
                                        {formatCurrency(c.currentPriceSek || 0)}
                                    </DataTableCell>
                                    <DataTableCell align="right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleDelete('crypto', c.id)}>
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    {text.investments.remove}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </DataTableCell>
                                </DataTableRow>
                            ))}
                        </DataTableBody>
                    </DataTable>
                </TabsContent>
            </Tabs>

            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {activeTab === 'properties' ? text.investments.addPropertyTitle : text.investments.addSharesTitle}
                        </DialogTitle>
                        <DialogDescription>
                            {activeTab === 'properties'
                                ? text.investments.addPropertyDesc
                                : text.investments.addSharesDesc
                            }
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {activeTab === 'properties' ? (
                            <>
                                <div className="space-y-2">
                                    <Label>{text.investments.name}</Label>
                                    <Input
                                        value={formData.name || ''}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="Kontorsfastighet Storgatan 1"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>{text.investments.type}</Label>
                                    <Select
                                        value={formData.propertyType || 'building'}
                                        onValueChange={(v) => setFormData(prev => ({ ...prev, propertyType: v }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="building">{text.investments.building}</SelectItem>
                                            <SelectItem value="land">{text.investments.land}</SelectItem>
                                            <SelectItem value="investment_property">{text.investments.investmentProperty}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>{text.investments.buildingValue}</Label>
                                        <Input
                                            type="number"
                                            value={formData.buildingValue || ''}
                                            onChange={(e) => setFormData(prev => ({ ...prev, buildingValue: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{text.investments.landValue}</Label>
                                        <Input
                                            type="number"
                                            value={formData.landValue || ''}
                                            onChange={(e) => setFormData(prev => ({ ...prev, landValue: e.target.value }))}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>{text.investments.depreciationRate}</Label>
                                    <Input
                                        type="number"
                                        value={formData.depreciationRate || '2'}
                                        onChange={(e) => setFormData(prev => ({ ...prev, depreciationRate: e.target.value }))}
                                    />
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="space-y-2">
                                    <Label>{text.investments.companyName}</Label>
                                    <Input
                                        value={formData.companyName || ''}
                                        onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                                        placeholder="TechStartup AB"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>{text.investments.orgNumber}</Label>
                                    <Input
                                        value={formData.orgNumber || ''}
                                        onChange={(e) => setFormData(prev => ({ ...prev, orgNumber: e.target.value }))}
                                        placeholder="559123-4567"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>{text.investments.sharesCountLabel}</Label>
                                        <Input
                                            type="number"
                                            value={formData.sharesCount || ''}
                                            onChange={(e) => setFormData(prev => ({ ...prev, sharesCount: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{text.investments.purchasePriceLabel}</Label>
                                        <Input
                                            type="number"
                                            value={formData.purchasePrice || ''}
                                            onChange={(e) => setFormData(prev => ({ ...prev, purchasePrice: e.target.value }))}
                                        />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                            {text.investments.cancel}
                        </Button>
                        <Button onClick={handleAdd}>
                            {text.investments.add}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    )
}
