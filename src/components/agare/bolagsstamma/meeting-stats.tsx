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
                title="Kommande stämmor"
                value={stats.upcoming}
                icon={Calendar}
                description="Planerade möten"
            />
            <StatCard
                title="Genomförda"
                value={stats.completed}
                icon={CheckCircle}
                description="Signerade protokoll"
            />
            <StatCard
                title="Beslut totalt"
                value={stats.totalDecisions}
                icon={Gavel}
                description="Fattade beslut i år"
            />
            <StatCard
                title="Nästa stämma"
                value={stats.daysUntilNext !== null ? `${stats.daysUntilNext} dagar` : "Ingen planerad"}
                icon={Clock}
                description={stats.nextMeeting
                    ? `Datum: ${formatDateLong(stats.nextMeeting.date || "")}`
                    : "Kalla till stämma"}
                trend={stats.daysUntilNext !== null && stats.daysUntilNext < 14 ? "down" : "neutral"}
                trendLabel={stats.daysUntilNext !== null && stats.daysUntilNext < 14 ? "Snart dags" : ""}
            />
        </StatCardGrid>
    )
}
