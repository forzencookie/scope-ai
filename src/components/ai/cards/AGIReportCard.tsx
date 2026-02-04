"use client"

import dynamic from "next/dynamic"
import { generateAGIXML } from "@/lib/exports/agi-generator"
import { downloadTextFile } from "./utils"
import { useCompany } from "@/providers/company-provider"

const AGIFormPreview = dynamic(() => import("../previews/forms/agi-form-preview").then(m => ({ default: m.AGIFormPreview })), { ssr: false })

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function AGIReportCard(props: any) {
    const { company } = useCompany()

    return (
        <AGIFormPreview
            {...props}
            actions={{
                onExportXML: () => {
                    const xml = generateAGIXML({
                        period: props.data?.period || "2024-01",
                        submissionId: `AGI-${Date.now()}`,
                        employer: {
                            orgNumber: company?.orgNumber || "",
                            name: company?.name || "",
                            contactName: company?.contactPerson || "",
                            phone: company?.phone || "",
                            email: company?.email || "",
                        },
                        employees: [],
                        deductions: {}
                    })
                    downloadTextFile(xml, `agi-${props.data?.period}.xml`)
                }
            }}
        />
    )
}
