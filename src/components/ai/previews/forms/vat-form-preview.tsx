"use client"

/**
 * VATFormPreview - Form preview for AI-generated VAT declarations
 * 
 * Shows a Skatteverket-style momsredovisning with validation
 * and XML export capability.
 */

import { cn, formatCurrency } from "@/lib/utils"
import {
    FormPreview,
    FormSection,
    FormFieldRow,
    FormTotalRow,
    type FormStatus,
    type FormFieldValidation
} from "../form-preview"

// =============================================================================
// Types
// =============================================================================

export interface VATDeclarationData {
    /** Reporting period */
    period: string
    /** Deadline for submission */
    deadline?: string

    // Output VAT (Utgående moms)
    /** Sales at 25% VAT */
    sales25?: number
    /** VAT on 25% sales */
    vat25?: number
    /** Sales at 12% VAT */
    sales12?: number
    /** VAT on 12% sales */
    vat12?: number
    /** Sales at 6% VAT */
    sales6?: number
    /** VAT on 6% sales */
    vat6?: number
    /** Export sales (0%) */
    salesExport?: number

    // Input VAT (Ingående moms)
    /** Purchases domestic */
    purchasesDomestic?: number
    /** VAT on domestic purchases */
    vatDomestic?: number
    /** Purchases EU */
    purchasesEU?: number
    /** VAT on EU purchases */
    vatEU?: number
    /** Import purchases */
    purchasesImport?: number
    /** VAT on imports */
    vatImport?: number

    // Totals
    /** Total output VAT */
    totalOutputVAT?: number
    /** Total input VAT */
    totalInputVAT?: number
    /** Net VAT (to pay or reclaim) */
    netVAT?: number
}

export interface VATFormPreviewProps {
    data: VATDeclarationData
    /** Actions */
    actions?: {
        onConfirm?: () => void
        onCancel?: () => void
        onEdit?: () => void
        onExport?: () => void
        onSubmit?: () => void
        isLoading?: boolean
    }
    className?: string
}

// =============================================================================
// Component
// =============================================================================

export function VATFormPreview({
    data,
    actions,
    className,
}: VATFormPreviewProps) {
    // Calculate totals if not provided
    const outputVAT = data.totalOutputVAT ?? (
        (data.vat25 ?? 0) + (data.vat12 ?? 0) + (data.vat6 ?? 0)
    )
    const inputVAT = data.totalInputVAT ?? (
        (data.vatDomestic ?? 0) + (data.vatEU ?? 0) + (data.vatImport ?? 0)
    )
    const netVAT = data.netVAT ?? (outputVAT - inputVAT)

    // Determine form status
    const hasRequiredFields = (data.sales25 !== undefined || data.sales12 !== undefined || data.sales6 !== undefined)
    const status: FormStatus = hasRequiredFields ? "complete" : "incomplete"

    // Build validations
    const validations: FormFieldValidation[] = []
    if (!hasRequiredFields) {
        validations.push({
            field: "Försäljning",
            status: "empty",
            message: "Ange minst ett försäljningsbelopp"
        })
    }
    if (netVAT < 0) {
        validations.push({
            field: "Moms att återfå",
            status: "warning",
            message: "Kontrollera ingående moms"
        })
    }

    return (
        <FormPreview
            title={`Momsdeklaration ${data.period}`}
            authority="Skatteverket"
            formType="SKV 4700"
            period={data.period}
            deadline={data.deadline}
            status={status}
            statusMessage={
                status === "complete"
                    ? `Moms att ${netVAT >= 0 ? "betala" : "återfå"}: ${formatCurrency(Math.abs(netVAT))}`
                    : "Fyll i försäljningsbelopp"
            }
            validations={validations.length > 0 ? validations : undefined}
            exportFormat="XML"
            actions={actions}
            className={className}
        >
            {/* Output VAT Section */}
            <FormSection title="Utgående moms (försäljning)">
                {data.sales25 !== undefined && (
                    <FormFieldRow
                        code="05"
                        label="Försäljning 25%"
                        value={formatCurrency(data.sales25)}
                        status="valid"
                    />
                )}
                {data.vat25 !== undefined && (
                    <FormFieldRow
                        code="10"
                        label="Utgående moms 25%"
                        value={formatCurrency(data.vat25)}
                        status="valid"
                    />
                )}
                {data.sales12 !== undefined && (
                    <FormFieldRow
                        code="06"
                        label="Försäljning 12%"
                        value={formatCurrency(data.sales12)}
                        status="valid"
                    />
                )}
                {data.vat12 !== undefined && (
                    <FormFieldRow
                        code="11"
                        label="Utgående moms 12%"
                        value={formatCurrency(data.vat12)}
                        status="valid"
                    />
                )}
                {data.sales6 !== undefined && (
                    <FormFieldRow
                        code="07"
                        label="Försäljning 6%"
                        value={formatCurrency(data.sales6)}
                        status="valid"
                    />
                )}
                {data.vat6 !== undefined && (
                    <FormFieldRow
                        code="12"
                        label="Utgående moms 6%"
                        value={formatCurrency(data.vat6)}
                        status="valid"
                    />
                )}
                {data.salesExport !== undefined && (
                    <FormFieldRow
                        code="08"
                        label="Export (0%)"
                        value={formatCurrency(data.salesExport)}
                        status="valid"
                    />
                )}
                <FormFieldRow
                    code="30"
                    label="Summa utgående moms"
                    value={formatCurrency(outputVAT)}
                />
            </FormSection>

            {/* Input VAT Section */}
            <FormSection title="Ingående moms (inköp)">
                {data.purchasesDomestic !== undefined && (
                    <FormFieldRow
                        code="48"
                        label="Inköp i Sverige"
                        value={formatCurrency(data.purchasesDomestic)}
                        status="valid"
                    />
                )}
                {data.vatDomestic !== undefined && (
                    <FormFieldRow
                        code="48"
                        label="Ingående moms Sverige"
                        value={formatCurrency(data.vatDomestic)}
                        status="valid"
                    />
                )}
                {data.purchasesEU !== undefined && (
                    <FormFieldRow
                        code="20"
                        label="Inköp från EU"
                        value={formatCurrency(data.purchasesEU)}
                        status="valid"
                    />
                )}
                {data.vatEU !== undefined && (
                    <FormFieldRow
                        code="21"
                        label="Ingående moms EU"
                        value={formatCurrency(data.vatEU)}
                        status="valid"
                    />
                )}
                <FormFieldRow
                    code="49"
                    label="Summa ingående moms"
                    value={formatCurrency(inputVAT)}
                />
            </FormSection>

            {/* Net VAT */}
            <FormTotalRow
                label={netVAT >= 0 ? "Moms att betala" : "Moms att återfå"}
                value={formatCurrency(Math.abs(netVAT))}
                className={cn(
                    netVAT >= 0
                        ? "text-red-600 dark:text-red-500"
                        : "text-green-600 dark:text-green-500"
                )}
            />
        </FormPreview>
    )
}
