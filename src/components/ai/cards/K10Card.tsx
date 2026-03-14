"use client"

import dynamic from "next/dynamic"
import { z } from "zod"
import { downloadTextFile } from "./utils"

const K10FormPreview = dynamic(() => import("../previews/forms/k10-form-preview").then(m => ({ default: m.K10FormPreview })), { ssr: false })

export const K10DataSchema = z.object({
    period: z.string(),
    shareholderName: z.string(),
    dividendAmount: z.number(),
    savedDividendSpace: z.number(),
    salaryBasedSpace: z.number().optional(),
    standardSpace: z.number().optional(),
    totalBoundaryAmount: z.number(),
    taxedAt20Percent: z.number(),
    taxedAtWork: z.number()
})

export const K10Schema = z.object({
    data: K10DataSchema,
    className: z.string().optional()
})

export type K10Props = z.infer<typeof K10Schema>

export function K10Card(props: K10Props) {
    return (
        <K10FormPreview
            {...props}
            actions={{
                onExport: () => {
                    // K10 is often just SRU attached to INK1
                    downloadTextFile("SRU CONTENT FOR K10...", "k10.sru")
                }
            }}
        />
    )
}
