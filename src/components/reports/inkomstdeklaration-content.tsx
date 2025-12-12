"use client"

import { useState } from "react"
import { 
    Calendar, 
    TrendingUp, 
    Clock, 
    Bot, 
    Download, 
    Send,
    FileText,
    FileBarChart,
    Wallet,
} from "lucide-react"
import { StatCard, StatCardGrid } from "@/components/ui/stat-card"
import { IconButton } from "@/components/ui/icon-button"
import { 
    DataTable, 
    DataTableHeader, 
    DataTableHeaderCell, 
    DataTableBody, 
    DataTableRow, 
    DataTableCell 
} from "@/components/ui/data-table"
import { SectionCard } from "@/components/ui/section-card"
import { InkomstWizardDialog } from "./ai-wizard-dialog"
import { ink2Fields } from "./constants"
import { INVOICE_STATUS_LABELS } from "@/lib/localization"

export function InkomstdeklarationContent() {
    const [showAIDialog, setShowAIDialog] = useState(false)

    return (
        <main className="flex-1 flex flex-col p-6">
            <div className="max-w-6xl w-full space-y-6">
                <StatCardGrid columns={3}>
                    <StatCard
                        label="Beskattningsår"
                        value="2024"
                        subtitle="Inkomstdeklaration 2"
                        icon={Calendar}
                    />
                    <StatCard
                        label="Bokfört resultat"
                        value="379 000 kr"
                        subtitle="Före skattemässiga justeringar"
                        icon={TrendingUp}
                    />
                    <StatCard
                        label="Status"
                        value={INVOICE_STATUS_LABELS.DRAFT}
                        subtitle="Deadline: 1 jul 2025"
                        icon={Clock}
                    />
                </StatCardGrid>

                {/* Section Separator */}
                <div className="border-b-2 border-border/60" />

                <SectionCard
                    icon={Bot}
                    title="AI-inkomstdeklaration"
                    description="INK2-fälten genereras automatiskt från bokföringen."
                    variant="ai"
                    action={
                        <button 
                            onClick={() => setShowAIDialog(true)}
                            className="px-4 py-2 rounded-lg font-medium bg-white dark:bg-purple-900/60 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-800/50 transition-colors text-sm"
                        >
                            Generera
                        </button>
                    }
                />

                <InkomstWizardDialog 
                    open={showAIDialog} 
                    onOpenChange={setShowAIDialog} 
                />

                <DataTable 
                    title="INK2 – Fält"
                    headerActions={
                        <div className="flex items-center gap-2">
                            <IconButton icon={Download} label="Exportera SRU" showLabel />
                            <button
                                className="px-4 py-2 rounded-lg font-medium flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm"
                            >
                                <Send className="h-4 w-4" />
                                Skicka till Skatteverket
                            </button>
                        </div>
                    }
                >
                    <DataTableHeader>
                        <DataTableHeaderCell label="Fält" icon={FileText} width="96px" />
                        <DataTableHeaderCell label="Beskrivning" icon={FileBarChart} />
                        <DataTableHeaderCell label="Belopp" icon={Wallet} align="right" />
                    </DataTableHeader>
                    <DataTableBody>
                        {ink2Fields.map((item) => (
                            <DataTableRow key={item.field}>
                                <DataTableCell mono muted>{item.field}</DataTableCell>
                                <DataTableCell>{item.label}</DataTableCell>
                                <DataTableCell align="right" bold className={item.value < 0 ? 'text-red-600 dark:text-red-500/70' : ''}>
                                    {item.value.toLocaleString('sv-SE')} kr
                                </DataTableCell>
                            </DataTableRow>
                        ))}
                    </DataTableBody>
                </DataTable>
            </div>
        </main>
    )
}
