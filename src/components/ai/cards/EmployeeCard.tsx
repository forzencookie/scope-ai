"use client"

import dynamic from "next/dynamic"
import { z } from "zod"

const EmployeePreview = dynamic(() => import("./EmployeeDetail").then(m => ({ default: m.EmployeeDetail })), { ssr: false })

export const EmployeeSchema = z.object({
    name: z.string(),
    role: z.string(),
    email: z.string(),
    salary: z.union([z.number(), z.string()])
})

export type EmployeeProps = z.infer<typeof EmployeeSchema>

export function EmployeeCard(props: EmployeeProps) {
    return <EmployeePreview data={props} />
}
