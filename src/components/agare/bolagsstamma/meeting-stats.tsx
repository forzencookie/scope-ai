import { Calendar, CheckCircle, Gavel, Clock } from "lucide-react"
import { StatCard, StatCardGrid } from "@/components/ui/stat-card"
import { formatDateLong } from "@/lib/utils"

interface MeetingStatsProps {
    stats: {
        planerade?: number
        upcoming: number
        completed: number
        totalDecisions: number
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        nextMeeting: any | null // Using any loosely here to match the flexible structure passed
        daysUntilNext: number | null
    }
}

export function MeetingStats({ stats }: MeetingStatsProps) {
    // Total upcoming = planerade + kallad
    const totalUpcoming = (stats.planerade || 0) + stats.upcoming
    
    return (
        <StatCardGrid columns={4}>
            <StatCard
                label="Kommande möten"
                value={totalUpcoming}
                headerIcon={Calendar}
                subtitle={stats.planerade ? `${stats.planerade} planerade, ${stats.upcoming} kallade` : "Planerade möten"}
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
                label="Nästa möte"
                value={stats.daysUntilNext !== null ? `${stats.daysUntilNext} dagar` : "Inget planerat"}
                headerIcon={Clock}
                subtitle={stats.nextMeeting
                    ? `Datum: ${formatDateLong(stats.nextMeeting.date || "")}`
                    : "Planera ett möte"}
                change={stats.daysUntilNext !== null && stats.daysUntilNext < 14 ? "Snart dags" : undefined}
                changeType={stats.daysUntilNext !== null && stats.daysUntilNext < 14 ? "negative" : "neutral"}
            />
        </StatCardGrid>
    )
}

// Separate component for the "Nästa stämma" card to be used in a different layout
export function NextMeetingCard({ stats }: MeetingStatsProps) {
    return (
        <StatCard
            label="Nästa möte"
            value={stats.daysUntilNext !== null ? `${stats.daysUntilNext} dagar` : "Inget planerat"}
            headerIcon={Clock}
            subtitle={stats.nextMeeting
                ? `Datum: ${formatDateLong(stats.nextMeeting.date || "")}`
                : "Planera ett möte"}
            change={stats.daysUntilNext !== null && stats.daysUntilNext < 14 ? "Snart dags" : undefined}
            changeType={stats.daysUntilNext !== null && stats.daysUntilNext < 14 ? "negative" : "neutral"}
        />
    )
}
