"use client"

/**
 * K10FormPreview - Form preview for K10 Qualified Shares
 * 
 * Shows the K10 form for owners of limited companies.
 */

import { formatCurrency } from "@/lib/utils"
import {
    FormPreview,
    FormSection,
    FormFieldRow,
    FormTotalRow,
    type FormStatus
} from "../form-preview"

// =============================================================================
// Types
// =============================================================================

export interface K10Data {
    period: string
    shareholderName: string

    // Dividend
    dividendAmount: number
    savedDividendSpace: number // Sparat utdelningsutrymme

    // Boundary Amount (Gränsbelopp)
    salaryBasedSpace?: number  // Lönebaserat utrymme
    standardSpace?: number     // Schablonbelopp
    totalBoundaryAmount: number

    // Tax Calculation
    taxedAt20Percent: number
    taxedAtWork: number        // Tjänstebeskattas
}

export interface K10FormPreviewProps {
    data: K10Data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    actions?: any // Simplified
    className?: string
}

// =============================================================================
// Component
// =============================================================================

export function K10FormPreview({
    data,
    actions,
    className,
}: K10FormPreviewProps) {
    const status: FormStatus = "complete"

    return (
        <FormPreview
            title="K10 - Kvalificerade andelar"
            authority="Skatteverket"
            formType="Bilaga K10"
            period={data.period}
            status={status}
            statusMessage="Klar för deklaration"
            exportFormat="SRU"
            actions={actions}
            className={className}
        >
            <FormSection title="Ägare och Utdelning">
                <FormFieldRow
                    label="Delägare"
                    value={data.shareholderName}
                />
                <FormFieldRow
                    code="1.1"
                    label="Erhållen utdelning"
                    value={formatCurrency(data.dividendAmount)}
                />
            </FormSection>

            <FormSection title="Gränsbelopp">
                {data.salaryBasedSpace ? (
                    <FormFieldRow
                        label="Lönebaserat utrymme"
                        value={formatCurrency(data.salaryBasedSpace)}
                    />
                ) : (
                    <FormFieldRow
                        label="Schablonbelopp"
                        value={formatCurrency(data.standardSpace || 0)}
                    />
                )}
                <FormFieldRow
                    label="Sparat utdelningsutrymme"
                    value={formatCurrency(data.savedDividendSpace)}
                />
                <FormFieldRow
                    code="1.5"
                    label="Årets gränsbelopp"
                    value={formatCurrency(data.totalBoundaryAmount)}
                    status="valid"
                    className="font-medium"
                />
            </FormSection>

            <FormSection title="Skatteuträkning">
                <FormFieldRow
                    code="1.6"
                    label="Utdelning till 20% skatt"
                    value={formatCurrency(data.taxedAt20Percent)}
                    className="text-green-600 dark:text-green-500"
                />
                {data.taxedAtWork > 0 && (
                    <FormFieldRow
                        code="1.7"
                        label="Utdelning som tjänstebeskattas"
                        value={formatCurrency(data.taxedAtWork)}
                        className="text-amber-600 dark:text-amber-500"
                    />
                )}
            </FormSection>

            <FormTotalRow
                label="Skatt på utdelning (privat)"
                value={formatCurrency(data.taxedAt20Percent * 0.2)}
                className="text-muted-foreground"
            />
        </FormPreview>
    )
}
