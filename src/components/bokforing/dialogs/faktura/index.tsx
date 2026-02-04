"use client"

import * as React from "react"
import { FileText, Send } from "lucide-react"
import { cn } from "@/lib/utils"
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
import { INVOICE_STATUS_LABELS } from "@/lib/localization"
import { type Invoice } from "@/data/invoices"
import { useInvoiceForm } from "./use-form"
import {
    CustomerInfoSection,
    LineItemsSection,
    PaymentTermsSection,
    NotesSection,
    InvoicePreview,
} from "./form"

// Re-export types for convenience
export type { InvoiceLineItem, InvoiceFormErrors } from "./use-form"

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

    const {
        formState,
        formErrors,
        isCreating,
        setIsCreating,
        expanded,
        setExpanded,
        setCustomer,
        setEmail,
        setAddress,
        setOrgNumber,
        setReference,
        setDueDate,
        setPaymentTerms,
        setNotes,
        setCurrency,
        addLineItem,
        removeLineItem,
        updateLineItem,
        invoiceTotals,
        resetForm,
        validateForm,
    } = useInvoiceForm()

    const handleSubmit = async () => {
        if (isCreating) return
        if (!validateForm()) return

        setIsCreating(true)

        try {
            const today = new Date().toISOString().split('T')[0]
            const daysToAdd = parseInt(formState.paymentTerms) || 30
            const calculatedDueDate = formState.dueDate || new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

            const payload = {
                customer: formState.customer,
                email: formState.email,
                amount: invoiceTotals.total,
                vatAmount: invoiceTotals.vatAmount,
                issueDate: today,
                dueDate: calculatedDueDate,
                status: INVOICE_STATUS_LABELS.DRAFT,
                currency: formState.currency,
                items: formState.lineItems
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
                        <CustomerInfoSection
                            formState={formState}
                            formErrors={formErrors}
                            onCustomerChange={setCustomer}
                            onEmailChange={setEmail}
                            onOrgNumberChange={setOrgNumber}
                            onReferenceChange={setReference}
                            onAddressChange={setAddress}
                        />

                        <div className="border-t" />

                        <LineItemsSection
                            lineItems={formState.lineItems}
                            formErrors={formErrors}
                            subtotal={invoiceTotals.subtotal}
                            vatAmount={invoiceTotals.vatAmount}
                            onAddLineItem={addLineItem}
                            onRemoveLineItem={removeLineItem}
                            onUpdateLineItem={updateLineItem}
                        />

                        <div className="border-t" />

                        <PaymentTermsSection
                            paymentTerms={formState.paymentTerms}
                            dueDate={formState.dueDate}
                            currency={formState.currency}
                            onPaymentTermsChange={setPaymentTerms}
                            onDueDateChange={setDueDate}
                            onCurrencyChange={setCurrency}
                        />

                        <NotesSection
                            notes={formState.notes}
                            onNotesChange={setNotes}
                        />
                    </div>

                    {/* Right Side - Invoice Preview (only when expanded) */}
                    {expanded && (
                        <InvoicePreview
                            customer={formState.customer}
                            orgNumber={formState.orgNumber}
                            address={formState.address}
                            paymentTerms={formState.paymentTerms}
                            existingInvoiceCount={existingInvoiceCount}
                            lineItems={formState.lineItems}
                            subtotal={invoiceTotals.subtotal}
                            vatAmount={invoiceTotals.vatAmount}
                            total={invoiceTotals.total}
                        />
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
