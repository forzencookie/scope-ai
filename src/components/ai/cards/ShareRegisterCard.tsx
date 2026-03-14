"use client"

import dynamic from "next/dynamic"
import { z } from "zod"
import { downloadElementAsPDF } from "@/lib/generators/pdf-generator"

const ShareRegisterPreview = dynamic(() => import("../previews/documents/share-register-preview").then(m => ({ default: m.ShareRegisterPreview })), { ssr: false })

export const ShareholderSchema = z.object({
    id: z.string(),
    name: z.string(),
    personalOrOrgNumber: z.string(),
    address: z.string().optional(),
    shareCount: z.number(),
    shareClass: z.string(),
    votingRights: z.number(),
    acquisitionDate: z.string()
})

export const ShareRegisterDataSchema = z.object({
    companyName: z.string(),
    orgNumber: z.string(),
    date: z.string(),
    totalShares: z.number(),
    totalCapital: z.number(),
    shareholders: z.array(ShareholderSchema)
})

export const ShareRegisterSchema = z.object({
    data: ShareRegisterDataSchema,
    className: z.string().optional()
})

export type ShareRegisterProps = z.infer<typeof ShareRegisterSchema>

export function ShareRegisterCard(props: ShareRegisterProps) {
    return (
        <ShareRegisterPreview
            {...props}
            actions={{
                onDownload: () => downloadElementAsPDF({
                    fileName: `aktiebok-${new Date().toISOString().split('T')[0]}`,
                    format: 'a4'
                })
            }}
        />
    )
}
