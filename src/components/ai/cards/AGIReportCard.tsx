"use client"

import dynamic from "next/dynamic"
import { generateAGIXML } from "@/lib/exports/agi-generator"
import { downloadTextFile } from "./utils"

const AGIFormPreview = dynamic(() => import("../previews/forms/agi-form-preview").then(m => ({ default: m.AGIFormPreview })), { ssr: false })

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function AGIReportCard(props: any) {
    return (
        <AGIFormPreview
            {...props}
            actions={{
                onExportXML: () => {
                    const xml = generateAGIXML({
                        period: props.data?.period || "2024-01",
                        submissionId: `AGI-${Date.now()}`,
                        employer: {
                            orgNumber: "556123-4567",
                            name: "Mitt Företag AB",
                            contactName: "Admin",
                            phone: "070-1234567",
                            email: "admin@foretaget.se"
                        },
                        employees: [], // In real app, map this from cardData.data.employees
                        deductions: {}
                    })
                    downloadTextFile(xml, `agi-${props.data?.period}.xml`)
                }
            }}
        />
    )
}
