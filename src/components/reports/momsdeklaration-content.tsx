"use client"

import { useState } from "react"
import { 
    Calendar, 
    Wallet, 
    TrendingUp, 
    Bot, 
    Clock, 
    Download, 
    Send, 
    CheckCircle2,
    ArrowUpRight,
    ArrowDownRight,
} from "lucide-react"
import { StatCard, StatCardGrid } from "@/components/ui/stat-card"
import { IconButton, IconButtonGroup } from "@/components/ui/icon-button"
import { 
    DataTable, 
    DataTableHeader, 
    DataTableHeaderCell, 
    DataTableBody, 
    DataTableRow, 
    DataTableCell 
} from "@/components/ui/data-table"
import { SectionCard } from "@/components/ui/section-card"
import { AppStatusBadge } from "@/components/ui/status-badge"
import { MomsWizardDialog } from "./ai-wizard-dialog"
import { termExplanations, vatPeriods } from "./constants"

export function MomsdeklarationContent() {
    const [showAIDialog, setShowAIDialog] = useState(false)

    return (
        <main className="flex-1 flex flex-col p-6">
            <div className="max-w-6xl w-full space-y-6">
                <StatCardGrid columns={3}>
                    <StatCard
                        label="Nästa deklaration"
                        value="Q4 2024"
                        subtitle="Deadline: 12 feb 2025"
                        icon={Calendar}
                        tooltip={termExplanations["Momsdeklaration"]}
                    />
                    <StatCard
                        label="Moms att betala"
                        value="80 000 kr"
                        subtitle="Utgående: 125 000 kr"
                        icon={Wallet}
                        tooltip={termExplanations["Moms att betala"]}
                    />
                    <StatCard
                        label="Ingående moms"
                        value="45 000 kr"
                        subtitle="Avdragsgill"
                        icon={TrendingUp}
                        tooltip={termExplanations["Ingående moms"]}
                    />
                </StatCardGrid>

                {/* Section Separator */}
                <div className="border-b-2 border-border/60" />

                <SectionCard
                    icon={Bot}
                    title="AI-momsdeklaration"
                    description="Beräknas automatiskt från bokföringens momskonton (2610, 2640)."
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

                <MomsWizardDialog 
                    open={showAIDialog} 
                    onOpenChange={setShowAIDialog} 
                />

                <DataTable title="Momsperioder">
                    <DataTableHeader>
                        <DataTableHeaderCell label="Period" icon={Calendar} />
                        <DataTableHeaderCell label="Deadline" icon={Clock} />
                        <DataTableHeaderCell label="Utgående moms" icon={ArrowUpRight} />
                        <DataTableHeaderCell label="Ingående moms" icon={ArrowDownRight} />
                        <DataTableHeaderCell label="Att betala" icon={Wallet} />
                        <DataTableHeaderCell label="Status" icon={CheckCircle2} />
                        <DataTableHeaderCell label="" />
                    </DataTableHeader>
                    <DataTableBody>
                        {vatPeriods.map((item) => (
                            <DataTableRow key={item.period}>
                                <DataTableCell bold>{item.period}</DataTableCell>
                                <DataTableCell muted>{item.dueDate}</DataTableCell>
                                <DataTableCell>{item.salesVat.toLocaleString("sv-SE")} kr</DataTableCell>
                                <DataTableCell>{item.inputVat.toLocaleString("sv-SE")} kr</DataTableCell>
                                <DataTableCell bold>{item.netVat.toLocaleString("sv-SE")} kr</DataTableCell>
                                <DataTableCell>
                                    <AppStatusBadge 
                                        status={item.status === "upcoming" ? "Kommande" : "Inskickad"} 
                                    />
                                </DataTableCell>
                                <DataTableCell>
                                    <IconButtonGroup>
                                        <IconButton icon={Download} tooltip="Ladda ner" />
                                        <IconButton 
                                            icon={Send} 
                                            tooltip={item.status === "upcoming" ? "Skicka" : "Redan inskickad"} 
                                            disabled={item.status !== "upcoming"}
                                        />
                                    </IconButtonGroup>
                                </DataTableCell>
                            </DataTableRow>
                        ))}
                    </DataTableBody>
                </DataTable>
            </div>
        </main>
    )
}
