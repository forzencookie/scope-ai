"use client"

import dynamic from "next/dynamic"
import { z } from "zod"
import { downloadElementAsPDF } from "@/lib/generators/pdf-generator"

const FinancialReportPreview = dynamic(() => import("../previews/documents/financial-report-preview").then(m => ({ default: m.FinancialReportPreview })), { ssr: false })

export const FinancialRowSchema = z.object({
    id: z.string(),
    label: z.string(),
    code: z.string().optional(),
    amount: z.number(),
    previousAmount: z.number().optional(),
    type: z.enum(["header", "row", "sum", "total"]),
    level: z.number().optional()
})

export const FinancialReportDataSchema = z.object({
    companyName: z.string(),
    reportType: z.enum(["Resultaträkning", "Balansräkning", "Resultat & Balans"]),
    period: z.string(),
    comparisonPeriod: z.string().optional(),
    currency: z.string(),
    incomeStatement: z.array(FinancialRowSchema).optional(),
    balanceSheetAssets: z.array(FinancialRowSchema).optional(),
    balanceSheetEquityLiability: z.array(FinancialRowSchema).optional(),
    resultBeforeTax: z.number().optional()
})

export const FinancialReportSchema = z.object({
    data: FinancialReportDataSchema,
    className: z.string().optional()
})

export type FinancialReportProps = z.infer<typeof FinancialReportSchema>

export function FinancialReportCard(props: FinancialReportProps) {
    return (
        <FinancialReportPreview
            {...props}
            actions={{
                onDownload: () => downloadElementAsPDF({
                    fileName: `rapport-${props.data?.period}`,
                    orientation: 'landscape' // Financial reports are wide
                })
            }}
        />
    )
}
