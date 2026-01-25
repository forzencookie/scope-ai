"use client"

import dynamic from "next/dynamic"
import { downloadElementAsPDF } from "@/lib/exports/pdf-generator"

const FinancialReportPreview = dynamic(() => import("../previews/documents/financial-report-preview").then(m => ({ default: m.FinancialReportPreview })), { ssr: false })

export function FinancialReportCard(props: any) {
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
