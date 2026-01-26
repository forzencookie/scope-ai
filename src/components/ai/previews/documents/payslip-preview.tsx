"use client"

/**
 * PayslipPreview - Document preview for AI-generated payslips
 * 
 * Shows a Swedish-style lönebesked that can be downloaded as PDF
 * and sent to employees.
 */

import { formatCurrency } from "@/lib/utils"
import {
    DocumentPreview,
    DocumentSection,
    DocumentSummaryRow
} from "../document-preview"

// =============================================================================
// Types
// =============================================================================

export interface PayslipDeduction {
    label: string
    amount: number
    type: "addition" | "deduction"
}

export interface PayslipPreviewProps {
    /** Company information */
    company: {
        name: string
        orgNumber?: string
        address?: string
    }
    /** Employee information */
    employee: {
        name: string
        personalNumber?: string
        employeeId?: string
        department?: string
        role?: string
    }
    /** Pay period */
    period: string
    /** Base/gross salary */
    grossSalary: number
    /** Deductions and additions */
    adjustments?: PayslipDeduction[]
    /** Tax rate (as decimal, e.g., 0.30 for 30%) */
    taxRate?: number
    /** Calculated tax amount (if provided, overrides taxRate calculation) */
    taxAmount?: number
    /** Net salary to be paid */
    netSalary: number
    /** Payment date */
    paymentDate?: string
    /** Employer contributions (arbetsgivaravgifter) */
    employerContributions?: number
    /** Additional benefits */
    benefits?: Array<{
        name: string
        value: number
    }>
    /** Actions */
    actions?: {
        onConfirm?: () => void
        onCancel?: () => void
        onEdit?: () => void
        onDownload?: () => void
        onSend?: () => void
        isLoading?: boolean
    }
    className?: string
}

// =============================================================================
// Component
// =============================================================================

export function PayslipPreview({
    company,
    employee,
    period,
    grossSalary,
    adjustments = [],
    taxRate = 0.30,
    taxAmount,
    netSalary,
    paymentDate,
    employerContributions,
    benefits,
    actions,
    className,
}: PayslipPreviewProps) {
    // Calculate values
    const additions = adjustments.filter(a => a.type === "addition")
    const deductions = adjustments.filter(a => a.type === "deduction")
    const totalAdditions = additions.reduce((sum, a) => sum + a.amount, 0)
    const totalDeductions = deductions.reduce((sum, a) => sum + a.amount, 0)
    const adjustedGross = grossSalary + totalAdditions - totalDeductions
    const calculatedTax = taxAmount ?? Math.round(adjustedGross * taxRate)

    // Mask personal number for privacy
    const maskedPersonalNumber = employee.personalNumber
        ? employee.personalNumber.replace(/(\d{6})-?(\d{4})/, "$1-****")
        : undefined

    return (
        <DocumentPreview
            title="Lönebesked"
            subtitle={`Period: ${period}`}
            date={paymentDate ? `Utbetalningsdatum: ${paymentDate}` : undefined}
            companyInfo={{
                name: company.name,
                orgNumber: company.orgNumber,
                address: company.address,
            }}
            recipientInfo={{
                name: employee.name,
            }}
            actions={actions}
            className={className}
        >
            {/* Employee Details */}
            <DocumentSection className="pb-4 border-b border-border/40">
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="text-muted-foreground">Anställd:</span>
                        <span className="ml-2 font-medium">{employee.name}</span>
                    </div>
                    {maskedPersonalNumber && (
                        <div>
                            <span className="text-muted-foreground">Personnummer:</span>
                            <span className="ml-2 font-mono">{maskedPersonalNumber}</span>
                        </div>
                    )}
                    {employee.employeeId && (
                        <div>
                            <span className="text-muted-foreground">Anställningsnr:</span>
                            <span className="ml-2 font-mono">{employee.employeeId}</span>
                        </div>
                    )}
                    {employee.role && (
                        <div>
                            <span className="text-muted-foreground">Befattning:</span>
                            <span className="ml-2">{employee.role}</span>
                        </div>
                    )}
                </div>
            </DocumentSection>

            {/* Salary Breakdown */}
            <DocumentSection title="Lönspecifikation" className="pt-4">
                <div className="space-y-1">
                    <DocumentSummaryRow
                        label="Grundlön"
                        value={formatCurrency(grossSalary)}
                    />

                    {/* Additions */}
                    {additions.map((a, i) => (
                        <DocumentSummaryRow
                            key={`add-${i}`}
                            label={a.label}
                            value={`+${formatCurrency(a.amount)}`}
                            className="text-green-600 dark:text-green-500"
                        />
                    ))}

                    {/* Deductions (before tax) */}
                    {deductions.map((d, i) => (
                        <DocumentSummaryRow
                            key={`ded-${i}`}
                            label={d.label}
                            value={`-${formatCurrency(d.amount)}`}
                            className="text-red-600 dark:text-red-500"
                        />
                    ))}

                    {/* Adjusted Gross */}
                    {(additions.length > 0 || deductions.length > 0) && (
                        <DocumentSummaryRow
                            label="Bruttolön"
                            value={formatCurrency(adjustedGross)}
                            className="font-medium pt-2 border-t"
                        />
                    )}

                    {/* Tax */}
                    <DocumentSummaryRow
                        label={`Skatt (${Math.round(taxRate * 100)}%)`}
                        value={`-${formatCurrency(calculatedTax)}`}
                        className="text-red-600 dark:text-red-500"
                    />
                </div>

                {/* Net Salary */}
                <DocumentSummaryRow
                    label="Nettolön att betala"
                    value={formatCurrency(netSalary)}
                    highlight
                    className="mt-2"
                />
            </DocumentSection>

            {/* Benefits */}
            {benefits && benefits.length > 0 && (
                <DocumentSection title="Förmåner" className="pt-4 border-t">
                    <div className="space-y-1">
                        {benefits.map((b, i) => (
                            <DocumentSummaryRow
                                key={i}
                                label={b.name}
                                value={formatCurrency(b.value)}
                            />
                        ))}
                    </div>
                </DocumentSection>
            )}

            {/* Employer Contributions */}
            {employerContributions && (
                <div className="pt-4 border-t">
                    <p className="text-xs text-muted-foreground">
                        Arbetsgivaravgifter: {formatCurrency(employerContributions)}
                    </p>
                </div>
            )}
        </DocumentPreview>
    )
}
