"use client"

import dynamic from "next/dynamic"
import { downloadElementAsPDF } from "@/lib/exports/pdf-generator"

const BoardMinutesPreview = dynamic(() => import("../previews/documents/board-minutes-preview").then(m => ({ default: m.BoardMinutesPreview })), { ssr: false })

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function BoardMinutesCard(props: any) {
    return (
        <BoardMinutesPreview
            {...props}
            actions={{
                onDownload: () => downloadElementAsPDF({
                    fileName: `protokoll-${props.data?.date || 'datum'}`,
                    format: 'a4'
                })
            }}
        />
    )
}
