"use client"

import { useState } from "react"
import { 
    Calendar, 
    Building2, 
    Clock, 
    Bot, 
    Download, 
    Send,
    FileText,
} from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { StatCard, StatCardGrid } from "@/components/ui/stat-card"
import { IconButton } from "@/components/ui/icon-button"
import { 
    DataTable, 
    DataTableBody, 
    DataTableRow, 
    DataTableCell 
} from "@/components/ui/data-table"
import { SectionCard } from "@/components/ui/section-card"
import { AppStatusBadge } from "@/components/ui/status-badge"
import { ArsredovisningWizardDialog } from "./ai-wizard-dialog"
import { reportSections } from "./constants"

export function ArsredovisningContent() {
    const [showBankIdDialog, setShowBankIdDialog] = useState(false)
    const [showAIDialog, setShowAIDialog] = useState(false)

    return (
        <main className="flex-1 flex flex-col p-6">
            <div className="max-w-6xl w-full space-y-6">
                <StatCardGrid columns={3}>
                    <StatCard
                        label="Räkenskapsår"
                        value="2024"
                        subtitle="2024-01-01 – 2024-12-31"
                        icon={Calendar}
                    />
                    <StatCard
                        label="Bolagsform"
                        value="Aktiebolag (AB)"
                        subtitle="K2-regelverk"
                        icon={Building2}
                    />
                    <StatCard
                        label="Status"
                        value="Under arbete"
                        subtitle="Deadline: 30 jun 2025"
                        icon={Clock}
                    />
                </StatCardGrid>

                {/* Section Separator */}
                <div className="border-b-2 border-border/60" />

                <SectionCard
                    icon={Bot}
                    title="AI-årsredovisning"
                    description="Genereras automatiskt från bokföringen enligt K2."
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

                <ArsredovisningWizardDialog 
                    open={showAIDialog} 
                    onOpenChange={setShowAIDialog} 
                />

                <DataTable 
                    title="Delar av årsredovisningen"
                    headerActions={
                        <div className="flex items-center gap-2">
                            <IconButton icon={Download} label="Ladda ner PDF" showLabel />
                            <button
                                onClick={() => setShowBankIdDialog(true)}
                                className="px-4 py-2 rounded-lg font-medium flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm"
                            >
                                <Send className="h-4 w-4" />
                                Skicka till Bolagsverket
                            </button>
                        </div>
                    }
                >
                    <DataTableBody>
                        {reportSections.map((section) => (
                            <DataTableRow key={section.name}>
                                <DataTableCell>
                                    <div className="flex items-center gap-3">
                                        <FileText className="h-5 w-5 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm font-medium">{section.name}</p>
                                            <p className="text-sm text-muted-foreground">{section.description}</p>
                                        </div>
                                    </div>
                                </DataTableCell>
                                <DataTableCell align="right">
                                    <AppStatusBadge 
                                        status={section.status === "complete" ? "Klar" : section.status === "incomplete" ? "Ofullständig" : "Väntar"} 
                                        size="md"
                                    />
                                </DataTableCell>
                            </DataTableRow>
                        ))}
                    </DataTableBody>
                </DataTable>

                {/* BankID Signing Dialog */}
                <Dialog open={showBankIdDialog} onOpenChange={setShowBankIdDialog}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Skicka årsredovisning till Bolagsverket</DialogTitle>
                            <DialogDescription>
                                Du är på väg att skicka in årsredovisningen för räkenskapsåret 2024.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Bolag</span>
                                    <span className="font-medium">Mitt Företag AB</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Org.nr</span>
                                    <span className="font-medium">559123-4567</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Räkenskapsår</span>
                                    <span className="font-medium">2024-01-01 – 2024-12-31</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Regelverk</span>
                                    <span className="font-medium">K2</span>
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Genom att signera bekräftar du att uppgifterna i årsredovisningen är korrekta och att du har behörighet att företräda bolaget.
                            </p>
                        </div>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => setShowBankIdDialog(false)}
                                className="w-full px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2 bg-[#183E4F] text-white hover:bg-[#183E4F]/90 transition-colors"
                            >
                                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                </svg>
                                Signera med BankID
                            </button>
                            <button
                                onClick={() => setShowBankIdDialog(false)}
                                className="w-full px-4 py-2 rounded-lg font-medium text-muted-foreground hover:bg-muted/50 transition-colors text-sm"
                            >
                                Avbryt
                            </button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </main>
    )
}
