"use client"

/**
 * TaxDeclarationPreview - Form preview for Income Declaration (Inkomstdeklaration 2)
 * 
 * Shows the structure of INK2 for limited companies.
 */

import { formatCurrency } from "@/lib/utils"
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

export interface TaxDeclarationData {
    period: string
    taxableResult: number
    taxAdjustments: {
        nonDeductibleExpenses?: number // Ej avdragsgilla kostnader
        nonTaxableIncome?: number     // Ej skattepliktiga intäkter
        standardIncomeTaxAllocation?: number // Schablonintäkt periodiseringsfonder
    }
    taxCalculations: {
        corporateTax: number          // Bolagsskatt (20.6%)
        taxReduction?: number
    }
}

export interface TaxDeclarationPreviewProps {
    data: TaxDeclarationData
    actions?: FormPreviewProps['actions']
    className?: string
}

// =============================================================================
// Component
// =============================================================================

export function TaxDeclarationPreview({
    data,
    actions,
    className,
}: TaxDeclarationPreviewProps) {
    const status: FormStatus = "complete"

    // Calculate tax base
    const taxBase = data.taxableResult +
        (data.taxAdjustments.nonDeductibleExpenses || 0) -
        (data.taxAdjustments.nonTaxableIncome || 0) +
        (data.taxAdjustments.standardIncomeTaxAllocation || 0)

    return (
        <FormPreview
            title="Inkomstdeklaration 2"
            authority="Skatteverket"
            formType="INK2 - Aktiebolag"
            period={data.period}
            status={status}
            statusMessage="Beräknad bolagsskatt"
            exportFormat="SRU"
            actions={actions}
            className={className}
        >
            <FormSection title="Skattemässiga justeringar">
                <FormFieldRow
                    code="3.1"
                    label="Bokfört resultat"
                    value={formatCurrency(data.taxableResult)}
                />
                {data.taxAdjustments.nonDeductibleExpenses && (
                    <FormFieldRow
                        code="4.3"
                        label="Ej avdragsgilla kostnader"
                        value={`+${formatCurrency(data.taxAdjustments.nonDeductibleExpenses)}`}
                    />
                )}
                {data.taxAdjustments.nonTaxableIncome && (
                    <FormFieldRow
                        code="4.5"
                        label="Ej skattepliktiga intäkter"
                        value={`-${formatCurrency(data.taxAdjustments.nonTaxableIncome)}`}
                    />
                )}
                {data.taxAdjustments.standardIncomeTaxAllocation && (
                    <FormFieldRow
                        code="4.6"
                        label="Schablonintäkt per.fonder"
                        value={`+${formatCurrency(data.taxAdjustments.standardIncomeTaxAllocation)}`}
                    />
                )}
            </FormSection>

            <FormSection title="Skatteberäkning">
                <FormFieldRow
                    label="Skattepliktigt överskott"
                    value={formatCurrency(taxBase)}
                    status="valid"
                    className="font-medium"
                />
                <FormFieldRow
                    label="Bolagsskatt (20.6%)"
                    value={formatCurrency(data.taxCalculations.corporateTax)}
                    className="text-red-600 dark:text-red-500"
                />
            </FormSection>

            <FormTotalRow
                label="Att betala / få tillbaka"
                value={formatCurrency(data.taxCalculations.corporateTax)} // Simplified for preview
            />
        </FormPreview>
    )
}
