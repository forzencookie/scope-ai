"use client"

import { cn } from "@/lib/utils"
import { useCompany } from "@/providers/company-provider"
import { 
    DataTable, 
    DataTableHeader, 
    DataTableHeaderCell, 
    DataTableBody, 
    DataTableRow, 
    DataTableCell 
} from "@/components/ui/data-table"
import { SectionCard } from "@/components/ui/section-card"
import { declarationItems, balanceItems } from "./constants"

// Simple Resultaträkning (Income Statement) content
export function ResultatrakningContent() {
    const { companyType } = useCompany()
    
    return (
        <SectionCard
            title="Resultaträkning"
            description={`Räkenskapsår 2024 • ${companyType.toUpperCase()}`}
        >
            <DataTable>
                <DataTableHeader>
                    <DataTableHeaderCell label="Post" />
                    <DataTableHeaderCell label="Belopp (kr)" className="text-right" />
                </DataTableHeader>
                <DataTableBody>
                    {declarationItems.map((item, i) => (
                        <DataTableRow key={i}>
                            <DataTableCell 
                                bold={item.highlight} 
                                className={item.highlight ? "bg-muted/30" : ""}
                            >
                                {item.label}
                            </DataTableCell>
                            <DataTableCell 
                                className={cn(
                                    "text-right font-mono",
                                    item.highlight && "bg-muted/30 font-semibold",
                                    item.value < 0 && "text-red-600 dark:text-red-500/70"
                                )}
                            >
                                {item.value.toLocaleString('sv-SE')}
                            </DataTableCell>
                        </DataTableRow>
                    ))}
                </DataTableBody>
            </DataTable>
        </SectionCard>
    )
}

// Simple Balansräkning (Balance Sheet) content
export function BalansrakningContent() {
    const { companyType } = useCompany()
    
    return (
        <SectionCard
            title="Balansräkning"
            description={`Per 2024-12-31 • ${companyType.toUpperCase()}`}
        >
            <DataTable>
                <DataTableHeader>
                    <DataTableHeaderCell label="Post" />
                    <DataTableHeaderCell label="Belopp (kr)" className="text-right" />
                </DataTableHeader>
                <DataTableBody>
                    {balanceItems.map((item, i) => (
                        <DataTableRow key={i}>
                            <DataTableCell 
                                bold={item.highlight || item.isHeader} 
                                className={cn(
                                    item.highlight && "bg-muted/30",
                                    item.isHeader && "text-muted-foreground uppercase text-xs tracking-wider pt-4"
                                )}
                            >
                                {item.label}
                            </DataTableCell>
                            <DataTableCell 
                                className={cn(
                                    "text-right font-mono",
                                    item.highlight && "bg-muted/30 font-semibold",
                                    item.isHeader && "pt-4"
                                )}
                            >
                                {item.value?.toLocaleString('sv-SE') || ''}
                            </DataTableCell>
                        </DataTableRow>
                    ))}
                </DataTableBody>
            </DataTable>
        </SectionCard>
    )
}
