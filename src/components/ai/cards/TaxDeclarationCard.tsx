"use client"

import dynamic from "next/dynamic"
import { generateINK2Sru } from "@/lib/exports/sru-generator"
import { downloadTextFile } from "./utils"

const TaxDeclarationPreview = dynamic(() => import("../previews/forms/tax-declaration-preview").then(m => ({ default: m.TaxDeclarationPreview })), { ssr: false })

export function TaxDeclarationCard(props: any) {
    return (
        <TaxDeclarationPreview
            {...props}
            actions={{
                onExportXML: () => {
                    const sru = generateINK2Sru({
                        orgNumber: "556123-4567",
                        period: props.data?.period || "2024",
                        taxData: {}, // Map from cardData
                        contact: { name: "Admin", phone: "070", email: "admin@test" }
                    })
                    downloadTextFile(sru, "ink2.sru")
                }
            }}
        />
    )
}
