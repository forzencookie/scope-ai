"use client"

import dynamic from "next/dynamic"
import { downloadElementAsPDF } from "@/lib/exports/pdf-generator"

const ShareRegisterPreview = dynamic(() => import("../previews/documents/share-register-preview").then(m => ({ default: m.ShareRegisterPreview })), { ssr: false })

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ShareRegisterCard(props: any) {
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
