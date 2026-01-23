"use client"

/**
 * AGIFormPreview - Form preview for AI-generated Employer's Monthly Declaration (AGI)
 * 
 * Shows a Skatteverket-style Arbetsgivardeklaration with validation
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

export interface AGIData {
    /** Reporting period (YYYY-MM) */
    period: string
    /** Specific submission ID assigned (if any) */
    submissionId?: string

    // Employee Summary
    /** Number of employees included */
    employeeCount: number
    /** Total gross salary payload */
    totalGrossPay: number
    /** Total benefits value */
    totalBenefits: number
    /** Other taxable compensation */
    totalOtherComp?: number

    // Deductions & Fees
    /** Total preliminary tax deducted */
    totalTaxDeduction: number
    /** Total employer contributions (basis) */
    employerFeeBasis: number
    /** Total employer contributions (amount) */
    totalEmployerFee: number
    /** Special payroll tax (särskild löneskatt) */
    specialPayrollTax?: number

    // Adjustments
    /** Research & Development deduction */
    rdDeduction?: number
    /** Regional support deduction */
    regionalDeduction?: number

    // Totals
    /** Total amount to pay */
    totalToPay?: number
}

export interface AGIFormPreviewProps {
    data: AGIData
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

export function AGIFormPreview({
    data,
    actions,
    className,
}: AGIFormPreviewProps) {
    // Calculate totals if not provided
    const calculatedTotalToPay = data.totalToPay ?? (
        data.totalTaxDeduction +
        data.totalEmployerFee +
        (data.specialPayrollTax ?? 0)
    )

    // Determine form status
    // Basic validation: must have employees or explicitly 0, and fees must verify
    const hasEmployees = data.employeeCount >= 0
    const feesLookValid = data.totalEmployerFee > 0 ? data.employerFeeBasis > 0 : true

    const status: FormStatus = (hasEmployees && feesLookValid) ? "complete" : "warning"

    // Build validations
    const validations: FormFieldValidation[] = []

    // Check if tax deduction is reasonable (usually ~30% but varies)
    if (data.totalGrossPay > 0 && data.totalTaxDeduction === 0) {
        validations.push({
            field: "Avdragen skatt",
            status: "warning",
            message: "Ingen skatt avdragen trots löneutbetalning"
        })
    }

    if (data.employerFeeBasis !== (data.totalGrossPay + data.totalBenefits)) {
        // This isn't always an error (some benefits aren't basis for fees), but useful warning
        validations.push({
            field: "Avgiftsunderlag",
            status: "warning",
            message: "Underlaget matchar inte summa lön + förmåner"
        })
    }

    return (
        <FormPreview
            title={`Arbetsgivardeklaration (AGI)`}
            authority="Skatteverket"
            formType="AGI - Individuppgift"
            period={data.period}
            status={status}
            statusMessage={
                status === "complete"
                    ? `Att betala: ${formatCurrency(calculatedTotalToPay)}`
                    : "Kontrollera uppgifterna"
            }
            validations={validations.length > 0 ? validations : undefined}
            exportFormat="XML"
            actions={actions}
            className={className}
        >
            {/* Employee Summary */}
            <FormSection title="Sammanställning Löner">
                <FormFieldRow
                    label="Antal anställda"
                    value={data.employeeCount}
                    status={data.employeeCount > 0 ? "valid" : "warning"}
                />
                <FormFieldRow
                    code="011"
                    label="Kontant bruttolön"
                    value={formatCurrency(data.totalGrossPay)}
                />
                <FormFieldRow
                    code="012"
                    label="Förmåner"
                    value={formatCurrency(data.totalBenefits)}
                />
                {data.totalOtherComp ? (
                    <FormFieldRow
                        label="Övrig ersättning"
                        value={formatCurrency(data.totalOtherComp)}
                    />
                ) : null}
            </FormSection>

            {/* Fees and Deductions */}
            <FormSection title="Avgifter och Skatt">
                <FormFieldRow
                    code="499"
                    label="Underlag arbetsgivaravgifter"
                    value={formatCurrency(data.employerFeeBasis)}
                />
                <FormFieldRow
                    code="487"
                    label="Arbetsgivaravgift (31.42%)" // Typical label, though varies by age
                    value={formatCurrency(data.totalEmployerFee)}
                    status="valid"
                />
                <FormFieldRow
                    code="001"
                    label="Avdragen skatt"
                    value={formatCurrency(data.totalTaxDeduction)}
                    status={data.totalTaxDeduction > 0 ? "valid" : "warning"}
                />
                {data.specialPayrollTax ? (
                    <FormFieldRow
                        label="Särskild löneskatt"
                        value={formatCurrency(data.specialPayrollTax)}
                    />
                ) : null}
            </FormSection>

            {/* Deductions from fees */}
            {(data.rdDeduction || data.regionalDeduction) && (
                <FormSection title="Avdrag från avgifter">
                    {data.rdDeduction && (
                        <FormFieldRow
                            code="470"
                            label="FoU-avdrag"
                            value={`-${formatCurrency(data.rdDeduction)}`}
                            status="valid"
                        />
                    )}
                    {data.regionalDeduction && (
                        <FormFieldRow
                            code="471"
                            label="Regionalt stöd"
                            value={`-${formatCurrency(data.regionalDeduction)}`}
                            status="valid"
                        />
                    )}
                </FormSection>
            )}

            {/* Total */}
            <FormTotalRow
                label="Totalt att betala (Skatter + Avgifter)"
                value={formatCurrency(calculatedTotalToPay)}
                className="text-red-600 dark:text-red-500"
            />
        </FormPreview>
    )
}
