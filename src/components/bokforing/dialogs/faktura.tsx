"use client"

import * as React from "react"
import { useState, useMemo } from "react"
import {
    FileText,
    Plus,
    X,
    Send,
    AlertCircle,
} from "lucide-react"
import { cn, formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { INVOICE_STATUS_LABELS } from "@/lib/localization"
import { type Invoice } from "@/data/invoices"

// Types for invoice creation
export interface InvoiceLineItem {
    id: string
    description: string
    quantity: number
    unitPrice: number
    vatRate: number
}

export interface InvoiceFormErrors {
    customer?: string
    email?: string
    amount?: string
    dueDate?: string
    items?: string
}

interface InvoiceCreateDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onInvoiceCreated: (invoice: Invoice) => void
    existingInvoiceCount: number
}

export function InvoiceCreateDialog({
    open,
    onOpenChange,
    onInvoiceCreated,
    existingInvoiceCount,
}: InvoiceCreateDialogProps) {
    const toast = useToast()
    const [expanded, setExpanded] = useState(false)
    const [isCreating, setIsCreating] = useState(false)
    const [formErrors, setFormErrors] = useState<InvoiceFormErrors>({})

    // Form state
    const [customer, setCustomer] = useState("")
    const [email, setEmail] = useState("")
    const [address, setAddress] = useState("")
    const [orgNumber, setOrgNumber] = useState("")
    const [reference, setReference] = useState("")
    const [dueDate, setDueDate] = useState("")
    const [paymentTerms, setPaymentTerms] = useState("30")
    const [notes, setNotes] = useState("")

    // Line items
    const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([
        { id: '1', description: '', quantity: 1, unitPrice: 0, vatRate: 25 }
    ])

    const addLineItem = () => {
        setLineItems(prev => [...prev, {
            id: String(Date.now()),
            description: '',
            quantity: 1,
            unitPrice: 0,
            vatRate: 25
        }])
    }

    const removeLineItem = (id: string) => {
        if (lineItems.length > 1) {
            setLineItems(prev => prev.filter(item => item.id !== id))
        }
    }

    const updateLineItem = (id: string, field: keyof InvoiceLineItem, value: string | number) => {
        setLineItems(prev => prev.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        ))
    }

    // Calculate totals
    const invoiceTotals = useMemo(() => {
        const subtotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
        const vatAmount = lineItems.reduce((sum, item) => {
            const lineTotal = item.quantity * item.unitPrice
            return sum + (lineTotal * item.vatRate / 100)
        }, 0)
        return {
            subtotal,
            vatAmount,
            total: subtotal + vatAmount
        }
    }, [lineItems])

    const resetForm = () => {
        setCustomer("")
        setEmail("")
        setAddress("")
        setOrgNumber("")
        setReference("")
        setDueDate("")
        setPaymentTerms("30")
        setNotes("")
        setLineItems([{ id: '1', description: '', quantity: 1, unitPrice: 0, vatRate: 25 }])
        setFormErrors({})
        setExpanded(false)
        setIsCreating(false)
    }

    const handleSubmit = async () => {
        // Validate form
        const errors: InvoiceFormErrors = {}

        if (!customer.trim()) {
            errors.customer = "Kundnamn krävs"
        } else if (customer.trim().length < 2) {
            errors.customer = "Kundnamn måste vara minst 2 tecken"
        }

        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.email = "Ogiltig e-postadress"
        }

        const validItems = lineItems.filter(item => item.description.trim() && item.unitPrice > 0)
        if (validItems.length === 0) {
            errors.items = "Lägg till minst en fakturarad med beskrivning och pris"
        }

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors)
            return
        }

        setIsCreating(true)

        try {
            const today = new Date().toISOString().split('T')[0]
            const daysToAdd = parseInt(paymentTerms) || 30
            const calculatedDueDate = dueDate || new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

            const payload = {
                customer,
                email,
                amount: invoiceTotals.total,
                vatAmount: invoiceTotals.vatAmount,
                issueDate: today,
                dueDate: calculatedDueDate,
                status: INVOICE_STATUS_LABELS.DRAFT,
                items: lineItems
            }

            const response = await fetch('/api/invoices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (!response.ok) throw new Error('Failed to create')

            const json = await response.json()
            const newInvoice = json.invoice

            toast.success("Faktura skapad!", `Faktura ${newInvoice.id} till ${newInvoice.customer} har skapats`)

            onInvoiceCreated(newInvoice)
            onOpenChange(false)
            resetForm()
        } catch (error) {
            console.error(error)
            toast.error("Kunde inte skapa faktura", "Ett fel uppstod vid sparande.")
            setIsCreating(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={(newOpen) => {
            onOpenChange(newOpen)
            if (!newOpen) {
                resetForm()
            }
        }}>
            <DialogContent
                className={cn(
                    "max-h-[90vh]",
                    expanded ? "max-w-[95vw]" : "max-w-3xl"
                )}
                expandable
                onExpandedChange={setExpanded}
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Skapa faktura
                    </DialogTitle>
                </DialogHeader>

                <div className={cn(
                    "flex gap-6",
                    expanded ? "flex-row" : "flex-col"
                )}>
                    {/* Left Side - Form */}
                    <div className={cn(
                        "space-y-6 py-4 overflow-y-auto px-1 -mx-1",
                        expanded ? "w-1/2 max-h-[calc(90vh-180px)] pr-4" : "w-full max-h-[calc(90vh-180px)]"
                    )}>
                        {/* Customer Information Section */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                Kundinformation
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">
                                        Kundnamn / Företag <span className="text-destructive">*</span>
                                    </label>
                                    <Input
                                        placeholder="Företag AB"
                                        value={customer}
                                        onChange={(e) => {
                                            setCustomer(e.target.value)
                                            if (formErrors.customer) {
                                                setFormErrors(prev => ({ ...prev, customer: undefined }))
                                            }
                                        }}
                                        aria-invalid={!!formErrors.customer}
                                        className={formErrors.customer ? "border-destructive" : ""}
                                    />
                                    {formErrors.customer && (
                                        <p className="text-sm text-destructive flex items-center gap-1">
                                            <AlertCircle className="h-3.5 w-3.5" />
                                            {formErrors.customer}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">E-post</label>
                                    <Input
                                        type="email"
                                        placeholder="faktura@foretag.se"
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value)
                                            if (formErrors.email) {
                                                setFormErrors(prev => ({ ...prev, email: undefined }))
                                            }
                                        }}
                                        className={formErrors.email ? "border-destructive" : ""}
                                    />
                                    {formErrors.email && (
                                        <p className="text-sm text-destructive flex items-center gap-1">
                                            <AlertCircle className="h-3.5 w-3.5" />
                                            {formErrors.email}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Org.nummer</label>
                                    <Input
                                        placeholder="556123-4567"
                                        value={orgNumber}
                                        onChange={(e) => setOrgNumber(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Er referens</label>
                                    <Input
                                        placeholder="Anna Andersson"
                                        value={reference}
                                        onChange={(e) => setReference(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Adress</label>
                                <Input
                                    placeholder="Storgatan 1, 111 22 Stockholm"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="border-t" />

                        {/* Invoice Lines Section */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                    Fakturarader
                                </h3>
                                <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                                    <Plus className="h-4 w-4 mr-1" />
                                    Lägg till rad
                                </Button>
                            </div>

                            {formErrors.items && (
                                <p className="text-sm text-destructive flex items-center gap-1">
                                    <AlertCircle className="h-3.5 w-3.5" />
                                    {formErrors.items}
                                </p>
                            )}

                            <div className="grid grid-cols-[1fr,80px,100px,80px,32px] gap-2 text-xs font-medium text-muted-foreground px-1">
                                <span>Beskrivning</span>
                                <span className="text-right">Antal</span>
                                <span className="text-right">À-pris</span>
                                <span className="text-right">Moms</span>
                                <span></span>
                            </div>

                            <div className="space-y-2">
                                {lineItems.map((item) => (
                                    <div key={item.id} className="grid grid-cols-[1fr,80px,100px,80px,32px] gap-2 items-center">
                                        <Input
                                            placeholder="Konsulttjänster..."
                                            value={item.description}
                                            onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                                            className="h-9"
                                        />
                                        <Input
                                            type="number"
                                            min="1"
                                            value={item.quantity}
                                            onChange={(e) => updateLineItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                                            className="h-9 text-right"
                                        />
                                        <div className="relative">
                                            <Input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={item.unitPrice || ''}
                                                onChange={(e) => updateLineItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                                className="h-9 text-right pr-8"
                                                placeholder="0"
                                            />
                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">kr</span>
                                        </div>
                                        <Select
                                            value={String(item.vatRate)}
                                            onValueChange={(v) => updateLineItem(item.id, 'vatRate', parseInt(v))}
                                        >
                                            <SelectTrigger className="h-9">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="25">25%</SelectItem>
                                                <SelectItem value="12">12%</SelectItem>
                                                <SelectItem value="6">6%</SelectItem>
                                                <SelectItem value="0">0%</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeLineItem(item.id)}
                                            disabled={lineItems.length <= 1}
                                            className="h-9 w-9 text-muted-foreground hover:text-destructive"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t pt-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Netto</span>
                                    <span>{formatCurrency(invoiceTotals.subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Moms</span>
                                    <span>{formatCurrency(invoiceTotals.vatAmount)}</span>
                                </div>
                                <div className="flex justify-between font-semibold text-lg">
                                    <span>Totalt</span>
                                    <span>{formatCurrency(invoiceTotals.total)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="border-t" />

                        {/* Payment Terms Section */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                Betalningsvillkor
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Betalningsvillkor</label>
                                    <Select value={paymentTerms} onValueChange={setPaymentTerms}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="10">10 dagar</SelectItem>
                                            <SelectItem value="15">15 dagar</SelectItem>
                                            <SelectItem value="30">30 dagar</SelectItem>
                                            <SelectItem value="45">45 dagar</SelectItem>
                                            <SelectItem value="60">60 dagar</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Förfallodatum</label>
                                    <Input
                                        type="date"
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                    <p className="text-xs text-muted-foreground">Lämna tomt för automatisk beräkning</p>
                                </div>
                            </div>
                        </div>

                        {/* Notes Section */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Meddelande på faktura</label>
                            <textarea
                                placeholder="Tack för er beställning!"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={2}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                            />
                        </div>
                    </div>

                    {/* Right Side - Invoice Preview (only when expanded) */}
                    {expanded && (
                        <div className="w-1/2 border-l pl-6">
                            <div className="sticky top-0">
                                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                                    Förhandsgranska
                                </h3>
                                <div className="bg-white dark:bg-zinc-900 border rounded-lg shadow-sm p-6 space-y-6 max-h-[calc(90vh-220px)] overflow-y-auto">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h2 className="text-xl font-bold">Faktura</h2>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                Fakturanummer: <span className="font-mono">UTKAST-{String(existingInvoiceCount + 1).padStart(3, '0')}</span>
                                            </p>
                                        </div>
                                        <div className="text-right text-sm">
                                            <p>Fakturadatum: {new Date().toLocaleDateString('sv-SE')}</p>
                                            <p>Förfallodatum: {new Date(Date.now() + parseInt(paymentTerms) * 24 * 60 * 60 * 1000).toLocaleDateString('sv-SE')}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6 pt-4 border-t">
                                        <div>
                                            <p className="text-xs font-medium text-muted-foreground mb-1">FRÅN</p>
                                            <p className="font-medium">Ditt Företag AB</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-muted-foreground mb-1">TILL</p>
                                            <p className="font-medium">{customer || 'Kundnamn'}</p>
                                            {orgNumber && <p className="text-sm text-muted-foreground">Org.nr: {orgNumber}</p>}
                                            {address && <p className="text-sm text-muted-foreground">{address}</p>}
                                        </div>
                                    </div>
                                    <div className="pt-4 border-t">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b">
                                                    <th className="text-left py-2 font-medium">Beskrivning</th>
                                                    <th className="text-right py-2 font-medium w-16">Antal</th>
                                                    <th className="text-right py-2 font-medium w-24">À-pris</th>
                                                    <th className="text-right py-2 font-medium w-24">Belopp</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {lineItems.filter(item => item.description || item.unitPrice > 0).map((item) => (
                                                    <tr key={item.id} className="border-b border-dashed">
                                                        <td className="py-2">{item.description || '—'}</td>
                                                        <td className="text-right py-2">{item.quantity}</td>
                                                        <td className="text-right py-2">{formatCurrency(item.unitPrice)}</td>
                                                        <td className="text-right py-2">{formatCurrency(item.quantity * item.unitPrice)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="pt-4 border-t space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span>Netto</span>
                                            <span>{formatCurrency(invoiceTotals.subtotal)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span>Moms</span>
                                            <span>{formatCurrency(invoiceTotals.vatAmount)}</span>
                                        </div>
                                        <div className="flex justify-between font-bold text-lg pt-2 border-t">
                                            <span>Att betala</span>
                                            <span>{formatCurrency(invoiceTotals.total)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2">
                    <DialogClose asChild>
                        <Button variant="outline" disabled={isCreating}>Avbryt</Button>
                    </DialogClose>
                    <Button variant="outline" onClick={handleSubmit} disabled={isCreating}>
                        Spara utkast
                    </Button>
                    <Button onClick={handleSubmit} disabled={isCreating}>
                        <Send className="h-4 w-4 mr-2" />
                        {isCreating ? "Skapar..." : "Skapa & skicka"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
