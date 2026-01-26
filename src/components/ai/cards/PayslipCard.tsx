"use client"

import dynamic from "next/dynamic"
import { downloadElementAsPDF } from "@/lib/exports/pdf-generator"

const PayslipPreview = dynamic(() => import("../previews/documents/payslip-preview").then(m => ({ default: m.PayslipPreview })), { ssr: false })

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function PayslipCard(props: any) {
    return (
        <PayslipPreview
            {...props}
            actions={{
                onDownload: () => downloadElementAsPDF({
                    fileName: `lonebesked-${props.period || 'okand'}`,
                    format: 'a4'
                })
            }}
        />
    )
}
