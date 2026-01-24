import { Calendar, CheckCircle, Gavel, Clock } from "lucide-react"
import { StatCard, StatCardGrid } from "@/components/ui/stat-card"
import { formatDateLong } from "@/lib/utils"

interface MeetingStatsProps {
    stats: {
        upcoming: number
        completed: number
        totalDecisions: number
        nextMeeting: any | null // Using any loosely here to match the flexible structure passed
        daysUntilNext: number | null
    }
}

export function MeetingStats({ stats }: MeetingStatsProps) {
    return (
        <StatCardGrid>
            <StatCard
                label="Kommande stämmor"
                value={stats.upcoming}
                headerIcon={Calendar}
                subtitle="Planerade möten"
            />
            <StatCard
                label="Genomförda"
                value={stats.completed}
                headerIcon={CheckCircle}
                subtitle="Signerade protokoll"
            />
            <StatCard
                label="Beslut totalt"
                value={stats.totalDecisions}
                headerIcon={Gavel}
                subtitle="Fattade beslut i år"
            />
            <StatCard
                label="Nästa stämma"
                value={stats.daysUntilNext !== null ? `${stats.daysUntilNext} dagar` : "Ingen planerad"}
                headerIcon={Clock}
                subtitle={stats.nextMeeting
                    ? `Datum: ${formatDateLong(stats.nextMeeting.date || "")}`
                    : "Kalla till stämma"}
                change={stats.daysUntilNext !== null && stats.daysUntilNext < 14 ? "Snart dags" : undefined}
                changeType={stats.daysUntilNext !== null && stats.daysUntilNext < 14 ? "negative" : "neutral"}
            />
        </StatCardGrid>
    )
}
