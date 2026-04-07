import dynamic from "next/dynamic"
import { z } from "zod"

const VerificationPreview = dynamic(() => import("./VerificationDetail").then(m => ({ default: m.VerificationDetail })), { ssr: false })

export const VerificationRowSchema = z.object({
    account: z.string(),
    description: z.string().optional(),
    debit: z.number().optional(),
    credit: z.number().optional()
})

export const VerificationSchema = z.object({
    date: z.string().optional(),
    description: z.string(),
    rows: z.array(VerificationRowSchema)
})

export type VerificationProps = z.infer<typeof VerificationSchema>

export function VerificationCard(props: VerificationProps) {
    return <VerificationPreview data={props} />
}
