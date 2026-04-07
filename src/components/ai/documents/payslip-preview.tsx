"use client"

/**
 * PayslipPreview - Swedish lönebesked (salary specification)
 *
 * Modeled after real Swedish payslips from Fortnox/Visma/Hogia.
 * White background for print/PDF. No "Befattning" — that belongs
 * on the employment contract, not the payslip.
 *
 * Standard fields per Företagarna / Skatteverket / Fortnox:
 * - Arbetsgivare (name, org.nr, address)
 * - Anställd (name, personnummer masked, anst.nr)
 * - Löneperiod + utbetalningsdag
 * - Lönearter table: Löneart, Antal (only for hourly), Belopp
 * - Bruttolön → skatteavdrag → nettolön
 * - Semesterinfo (betalda/sparade/intjänade dagar)
 * - Ackumulerat (YTD totals)
 *
 * NOT on the payslip (employer-side only):
 * - Arbetsgivaravgifter — reported in AGI, not on lönebesked
 * - À-pris — not standard in Swedish payroll systems
 */

import { cn, formatCurrency } from "@/lib/utils"
import {
    DocumentPreview,
    type DocumentPreviewProps
} from "./document-preview"

// =============================================================================
// Types
// =============================================================================

export interface PayslipLineItem {
    /** Löneart description, e.g. "Månadslön", "OB-tillägg kväll" */
    label: string
    /** Amount (positive = earning, negative = deduction) */
    amount: number
    /** Type to control sign display */
    type: "earning" | "deduction"
    /** Optional quantity — only for hourly/unit-based items (e.g. 8 timmar) */
    quantity?: number
    /** @deprecated Not used — Swedish payslips don't show unit price */
    rate?: number
}

export interface PayslipVacationInfo {
    /** Betalda semesterdagar kvar */
    paidDaysRemaining?: number
    /** Sparade semesterdagar */
    savedDays?: number
    /** Intjänade semesterdagar i år */
    earnedDaysThisYear?: number
    /** Semestertillägg per dag */
    supplementPerDay?: number
}

export interface PayslipYTD {
    /** Bruttolön hittills i år */
    grossYTD: number
    /** Skatt hittills i år */
    taxYTD: number
    /** Nettolön hittills i år */
    netYTD: number
}

export interface PayslipDeduction {
    label: string
    amount: number
    type: "addition" | "deduction"
}

export interface PayslipPreviewProps {
    company: {
        name: string
        orgNumber?: string
        address?: string
    }
    employee: {
        name: string
        personalNumber?: string
        employeeId?: string
        department?: string
        role?: string
    }
    period: string
    grossSalary: number
    adjustments?: PayslipDeduction[]
    taxRate?: number
    taxAmount?: number
    netSalary: number
    paymentDate?: string
    employerContributions?: number
    /** Structured line items (preferred over adjustments for new usage) */
    lineItems?: PayslipLineItem[]
    /** Vacation/semester info */
    vacationInfo?: PayslipVacationInfo
    /** Year-to-date accumulation */
    ytd?: PayslipYTD
    benefits?: Array<{ name: string; value: number }>
    actions?: DocumentPreviewProps["actions"]
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
    taxRate = 0.32,
    taxAmount,
    netSalary,
    paymentDate,
    employerContributions,
    lineItems,
    vacationInfo,
    ytd,
    benefits,
    actions,
    className,
}: PayslipPreviewProps) {
    // Build line items from adjustments if lineItems not provided
    const items: PayslipLineItem[] = lineItems ?? [
        { label: "Månadslön", amount: grossSalary, type: "earning" },
        ...adjustments.map(a => ({
            label: a.label,
            amount: a.amount,
            type: a.type === "addition" ? "earning" as const : "deduction" as const,
        })),
    ]

    const totalEarnings = items.filter(i => i.type === "earning").reduce((s, i) => s + i.amount, 0)
    const totalDeductions = items.filter(i => i.type === "deduction").reduce((s, i) => s + i.amount, 0)
    const computedGross = totalEarnings - totalDeductions
    const computedTax = taxAmount ?? Math.round(computedGross * taxRate)
    const taxPercent = Math.round(taxRate * 100)

    return (
        <DocumentPreview
            title="Lönebesked"
            subtitle={`Period: ${period}`}
            date={paymentDate ? `Utbetalningsdag: ${paymentDate}` : undefined}
            companyInfo={{
                name: company.name,
                orgNumber: company.orgNumber,
                address: company.address,
            }}
            actions={actions}
            className={className}
        >
            {/* Employee info row — no "Befattning", matches real Swedish payslips */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 text-sm pb-5 border-b border-neutral-200">
                <div>
                    <span className="text-xs text-neutral-500 block">Anställd</span>
                    <span className="font-medium">{employee.name}</span>
                </div>
                {employee.personalNumber && (
                    <div>
                        <span className="text-xs text-neutral-500 block">Personnummer</span>
                        <span className="font-mono text-sm">{employee.personalNumber}</span>
                    </div>
                )}
                {employee.employeeId && (
                    <div>
                        <span className="text-xs text-neutral-500 block">Anst.nr</span>
                        <span className="font-mono text-sm">{employee.employeeId}</span>
                    </div>
                )}
            </div>

            {/* Lönearter table — Fortnox-style: Löneart, Antal, Belopp */}
            <div className="pt-4">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b text-xs text-neutral-500">
                            <th className="text-left py-2 font-medium">Löneart</th>
                            <th className="text-right py-2 font-medium w-20">Antal</th>
                            <th className="text-right py-2 font-medium w-28">Belopp</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, i) => (
                            <tr key={i} className="border-b border-dashed border-neutral-200">
                                <td className="py-2">{item.label}</td>
                                <td className="py-2 text-right font-mono text-neutral-500">
                                    {item.quantity != null ? item.quantity : ""}
                                </td>
                                <td className={cn(
                                    "py-2 text-right font-mono",
                                    item.type === "deduction" && "text-red-600"
                                )}>
                                    {item.type === "deduction" ? "−" : ""}{formatCurrency(item.amount)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Summation: brutto → skatt → netto */}
            <div className="pt-4 space-y-2 border-t border-neutral-200">
                <div className="flex justify-between text-sm">
                    <span className="text-neutral-500">Bruttolön</span>
                    <span className="font-mono font-medium">{formatCurrency(computedGross)}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-neutral-500">Skatteavdrag ({taxPercent}%)</span>
                    <span className="font-mono text-red-600">−{formatCurrency(computedTax)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-neutral-200">
                    <span className="font-bold">Nettolön</span>
                    <span className="font-bold font-mono text-lg">{formatCurrency(netSalary)}</span>
                </div>
            </div>

            {/* Benefits */}
            {benefits && benefits.length > 0 && (
                <div className="pt-3 mt-3 border-t border-dashed border-neutral-200">
                    <p className="text-xs font-medium text-neutral-500 mb-2">Förmåner</p>
                    {benefits.map((b, i) => (
                        <div key={i} className="flex justify-between text-xs text-neutral-500">
                            <span>{b.name}</span>
                            <span className="font-mono">{formatCurrency(b.value)}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Semesterinfo */}
            {vacationInfo && (
                <div className="pt-3 mt-3 border-t border-dashed border-neutral-200">
                    <p className="text-xs font-medium text-neutral-500 mb-2">Semester</p>
                    <div className="grid grid-cols-3 gap-4 text-xs">
                        {vacationInfo.paidDaysRemaining != null && (
                            <div>
                                <span className="text-neutral-500 block">Betalda kvar</span>
                                <span className="font-mono font-medium">{vacationInfo.paidDaysRemaining} dagar</span>
                            </div>
                        )}
                        {vacationInfo.savedDays != null && (
                            <div>
                                <span className="text-neutral-500 block">Sparade</span>
                                <span className="font-mono font-medium">{vacationInfo.savedDays} dagar</span>
                            </div>
                        )}
                        {vacationInfo.earnedDaysThisYear != null && (
                            <div>
                                <span className="text-neutral-500 block">Intjänade i år</span>
                                <span className="font-mono font-medium">{vacationInfo.earnedDaysThisYear} dagar</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Ackumulerat (YTD) */}
            {ytd && (
                <div className="pt-3 mt-3 border-t border-dashed border-neutral-200">
                    <p className="text-xs font-medium text-neutral-500 mb-2">Ackumulerat {new Date().getFullYear()}</p>
                    <div className="grid grid-cols-3 gap-4 text-xs">
                        <div>
                            <span className="text-neutral-500 block">Brutto</span>
                            <span className="font-mono font-medium">{formatCurrency(ytd.grossYTD)}</span>
                        </div>
                        <div>
                            <span className="text-neutral-500 block">Skatt</span>
                            <span className="font-mono font-medium">{formatCurrency(ytd.taxYTD)}</span>
                        </div>
                        <div>
                            <span className="text-neutral-500 block">Netto</span>
                            <span className="font-mono font-medium">{formatCurrency(ytd.netYTD)}</span>
                        </div>
                    </div>
                </div>
            )}
            {/* Arbetsgivaravgifter — informational, not a deduction from the employee */}
            {employerContributions != null && employerContributions > 0 && (
                <div className="pt-3 mt-3 border-t border-dashed border-neutral-200">
                    <div className="flex justify-between text-xs text-neutral-400 italic">
                        <span>Arbetsgivaravgift ({((employerContributions / computedGross) * 100).toFixed(1)}%)</span>
                        <span className="font-mono">{formatCurrency(employerContributions)}</span>
                    </div>
                </div>
            )}
        </DocumentPreview>
    )
}
