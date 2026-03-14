"use client"

import dynamic from "next/dynamic"
import { z } from "zod"
import { downloadElementAsPDF } from "@/lib/generators/pdf-generator"
import { generateXBRL } from "@/lib/generators/xbrl-generator"
import { downloadTextFile } from "./utils"

const AnnualReportPreview = dynamic(() => import("../previews/documents/annual-report-preview").then(m => ({ default: m.AnnualReportPreview })), { ssr: false })

export const AnnualReportSectionSchema = z.object({
    managementReport: z.boolean(),
    incomeStatement: z.boolean(),
    balanceSheet: z.boolean(),
    notes: z.boolean(),
    signatures: z.boolean()
})

export const AnnualReportKeyFigureSchema = z.object({
    label: z.string(),
    currentYear: z.union([z.string(), z.number()]),
    previousYear: z.union([z.string(), z.number()])
})

export const AnnualReportDataSchema = z.object({
    companyName: z.string(),
    orgNumber: z.string(),
    period: z.string(),
    fiscalYearStart: z.string(),
    fiscalYearEnd: z.string(),
    status: z.enum(["draft", "signed", "submitted"]).default("draft"),
    sections: AnnualReportSectionSchema,
    keyFigures: z.array(AnnualReportKeyFigureSchema)
})

export const AnnualReportSchema = z.object({
    data: AnnualReportDataSchema,
    className: z.string().optional()
})

export type AnnualReportProps = z.infer<typeof AnnualReportSchema>

export function AnnualReportCard(props: AnnualReportProps) {
    return (
        <AnnualReportPreview
            {...props}
            actions={{
                onDownload: () => downloadElementAsPDF({
                    fileName: `arsredovisning-${props.data?.period}`,
                    format: 'a4'
                }),
                onSend: () => {
                    const xbrl = generateXBRL({
                        company: { name: "Test AB", orgNumber: "556000-0000" },
                        period: {
                            currentStart: "2024-01-01", currentEnd: "2024-12-31",
                            previousStart: "2023-01-01", previousEnd: "2023-12-31"
                        },
                        values: {
                            netTurnover: 0, goodsCost: 0, externalCosts: 0, personnelCosts: 0,
                            depreciation: 0, operatingResult: 0, financialItems: 0,
                            profitAfterFin: 0, taxOnResult: 0, netResult: 0,
                            fixedAssets: 0, currentAssets: 0, cashAndBank: 0, totalAssets: 0,
                            equity: 0, longTermLiabilities: 0, shortTermLiabilities: 0,
                            totalEquityAndLiabilities: 0,
                        }
                    })
                    downloadTextFile(xbrl, `arsredovisning-${props.data?.period}.xbrl`)
                }
            }}
        />
    )
}
