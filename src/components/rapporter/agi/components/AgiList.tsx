"use client"

import { Calendar, ChevronRight } from "lucide-react"
import { ListCard, ListCardItem } from "@/components/ui/section-card"
import { AppStatusBadge } from "@/components/ui/status-badge"
import { AGIReport } from "../use-employer-declaration"

interface AgiListProps {
    reports: AGIReport[]
    onSelectReport: (report: AGIReport) => void
}

export function AgiList({ reports, onSelectReport }: AgiListProps) {
    if (reports.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg text-center">
                <p className="text-muted-foreground">Inga AGI-rapporter hittades.</p>
            </div>
        )
    }

    return (
        <ListCard variant="default" className="bg-card">
            {reports.map((report) => {
                const total = report.tax + report.contributions

                return (
                    <ListCardItem
                        key={report.period}
                        onClick={() => onSelectReport(report)}
                        className="hover:bg-accent/40 transition-colors"
                        icon={
                            <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                        }
                        trailing={
                            <div className="flex items-center gap-3">
                                <div className="text-right mr-2 hidden sm:block">
                                    <div className="text-sm font-medium">
                                        {`Att betala: ${total.toLocaleString('sv-SE')} kr`}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        Deadline: {report.dueDate}
                                    </div>
                                </div>

                                <AppStatusBadge
                                    status={report.status === "submitted" ? "Inskickad" : "Kommande"}
                                />

                                <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                            </div>
                        }
                    >
                        <div className="space-y-1">
                            <p className="text-base font-semibold tracking-tight">{report.period}</p>
                            <p className="text-sm text-muted-foreground">
                                {report.employees} anställda &middot; Bruttolön: {report.totalSalary.toLocaleString('sv-SE')} kr
                            </p>
                        </div>
                    </ListCardItem>
                )
            })}
        </ListCard>
    )
}
