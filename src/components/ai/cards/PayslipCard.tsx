"use client"

import dynamic from "next/dynamic"
import { z } from "zod"
import { downloadElementAsPDF } from "@/lib/generators/pdf-generator"

const PayslipPreview = dynamic(() => import("../previews/documents/payslip-preview").then(m => ({ default: m.PayslipPreview })), { ssr: false })

export const PayslipCompanySchema = z.object({
    name: z.string(),
    orgNumber: z.string().optional(),
    address: z.string().optional()
})

export const PayslipEmployeeSchema = z.object({
    name: z.string(),
    personalNumber: z.string().optional(),
    employeeId: z.string().optional(),
    department: z.string().optional(),
    role: z.string().optional()
})

export const PayslipDeductionSchema = z.object({
    label: z.string(),
    amount: z.number(),
    type: z.enum(["addition", "deduction"])
})

export const PayslipBenefitSchema = z.object({
    name: z.string(),
    value: z.number()
})

export const PayslipSchema = z.object({
    company: PayslipCompanySchema,
    employee: PayslipEmployeeSchema,
    period: z.string(),
    grossSalary: z.number(),
    adjustments: z.array(PayslipDeductionSchema).optional(),
    taxRate: z.number().optional(),
    taxAmount: z.number().optional(),
    netSalary: z.number(),
    paymentDate: z.string().optional(),
    employerContributions: z.number().optional(),
    benefits: z.array(PayslipBenefitSchema).optional(),
    className: z.string().optional()
})

export type PayslipProps = z.infer<typeof PayslipSchema>

export function PayslipCard(props: PayslipProps) {
    return (
        <PayslipPreview
            {...props}
            actions={{
                onDownload: () => downloadElementAsPDF({
                    fileName: `lonebesked-${props.period || 'okand'}`,
                    format: 'a4'
                })
            }}
        />
    )
}
