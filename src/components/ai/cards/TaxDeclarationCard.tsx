"use client"

import dynamic from "next/dynamic"
import { z } from "zod"
import { generateINK2Sru } from "@/lib/generators/sru-generator"
import { downloadTextFile } from "./utils"
import { useCompany } from "@/providers/company-provider"

const TaxDeclarationPreview = dynamic(() => import("../previews/forms/tax-declaration-preview").then(m => ({ default: m.TaxDeclarationPreview })), { ssr: false })

export const TaxAdjustmentsSchema = z.object({
    nonDeductibleExpenses: z.number().optional(),
    nonTaxableIncome: z.number().optional(),
    standardIncomeTaxAllocation: z.number().optional()
})

export const TaxCalculationsSchema = z.object({
    corporateTax: z.number(),
    taxReduction: z.number().optional()
})

export const TaxDeclarationDataSchema = z.object({
    period: z.string(),
    taxableResult: z.number(),
    taxAdjustments: TaxAdjustmentsSchema,
    taxCalculations: TaxCalculationsSchema
})

export const TaxDeclarationSchema = z.object({
    data: TaxDeclarationDataSchema,
    className: z.string().optional()
})

export type TaxDeclarationProps = z.infer<typeof TaxDeclarationSchema>

export function TaxDeclarationCard(props: TaxDeclarationProps) {
    const { company } = useCompany()

    return (
        <TaxDeclarationPreview
            {...props}
            actions={{
                onExport: () => {
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
