import { FileText } from "lucide-react"

export function InvoicesEmptyState({ hasFilters }: { hasFilters: boolean }) {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="font-medium text-lg text-foreground mb-1">
                {hasFilters ? "Inga fakturor matchar filtret" : "Inga fakturor än"}
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm">
                {hasFilters
                    ? "Prova att ändra dina filter eller söktermer för att hitta vad du letar efter."
                    : "Här samlas alla dina kund- och leverantörsfakturor när du börjar skapa dem."}
            </p>
        </div>
    )
}
