// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import dynamic from "next/dynamic"

const VerificationPreview = dynamic(() => import("../previews/bokforing/verification-preview").then(m => ({ default: m.VerificationPreview })), { ssr: false })

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function VerificationCard(props: any) {
    return <VerificationPreview data={props} />
}
