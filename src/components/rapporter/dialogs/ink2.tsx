"use client"

import { ReportPreviewDialog } from "./rapport"
import { useAllTaxRates } from "@/hooks/use-tax-parameters"

interface Ink2PreviewDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function Ink2PreviewDialog({ open, onOpenChange }: Ink2PreviewDialogProps) {
    const { rates: taxRates } = useAllTaxRates(new Date().getFullYear() - 1)

    // Empty sections — real data comes from the InkomstWizardDialog or prepare_ink2 AI tool
    const sections = [
        {
            id: "1",
            title: "1. Intäkter",
            items: []
        },
        {
            id: "2",
            title: "2. Kostnader",
            items: []
        },
        {
            id: "3",
            title: "3. Finansiella poster",
            items: []
        },
        {
            id: "4",
            title: "4. Skattemässiga justeringar",
            items: []
        }
    ]

    return (
        <ReportPreviewDialog
            open={open}
            onOpenChange={onOpenChange}
            title="Inkomstdeklaration 2 (INK2)"
            subtitle="Aktiebolag, ekonomiska föreningar m.fl."
            meta={{
                year: String(new Date().getFullYear() - 1),
                yearLabel: "Inkomstår",
                companyName: "",
                companyId: "",
                location: ""
            }}
            sections={sections}
            summary={{
                label: "Skattemässigt resultat",
                value: 0,
                subItems: [
                    { label: `Beräknad skatt (${(taxRates.corporateTaxRate * 100).toFixed(1).replace('.', ',')}%)`, value: 0 }
                ]
            }}
            status="Utkast"
        />
    )
}
