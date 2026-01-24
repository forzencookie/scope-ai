// @ts-nocheck
"use client"

import dynamic from "next/dynamic"

const VerificationPreview = dynamic(() => import("../previews/bokforing/verification-preview").then(m => ({ default: m.VerificationPreview })), { ssr: false })

export function VerificationCard(props: any) {
    // @ts-ignore
    return <VerificationPreview data={props} />
}
