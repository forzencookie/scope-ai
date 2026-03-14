"use client"

import dynamic from "next/dynamic"
import { z } from "zod"
import { generateVATSru } from "@/lib/generators/sru-generator"
import { downloadTextFile } from "./utils"
import { useCompany } from "@/providers/company-provider"

const VATFormPreview = dynamic(() => import("../previews/forms/vat-form-preview").then(m => ({ default: m.VATFormPreview })), { ssr: false })

export const VATDeclarationDataSchema = z.object({
    period: z.string(),
    deadline: z.string().optional(),
    sales25: z.number().optional(),
    vat25: z.number().optional(),
    sales12: z.number().optional(),
    vat12: z.number().optional(),
    sales6: z.number().optional(),
    vat6: z.number().optional(),
    netVAT: z.number().optional()
})

export const VATReportSchema = z.object({
    data: VATDeclarationDataSchema,
    className: z.string().optional()
})

export type VATReportProps = z.infer<typeof VATReportSchema>

export function VATReportCard(props: VATReportProps) {
    const { company } = useCompany()

    return (
        <VATFormPreview
            {...props}
            actions={{
                onExport: () => {
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
