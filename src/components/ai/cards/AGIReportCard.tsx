"use client"

import dynamic from "next/dynamic"
import { generateAgiXML } from "@/lib/generators/agi-generator"
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
                    const xml = generateAgiXML({
                        period: props.data?.period || "2024-01",
                        orgNumber: company?.orgNumber || "",
                        companyName: company?.name,
                        totalSalary: props.data?.totalSalary || 0,
                        tax: props.data?.tax || 0,
                        contributions: props.data?.contributions || 0,
                        employees: props.data?.employees || 0,
                        individualData: props.data?.individualData || [],
                    })
                    downloadTextFile(xml, `agi-${props.data?.period}.xml`)
                }
            }}
        />
    )
}
