"use client"

import { format } from "date-fns"
import { sv } from "date-fns/locale"
import { Calendar, AlertCircle, CheckCircle2, ChevronRight, Sparkles } from "lucide-react"
import { ListCard, ListCardItem } from "@/components/ui/section-card"
import { AppStatusBadge } from "@/components/ui/status-badge"
import type { VatReport } from "@/services/processors/vat/types"
import { AIActionButton } from "@/components/ui/ai-action-button"

interface MomsListProps {
    periods: VatReport[]
    onSelectReport: (report: VatReport) => void
    onGenerateAI?: (report: VatReport) => void
}

export function MomsList({ periods, onSelectReport, onGenerateAI }: MomsListProps) {
    if (periods.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg text-center">
                <p className="text-muted-foreground">Inga momsperioder hittades.</p>
            </div>
        )
    }

    return (
        <ListCard variant="default" className="bg-card">
            {periods.map((period) => {
                const isUpcoming = period.status === 'upcoming'
                const isOverdue = period.status === 'overdue'
                const isSubmitted = period.status === 'submitted'

                return (
                    <ListCardItem
                        key={period.period}
                        onClick={() => onSelectReport(period)}
                        className="hover:bg-accent/40 transition-colors"
                        icon={
                            <div className="h-10 w-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                                <Calendar className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                            </div>
                        }
                        trailing={
                            <div className="flex items-center gap-3">
                                {isUpcoming && onGenerateAI && (
                                    <AIActionButton
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            onGenerateAI(period)
                                        }}
                                        size="sm"
                                        className="h-8"
                                    >
                                        Generera
                                    </AIActionButton>
                                )}

                                <div className="text-right mr-2 hidden sm:block">
                                    <div className="text-sm font-medium">
                                        {period.netVat < 0
                                            ? `Att få tillbaka: ${Math.abs(period.netVat).toLocaleString('sv-SE')} kr`
                                            : `Att betala: ${period.netVat.toLocaleString('sv-SE')} kr`
                                        }
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        Deadline: {period.dueDate}
                                    </div>
                                </div>

                                <AppStatusBadge
                                    status={isSubmitted ? "Klar" : isOverdue ? "Försenad" : "Pågående"}
                                    variant={isSubmitted ? "success" : isOverdue ? "destructive" : "default"}
                                />

                                <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                            </div>
                        }
                    >
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <p className="text-base font-semibold tracking-tight">{period.period}</p>
                                {isOverdue && (
                                    <span className="flex items-center text-[10px] uppercase font-bold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">
                                        <AlertCircle className="h-3 w-3 mr-1" />
                                        Försenad
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {period.status === 'submitted'
                                    ? "Deklarationen är inskickad och låst."
                                    : "Öppen för periodisering och bokföring."}
                            </p>
                        </div>
                    </ListCardItem>
                )
            })}
        </ListCard>
    )
}
