import { FileText } from "lucide-react"
import { ActionEmptyState } from "@/components/shared"

export function InvoicesEmptyState({ hasFilters }: { hasFilters: boolean }) {
    return (
        <ActionEmptyState
            icon={FileText}
            title={hasFilters ? "Inga matchningar" : "Inga fakturor än"}
            description={hasFilters
                ? "Vi hittade inga fakturor som matchar dina filter. Prova att ändra filterinställningarna."
                : "Här samlas alla dina kund- och leverantörsfakturor. Fråga Scooby att skapa din första faktura!"
            }
        />
    )
}
