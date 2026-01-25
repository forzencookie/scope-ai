"use client"

import dynamic from "next/dynamic"
import { downloadTextFile } from "./utils"

const K10FormPreview = dynamic(() => import("../previews/forms/k10-form-preview").then(m => ({ default: m.K10FormPreview })), { ssr: false })

export function K10Card(props: any) {
    return (
        <K10FormPreview
            {...props}
            actions={{
                onExportXML: () => {
                    // K10 is often just SRU attached to INK1
                    downloadTextFile("SRU CONTENT FOR K10...", "k10.sru")
                }
            }}
        />
    )
}
