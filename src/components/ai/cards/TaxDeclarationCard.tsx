"use client"

import dynamic from "next/dynamic"
import { generateINK2Sru } from "@/lib/exports/sru-generator"
import { downloadTextFile } from "./utils"
import { useCompany } from "@/providers/company-provider"

const TaxDeclarationPreview = dynamic(() => import("../previews/forms/tax-declaration-preview").then(m => ({ default: m.TaxDeclarationPreview })), { ssr: false })

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function TaxDeclarationCard(props: any) {
    const { company } = useCompany()

    return (
        <TaxDeclarationPreview
            {...props}
            actions={{
                onExportXML: () => {
                    const sru = generateINK2Sru({
                        orgNumber: company?.orgNumber || "",
                        period: props.data?.period || "2024",
                        taxData: {},
                        contact: {
                            name: company?.contactPerson || "",
                            phone: company?.phone || "",
                            email: company?.email || "",
                        }
                    })
                    downloadTextFile(sru, "ink2.sru")
                }
            }}
        />
    )
}
