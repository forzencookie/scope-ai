"use client"

import { useState, useEffect } from "react"
import { Plus, Calendar, TrendingDown, AlertTriangle, Banknote, Clock, MoreHorizontal, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import type { Periodiseringsfond } from "@/lib/ai-tool-types"
import {
    listPeriodiseringsfonder,
    createPeriodiseringsfond,
    dissolvePeriodiseringsfond,
    calculateTaxSavings,
    getExpiringFonder,
} from "@/lib/periodiseringsfonder"

export function PeriodiseringsfondsTable() {
    const { text } = useTextMode()
    const [fonder, setFonder] = useState<Periodiseringsfond[]>([])
    const [expiringFonder, setExpiringFonder] = useState<Periodiseringsfond[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showCreateDialog, setShowCreateDialog] = useState(false)
    const [showDissolveDialog, setShowDissolveDialog] = useState(false)
    const [selectedFond, setSelectedFond] = useState<Periodiseringsfond | null>(null)

    // Form state
    const [newYear, setNewYear] = useState(new Date().getFullYear() - 1)
    const [newAmount, setNewAmount] = useState("")
    const [dissolveAmount, setDissolveAmount] = useState("")

    // Load data
    useEffect(() => {
        async function load() {
            setIsLoading(true)
            const [allFonder, expiring] = await Promise.all([
                listPeriodiseringsfonder(),
                getExpiringFonder(12)
            ])
            setFonder(allFonder)
            setExpiringFonder(expiring)
            setIsLoading(false)
        }
        load()
    }, [])

    // Calculate stats
    const totalActive = fonder
        .filter(f => f.status !== 'dissolved')
        .reduce((sum, f) => sum + (f.amount - f.dissolvedAmount), 0)

    const taxSavings = calculateTaxSavings(totalActive, 'AB')

    // Handlers
    const handleCreate = async () => {
        const amount = parseFloat(newAmount)
        if (isNaN(amount) || amount <= 0) return

        const created = await createPeriodiseringsfond({ year: newYear, amount })
        if (created) {
            setFonder(prev => [created, ...prev])
            setShowCreateDialog(false)
            setNewAmount("")
        }
    }

    const handleDissolve = async () => {
        if (!selectedFond) return
        const amount = dissolveAmount ? parseFloat(dissolveAmount) : undefined

        const updated = await dissolvePeriodiseringsfond(selectedFond.id, amount)
        if (updated) {
            setFonder(prev => prev.map(f => f.id === updated.id ? updated : f))
            setShowDissolveDialog(false)
            setSelectedFond(null)
            setDissolveAmount("")
        }
    }

    const getStatusBadge = (fond: Periodiseringsfond) => {
        const now = new Date()
        const expiresIn = Math.ceil((fond.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30))

        if (fond.status === 'dissolved') {
            return <Badge variant="secondary">{text.periodiseringsfonder.statusDissolved}</Badge>
        }
        if (expiresIn <= 12) {
            return <Badge variant="destructive">{text.periodiseringsfonder.statusExpiring}</Badge>
        }
        if (fond.status === 'partially_dissolved') {
            return <Badge variant="outline">{text.periodiseringsfonder.statusPartial}</Badge>
        }
        return <Badge variant="default">{text.periodiseringsfonder.statusActive}</Badge>
    }

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('sv-SE')
    }

    return (
        <div className="space-y-6">
            {/* Stats */}
            <StatCardGrid columns={4}>
                <StatCard
                    label={text.periodiseringsfonder.activeFonder}
                    value={fonder.filter(f => f.status !== 'dissolved').length}
                    headerIcon={Banknote}
                />
                <StatCard
                    label={text.periodiseringsfonder.totalReserved}
                    value={formatCurrency(totalActive)}
                    headerIcon={TrendingDown}
                />
                <StatCard
                    label={text.periodiseringsfonder.deferredTax}
                    value={formatCurrency(taxSavings.taxSaved)}
                    headerIcon={Calendar}
                />
                <StatCard
                    label={text.periodiseringsfonder.expiresWithin}
                    value={expiringFonder.length}
                    headerIcon={AlertTriangle}
                />
            </StatCardGrid>

            {/* Table */}
            <DataTable
                title={text.periodiseringsfonder.title}
                headerActions={
                    <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                        <DialogTrigger asChild>
                            <Button size="sm">
                                <Plus className="h-4 w-4 mr-2" />
                                {text.periodiseringsfonder.createFond}
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{text.periodiseringsfonder.newFondTitle}</DialogTitle>
                                <DialogDescription>
                                    {text.periodiseringsfonder.newFondDesc}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>{text.periodiseringsfonder.taxYear}</Label>
                                    <Input
                                        type="number"
                                        value={newYear}
                                        onChange={(e) => setNewYear(parseInt(e.target.value))}
                                        min={2015}
                                        max={new Date().getFullYear()}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>{text.periodiseringsfonder.amountSek}</Label>
                                    <Input
                                        type="number"
                                        value={newAmount}
                                        onChange={(e) => setNewAmount(e.target.value)}
                                        placeholder="150000"
                                    />
                                </div>
                                {newAmount && (
                                    <div className="p-3 bg-muted rounded-lg">
                                        <p className="text-sm text-muted-foreground">
                                            {text.periodiseringsfonder.taxSavingsPreview}: <strong>{formatCurrency(parseFloat(newAmount) * 0.206)}</strong>
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {text.periodiseringsfonder.mustDissolveBy} {new Date().getFullYear() + 6}-12-31
                                        </p>
                                    </div>
                                )}
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                                    {text.actions.cancel}
                                </Button>
                                <Button onClick={handleCreate}>
                                    {text.periodiseringsfonder.createFond}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                }
            >
                <DataTableHeader>
                    <DataTableHeaderCell label={text.periodiseringsfonder.taxYear} />
                    <DataTableHeaderCell label={text.periodiseringsfonder.amount} align="right" />
                    <DataTableHeaderCell label={text.periodiseringsfonder.dissolved} align="right" />
                    <DataTableHeaderCell label={text.periodiseringsfonder.remaining} align="right" />
                    <DataTableHeaderCell label={text.periodiseringsfonder.expiresAt} />
                    <DataTableHeaderCell label={text.periodiseringsfonder.status} />
                    <DataTableHeaderCell label="" align="right" />
                </DataTableHeader>
                <DataTableBody>
                    {isLoading ? (
                        <DataTableRow>
                            <DataTableCell colSpan={7}>{text.periodiseringsfonder.loading}</DataTableCell>
                        </DataTableRow>
                    ) : fonder.length === 0 ? (
                        <DataTableRow>
                            <DataTableCell colSpan={7}>
                                <div className="text-center py-8 text-muted-foreground">
                                    {text.periodiseringsfonder.noFonder}
                                </div>
                            </DataTableCell>
                        </DataTableRow>
                    ) : (
                        fonder.map((fond) => (
                            <DataTableRow key={fond.id}>
                                <DataTableCell bold>{fond.year}</DataTableCell>
                                <DataTableCell align="right">
                                    {formatCurrency(fond.amount)}
                                </DataTableCell>
                                <DataTableCell align="right">
                                    {formatCurrency(fond.dissolvedAmount)}
                                </DataTableCell>
                                <DataTableCell align="right" bold>
                                    {formatCurrency(fond.amount - fond.dissolvedAmount)}
                                </DataTableCell>
                                <DataTableCell>
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                        {formatDate(fond.expiresAt)}
                                    </div>
                                </DataTableCell>
                                <DataTableCell>{getStatusBadge(fond)}</DataTableCell>
                                <DataTableCell align="right">
                                    {fond.status !== 'dissolved' && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    onClick={() => {
                                                        setSelectedFond(fond)
                                                        setShowDissolveDialog(true)
                                                    }}
                                                >
                                                    <TrendingDown className="h-4 w-4 mr-2" />
                                                    {text.periodiseringsfonder.dissolveFond}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </DataTableCell>
                            </DataTableRow>
                        ))
                    )}
                </DataTableBody>
            </DataTable>

            {/* Dissolve Dialog */}
            <Dialog open={showDissolveDialog} onOpenChange={setShowDissolveDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{text.periodiseringsfonder.dissolveTitle}</DialogTitle>
                        <DialogDescription>
                            {text.periodiseringsfonder.dissolveDesc} {selectedFond?.year}. {text.periodiseringsfonder.dissolveDescFull}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="p-3 bg-muted rounded-lg">
                            <p className="text-sm">
                                {text.periodiseringsfonder.remainingAmount}: <strong>
                                    {selectedFond && formatCurrency(selectedFond.amount - selectedFond.dissolvedAmount)}
                                </strong>
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label>{text.periodiseringsfonder.amountToDissolve}</Label>
                            <Input
                                type="number"
                                value={dissolveAmount}
                                onChange={(e) => setDissolveAmount(e.target.value)}
                                placeholder={text.periodiseringsfonder.fullAmountPlaceholder}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDissolveDialog(false)}>
                            {text.actions.cancel}
                        </Button>
                        <Button onClick={handleDissolve} variant="destructive">
                            {text.periodiseringsfonder.confirmDissolve}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
