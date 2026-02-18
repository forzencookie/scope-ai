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
    DocumentTable,
    DocumentSummaryRow,
} from "@/components/ai/previews/document-preview"
import { useCompany } from "@/providers/company-provider"
import {
    generateShareRegisterPDF,
    type PDFCompanyInfo,
    type ShareRegisterPDFData,
} from "@/lib/generators/pdf-generator"
import type { ShareholderDisplay, AktiebokStats } from "../aktiebok/types"

interface AktiebokPreviewDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    shareholders: ShareholderDisplay[]
    stats: AktiebokStats
}

export function AktiebokPreviewDialog({
    open,
    onOpenChange,
    shareholders,
    stats,
}: AktiebokPreviewDialogProps) {
    const { company } = useCompany()

    const companyInfo: PDFCompanyInfo = {
        name: company?.name || 'Mitt Företag AB',
        orgNumber: company?.orgNumber || '',
        address: company?.address,
        city: company?.city,
        zipCode: company?.zipCode,
    }

    const pdfData: ShareRegisterPDFData = {
        shareholders: shareholders.map(sh => ({
            name: sh.name,
            personalNumber: sh.personalNumber,
            shareClass: sh.shareClass,
            shares: sh.shares,
            ownershipPercentage: sh.ownershipPercentage,
            votesPercentage: sh.votesPercentage,
            shareNumberFrom: sh.shareNumberFrom,
            shareNumberTo: sh.shareNumberTo,
            acquisitionDate: sh.acquisitionDate,
        })),
        stats: {
            totalShares: stats.totalShares,
            totalVotes: stats.totalVotes,
            shareholderCount: stats.shareholderCount,
        },
    }

    const handleDownload = () => {
        generateShareRegisterPDF(pdfData, companyInfo)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Aktiebok — Förhandsvisning</DialogTitle>
                </DialogHeader>

                <DocumentPreview
                    title="AKTIEBOK"
                    subtitle={`Upprättad i enlighet med ABL 5 kap. 2 §`}
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
                        <p className="text-xs text-muted-foreground">
                            Utdrag ur aktiebok, {new Date().toLocaleDateString('sv-SE')}
                        </p>
                    }
                >
                    {/* Capital Summary */}
                    <DocumentSection title="Sammanfattning">
                        <div className="space-y-1">
                            <DocumentSummaryRow label="Totalt antal aktier" value={stats.totalShares.toLocaleString('sv-SE')} />
                            <DocumentSummaryRow label="Totalt antal röster" value={stats.totalVotes.toLocaleString('sv-SE')} />
                            <DocumentSummaryRow label="Antal aktieägare" value={stats.shareholderCount} />
                        </div>
                    </DocumentSection>

                    {/* Shareholders Table */}
                    <DocumentSection title="Aktieägare" className="mt-6">
                        <DocumentTable
                            headers={['Aktienr', 'Namn', 'Person/Org.nr', 'Slag', 'Antal', 'Andel', 'Röster']}
                            rows={shareholders.map(sh => [
                                sh.shareNumberFrom && sh.shareNumberTo
                                    ? `${sh.shareNumberFrom}–${sh.shareNumberTo}`
                                    : '—',
                                sh.name,
                                sh.personalNumber || '—',
                                sh.shareClass,
                                sh.shares.toLocaleString('sv-SE'),
                                `${sh.ownershipPercentage}%`,
                                `${sh.votesPercentage}%`,
                            ])}
                        />
                    </DocumentSection>
                </DocumentPreview>
            </DialogContent>
        </Dialog>
    )
}
