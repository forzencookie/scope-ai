"use client"

import dynamic from "next/dynamic"
import { generateVATSru } from "@/lib/exports/sru-generator"
import { downloadTextFile } from "./utils"

const VATFormPreview = dynamic(() => import("../previews/forms/vat-form-preview").then(m => ({ default: m.VATFormPreview })), { ssr: false })

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function VATReportCard(props: any) {
    return (
        <VATFormPreview
            {...props}
            actions={{
                onExportXML: () => {
                    // Transform data to SRU format
                    const sru = generateVATSru({
                        orgNumber: "556123-4567", // Should come from context/props in a real app
                        period: props.data?.period || "2024",
                        vatData: {
                            '10': props.data?.sales25 || 0,
                            '48': props.data?.vat25 || 0,
                            '49': props.data?.netVAT || 0
                        },
                        contact: {
                            name: "Admin",
                            phone: "070-0000000",
                            email: "admin@company.com"
                        }
                    })
                    downloadTextFile(sru, `moms-${props.data?.period}.sru`)
                }
            }}
        />
    )
}
