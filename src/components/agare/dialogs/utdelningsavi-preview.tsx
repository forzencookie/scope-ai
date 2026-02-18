"use client"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    DocumentPreview,
    DocumentSection,
    DocumentSummaryRow,
} from "@/components/ai/previews/document-preview"
import { useCompany } from "@/providers/company-provider"
import { formatCurrency, formatDateLong } from "@/lib/utils"
import {
    generateDividendReceiptPDF,
    type PDFCompanyInfo,
    type DividendReceiptPDFData,
} from "@/lib/generators/pdf-generator"
import type { DividendDecision } from "../utdelning/use-dividend-logic"

interface UtdelningsaviPreviewDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    dividend: DividendDecision | null
}

export function UtdelningsaviPreviewDialog({
    open,
    onOpenChange,
    dividend,
}: UtdelningsaviPreviewDialogProps) {
    const { company } = useCompany()

    if (!dividend) return null

    const companyInfo: PDFCompanyInfo = {
        name: company?.name || 'Mitt Företag AB',
        orgNumber: company?.orgNumber || '',
        address: company?.address,
        city: company?.city,
        zipCode: company?.zipCode,
    }

    const pdfData: DividendReceiptPDFData = {
        year: dividend.year,
        amount: dividend.amount,
        taxRate: dividend.taxRate,
        tax: dividend.tax,
        netAmount: dividend.netAmount,
        meetingDate: dividend.meetingDate,
    }

    const handleDownload = () => {
        generateDividendReceiptPDF(pdfData, companyInfo)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Utdelningsavi — Förhandsvisning</DialogTitle>
                </DialogHeader>

                <DocumentPreview
                    title="UTDELNINGSAVI"
                    subtitle={`Räkenskapsår ${dividend.year}`}
                    date={new Date().toLocaleDateString('sv-SE')}
                    companyInfo={{
                        name: companyInfo.name,
                        orgNumber: companyInfo.orgNumber,
                        address: companyInfo.address
                            ? `${companyInfo.address}${companyInfo.zipCode ? `, ${companyInfo.zipCode}` : ''}${companyInfo.city ? ` ${companyInfo.city}` : ''}`
                            : undefined,
                    }}
                    actions={{
                        onDownload: handleDownload,
                        onCancel: () => onOpenChange(false),
                    }}
                    footer={
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">
                                Beslut fattat vid bolagsstämma {formatDateLong(dividend.meetingDate)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Utdelning beslutad i enlighet med ABL 18 kap.
                            </p>
                        </div>
                    }
                >
                    {/* Summary */}
                    <DocumentSection title="Sammanställning">
                        <div className="space-y-1">
                            <DocumentSummaryRow label="Räkenskapsår" value={dividend.year} />
                            <DocumentSummaryRow label="Stämmobeslut" value={formatDateLong(dividend.meetingDate)} />
                        </div>
                    </DocumentSection>

                    {/* Breakdown */}
                    <DocumentSection title="Utdelning" className="mt-6">
                        <div className="space-y-1">
                            <DocumentSummaryRow label="Bruttoutdelning" value={formatCurrency(dividend.amount)} />
                            <DocumentSummaryRow label={`Skatt (${dividend.taxRate})`} value={`-${formatCurrency(dividend.tax)}`} />
                            <DocumentSummaryRow label="Nettoutdelning" value={formatCurrency(dividend.netAmount)} highlight />
                        </div>
                    </DocumentSection>
                </DocumentPreview>
            </DialogContent>
        </Dialog>
    )
}
