// @ts-nocheck
"use client"

import dynamic from "next/dynamic"

const EmployeePreview = dynamic(() => import("../previews/employee-preview").then(m => ({ default: m.EmployeePreview })), { ssr: false })

export function EmployeeCard(props: any) {
    return <EmployeePreview data={props} />
}
