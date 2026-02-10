"use client"

import * as React from "react"
import { Plus, X, AlertCircle } from "lucide-react"
import { cn, formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { type InvoiceFormState, type InvoiceFormErrors, type InvoiceLineItem } from "./use-form"

interface CustomerInfoSectionProps {
    formState: InvoiceFormState
    formErrors: InvoiceFormErrors
    onCustomerChange: (value: string) => void
    onEmailChange: (value: string) => void
    onOrgNumberChange: (value: string) => void
    onReferenceChange: (value: string) => void
    onAddressChange: (value: string) => void
}

export function CustomerInfoSection({
    formState,
    formErrors,
    onCustomerChange,
    onEmailChange,
    onOrgNumberChange,
    onReferenceChange,
    onAddressChange,
}: CustomerInfoSectionProps) {
    return (
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
                        value={formState.customer}
                        onChange={(e) => onCustomerChange(e.target.value)}
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
                        value={formState.email}
                        onChange={(e) => onEmailChange(e.target.value)}
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
                        value={formState.orgNumber}
                        onChange={(e) => onOrgNumberChange(e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Er referens</label>
                    <Input
                        placeholder="Anna Andersson"
                        value={formState.reference}
                        onChange={(e) => onReferenceChange(e.target.value)}
                    />
                </div>
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium">Adress</label>
                <Input
                    placeholder="Storgatan 1, 111 22 Stockholm"
                    value={formState.address}
                    onChange={(e) => onAddressChange(e.target.value)}
                />
            </div>
        </div>
    )
}

interface LineItemsSectionProps {
    lineItems: InvoiceLineItem[]
    formErrors: InvoiceFormErrors
    subtotal: number
    vatAmount: number
    onAddLineItem: () => void
    onRemoveLineItem: (id: string) => void
    onUpdateLineItem: (id: string, field: keyof InvoiceLineItem, value: string | number) => void
}

export function LineItemsSection({
    lineItems,
    formErrors,
    subtotal,
    vatAmount,
    onAddLineItem,
    onRemoveLineItem,
    onUpdateLineItem,
}: LineItemsSectionProps) {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Fakturarader
                </h3>
                <Button type="button" variant="outline" size="sm" onClick={onAddLineItem}>
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
                            onChange={(e) => onUpdateLineItem(item.id, 'description', e.target.value)}
                            className="h-9"
                        />
                        <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => onUpdateLineItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                            className="h-9 text-right"
                        />
                        <div className="relative">
                            <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.unitPrice || ''}
                                onChange={(e) => onUpdateLineItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                className="h-9 text-right pr-8"
                                placeholder="0"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">kr</span>
                        </div>
                        <Select
                            value={String(item.vatRate)}
                            onValueChange={(v) => onUpdateLineItem(item.id, 'vatRate', parseInt(v))}
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
                            onClick={() => onRemoveLineItem(item.id)}
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
                    <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Moms</span>
                    <span>{formatCurrency(vatAmount)}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg">
                    <span>Totalt</span>
                    <span>{formatCurrency(subtotal + vatAmount)}</span>
                </div>
            </div>
        </div>
    )
}

interface PaymentTermsSectionProps {
    issueDate: string
    paymentTerms: string
    dueDate: string
    currency: 'SEK' | 'EUR' | 'USD' | 'GBP' | 'NOK' | 'DKK'
    bankgiro: string
    plusgiro: string
    onIssueDateChange: (value: string) => void
    onPaymentTermsChange: (value: string) => void
    onDueDateChange: (value: string) => void
    onCurrencyChange: (value: 'SEK' | 'EUR' | 'USD' | 'GBP' | 'NOK' | 'DKK') => void
    onBankgiroChange: (value: string) => void
    onPlusgiroChange: (value: string) => void
}

export function PaymentTermsSection({
    issueDate,
    paymentTerms,
    dueDate,
    currency,
    bankgiro,
    plusgiro,
    onIssueDateChange,
    onPaymentTermsChange,
    onDueDateChange,
    onCurrencyChange,
    onBankgiroChange,
    onPlusgiroChange,
}: PaymentTermsSectionProps) {
    return (
        <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Betalningsvillkor
            </h3>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Fakturadatum</label>
                    <Input
                        type="date"
                        value={issueDate}
                        onChange={(e) => onIssueDateChange(e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Valuta</label>
                    <Select value={currency} onValueChange={(v) => onCurrencyChange(v as typeof currency)}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="SEK">SEK - Svenska kronor</SelectItem>
                            <SelectItem value="EUR">EUR - Euro</SelectItem>
                            <SelectItem value="USD">USD - US Dollar</SelectItem>
                            <SelectItem value="GBP">GBP - British Pound</SelectItem>
                            <SelectItem value="NOK">NOK - Norska kronor</SelectItem>
                            <SelectItem value="DKK">DKK - Danska kronor</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Betalningsvillkor</label>
                    <Select value={paymentTerms} onValueChange={onPaymentTermsChange}>
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
                        onChange={(e) => onDueDateChange(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                    />
                    <p className="text-xs text-muted-foreground">Tomt = auto</p>
                </div>
                <div />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Bankgiro</label>
                    <Input
                        placeholder="1234-5678"
                        value={bankgiro}
                        onChange={(e) => onBankgiroChange(e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Plusgiro</label>
                    <Input
                        placeholder="12 34 56-7"
                        value={plusgiro}
                        onChange={(e) => onPlusgiroChange(e.target.value)}
                    />
                </div>
            </div>
        </div>
    )
}

interface NotesSectionProps {
    notes: string
    onNotesChange: (value: string) => void
}

export function NotesSection({ notes, onNotesChange }: NotesSectionProps) {
    return (
        <div className="space-y-2">
            <label className="text-sm font-medium">Meddelande på faktura</label>
            <textarea
                placeholder="Tack för er beställning!"
                value={notes}
                onChange={(e) => onNotesChange(e.target.value)}
                rows={2}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
            />
        </div>
    )
}

interface InvoicePreviewProps {
    customer: string
    orgNumber: string
    address: string
    issueDate: string
    paymentTerms: string
    bankgiro: string
    plusgiro: string
    invoiceNumber: string
    companyName: string
    companyOrgNr: string
    companyAddress: string
    companyVatNr: string
    lineItems: InvoiceLineItem[]
    subtotal: number
    vatAmount: number
    total: number
}

export function InvoicePreview({
    customer,
    orgNumber,
    address,
    issueDate,
    paymentTerms,
    bankgiro,
    plusgiro,
    invoiceNumber,
    companyName,
    companyOrgNr,
    companyAddress,
    companyVatNr,
    lineItems,
    subtotal,
    vatAmount,
    total,
}: InvoicePreviewProps) {
    const dueDate = new Date(new Date(issueDate || Date.now()).getTime() + parseInt(paymentTerms) * 24 * 60 * 60 * 1000)

    return (
        <div className="w-full border-l pl-6">
            <div className="sticky top-0">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                    Förhandsgranska
                </h3>
                <div className="bg-white dark:bg-zinc-900 border rounded-lg shadow-sm p-6 space-y-6 max-h-[calc(90vh-220px)] overflow-y-auto">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-xl font-bold">Faktura</h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                Nr: <span className="font-mono font-semibold">{invoiceNumber}</span>
                            </p>
                        </div>
                        <div className="text-right text-sm">
                            <p>Fakturadatum: {new Date(issueDate || Date.now()).toLocaleDateString('sv-SE')}</p>
                            <p>Förfallodatum: {dueDate.toLocaleDateString('sv-SE')}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6 pt-4 border-t">
                        <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">FRÅN</p>
                            <p className="font-medium">{companyName || 'Företagsnamn'}</p>
                            {companyOrgNr && <p className="text-sm text-muted-foreground">Org.nr: {companyOrgNr}</p>}
                            {companyVatNr && <p className="text-sm text-muted-foreground">Moms.nr: {companyVatNr}</p>}
                            {companyAddress && <p className="text-sm text-muted-foreground">{companyAddress}</p>}
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
                            <span>{formatCurrency(subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span>Moms</span>
                            <span>{formatCurrency(vatAmount)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg pt-2 border-t">
                            <span>Att betala</span>
                            <span>{formatCurrency(total)}</span>
                        </div>
                    </div>
                    {(bankgiro || plusgiro) && (
                        <div className="pt-4 border-t text-sm">
                            <p className="text-xs font-medium text-muted-foreground mb-1">BETALNING</p>
                            {bankgiro && <p>Bankgiro: {bankgiro}</p>}
                            {plusgiro && <p>Plusgiro: {plusgiro}</p>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
