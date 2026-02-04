"use client"

import dynamic from "next/dynamic"
import { generateVATSru } from "@/lib/exports/sru-generator"
import { downloadTextFile } from "./utils"
import { useCompany } from "@/providers/company-provider"

const VATFormPreview = dynamic(() => import("../previews/forms/vat-form-preview").then(m => ({ default: m.VATFormPreview })), { ssr: false })

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function VATReportCard(props: any) {
    const { company } = useCompany()

    return (
        <VATFormPreview
            {...props}
            actions={{
                onExportXML: () => {
                    const sru = generateVATSru({
                        orgNumber: company?.orgNumber || "",
                        period: props.data?.period || "2024",
                        vatData: {
                            '10': props.data?.sales25 || 0,
                            '48': props.data?.vat25 || 0,
                            '49': props.data?.netVAT || 0
                        },
                        contact: {
                            name: company?.contactPerson || "",
                            phone: company?.phone || "",
                            email: company?.email || "",
                        }
                    })
                    downloadTextFile(sru, `moms-${props.data?.period}.sru`)
                }
            }}
        />
    )
}
