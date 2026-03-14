"use client"

import dynamic from "next/dynamic"
import { z } from "zod"
import { generateAgiXML } from "@/lib/generators/agi-generator"
import { downloadTextFile } from "./utils"
import { useCompany } from "@/providers/company-provider"

const AGIFormPreview = dynamic(() => import("../previews/forms/agi-form-preview").then(m => ({ default: m.AGIFormPreview })), { ssr: false })

export const AGIEmployeeDataSchema = z.object({
    personalNumber: z.string(),
    name: z.string(),
    grossSalary: z.number(),
    taxDeduction: z.number(),
    employerContribution: z.number()
})

export const AGIDataSchema = z.object({
    period: z.string(),
    submissionId: z.string().optional(),
    employeeCount: z.number(),
    totalGrossPay: z.number(),
    totalBenefits: z.number(),
    totalOtherComp: z.number().optional(),
    totalTaxDeduction: z.number(),
    employerFeeBasis: z.number(),
    totalEmployerFee: z.number(),
    
    // Additional properties used by generator
    totalSalary: z.number().optional(),
    tax: z.number().optional(),
    contributions: z.number().optional(),
    employees: z.number().optional(),
    individualData: z.array(AGIEmployeeDataSchema).optional()
})

export const AGIReportSchema = z.object({
    data: AGIDataSchema,
    className: z.string().optional()
})

export type AGIReportProps = z.infer<typeof AGIReportSchema>

export function AGIReportCard(props: AGIReportProps) {
    const { company } = useCompany()

    return (
        <AGIFormPreview
            {...props}
            actions={{
                onExport: () => {
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
