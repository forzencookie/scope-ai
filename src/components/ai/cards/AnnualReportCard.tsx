"use client"

import dynamic from "next/dynamic"
import { downloadElementAsPDF } from "@/lib/exports/pdf-generator"
import { generateXBRL } from "@/lib/exports/xbrl-generator"
import { downloadTextFile } from "./utils"

const AnnualReportPreview = dynamic(() => import("../previews/documents/annual-report-preview").then(m => ({ default: m.AnnualReportPreview })), { ssr: false })

export function AnnualReportCard(props: any) {
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
                        values: { netTurnover: 0, profitAfterFin: 0, equity: 0, solidity: 0 }
                    })
                    downloadTextFile(xbrl, `arsredovisning-${props.data?.period}.xbrl`)
                }
            }}
        />
    )
}
