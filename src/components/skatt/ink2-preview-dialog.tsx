"use client"

import { ink2Fields } from "./constants"
import { ReportPreviewDialog } from "./report-preview-dialog"

interface Ink2PreviewDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function Ink2PreviewDialog({ open, onOpenChange }: Ink2PreviewDialogProps) {
    const totalCalculated = ink2Fields
        .filter(f => f.field === "4.1")
        .reduce((sum, f) => sum + f.value, 0)

    const sections = [
        {
            id: "1",
            title: "1. Intäkter",
            items: ink2Fields.filter(f => f.field.startsWith("1.")).map(f => ({
                id: f.field,
                label: f.label,
                value: f.value
            }))
        },
        {
            id: "2",
            title: "2. Kostnader",
            items: ink2Fields.filter(f => f.field.startsWith("2.")).map(f => ({
                id: f.field,
                label: f.label,
                value: f.value
            }))
        },
        {
            id: "3",
            title: "3. Finansiella poster",
            items: ink2Fields.filter(f => f.field.startsWith("3.")).map(f => ({
                id: f.field,
                label: f.label,
                value: f.value
            }))
        },
        {
            id: "4",
            title: "4. Skattemässiga justeringar",
            items: ink2Fields.filter(f => f.field.startsWith("4.")).map(f => ({
                id: f.field,
                label: f.label,
                value: f.value
            }))
        }
    ]

    return (
        <ReportPreviewDialog
            open={open}
            onOpenChange={onOpenChange}
            title="Inkomstdeklaration 2 (INK2)"
            subtitle="Aktiebolag, ekonomiska föreningar m.fl."
            meta={{
                year: "2024",
                yearLabel: "Inkomstår",
                companyName: "Mitt Bolag AB",
                companyId: "556000-0000",
                location: "Storgatan 12, 123 45 Stockholm"
            }}
            sections={sections}
            summary={{
                label: "Skattemässigt resultat",
                value: totalCalculated,
                subItems: [
                    { label: "Beräknad skatt (20,6%)", value: Math.round(totalCalculated * 0.206) }
                ]
            }}
            status="Utkast"
        />
    )
}
