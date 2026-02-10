"use client"

import * as React from "react"
import { FileText, Send } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { useCompany } from "@/providers"
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
    const { company } = useCompany()

    const invoiceNumber = `F-${String(existingInvoiceCount + 1).padStart(4, '0')}`
    const companyName = company?.name || ""
    const companyOrgNr = company?.orgNumber || ""
    const companyAddress = [company?.address, company?.zipCode, company?.city].filter(Boolean).join(", ")
    const companyVatNr = company?.vatNumber || ""

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
        setIssueDate,
        setDueDate,
        setPaymentTerms,
        setBankgiro,
        setPlusgiro,
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
            const daysToAdd = parseInt(formState.paymentTerms) || 30
            const issueDateStr = formState.issueDate || new Date().toISOString().split('T')[0]
            const calculatedDueDate = formState.dueDate || new Date(new Date(issueDateStr).getTime() + daysToAdd * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

            const payload = {
                invoiceNumber,
                customer: formState.customer,
                email: formState.email,
                orgNumber: formState.orgNumber,
                address: formState.address,
                reference: formState.reference,
                amount: invoiceTotals.total,
                vatAmount: invoiceTotals.vatAmount,
                issueDate: issueDateStr,
                dueDate: calculatedDueDate,
                status: INVOICE_STATUS_LABELS.DRAFT,
                currency: formState.currency,
                bankgiro: formState.bankgiro || undefined,
                plusgiro: formState.plusgiro || undefined,
                notes: formState.notes || undefined,
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
                            issueDate={formState.issueDate}
                            paymentTerms={formState.paymentTerms}
                            dueDate={formState.dueDate}
                            currency={formState.currency}
                            bankgiro={formState.bankgiro}
                            plusgiro={formState.plusgiro}
                            onIssueDateChange={setIssueDate}
                            onPaymentTermsChange={setPaymentTerms}
                            onDueDateChange={setDueDate}
                            onCurrencyChange={setCurrency}
                            onBankgiroChange={setBankgiro}
                            onPlusgiroChange={setPlusgiro}
                        />

                        <NotesSection
                            notes={formState.notes}
                            onNotesChange={setNotes}
                        />

                        {/* Inline Preview (standard view) */}
                        {!expanded && (
                            <>
                                <div className="border-t" />
                                <InvoicePreview
                                    customer={formState.customer}
                                    orgNumber={formState.orgNumber}
                                    address={formState.address}
                                    issueDate={formState.issueDate}
                                    paymentTerms={formState.paymentTerms}
                                    bankgiro={formState.bankgiro}
                                    plusgiro={formState.plusgiro}
                                    invoiceNumber={invoiceNumber}
                                    companyName={companyName}
                                    companyOrgNr={companyOrgNr}
                                    companyAddress={companyAddress}
                                    companyVatNr={companyVatNr}
                                    lineItems={formState.lineItems}
                                    subtotal={invoiceTotals.subtotal}
                                    vatAmount={invoiceTotals.vatAmount}
                                    total={invoiceTotals.total}
                                />
                            </>
                        )}
                    </div>

                    {/* Right Side - Invoice Preview (expanded view) */}
                    {expanded && (
                        <InvoicePreview
                            customer={formState.customer}
                            orgNumber={formState.orgNumber}
                            address={formState.address}
                            issueDate={formState.issueDate}
                            paymentTerms={formState.paymentTerms}
                            bankgiro={formState.bankgiro}
                            plusgiro={formState.plusgiro}
                            invoiceNumber={invoiceNumber}
                            companyName={companyName}
                            companyOrgNr={companyOrgNr}
                            companyAddress={companyAddress}
                            companyVatNr={companyVatNr}
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
