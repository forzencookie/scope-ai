import { Button } from "@/components/ui/button"
import { formatDateLong } from "@/lib/utils"

interface UpcomingAlertProps {
    stats: {
        daysUntilNext: number | null
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        nextMeeting: any | null
    }
}

export function UpcomingAlert({ stats }: UpcomingAlertProps) {
    if (stats.daysUntilNext === null || stats.daysUntilNext > 14 || !stats.nextMeeting) {
        return null
    }

    const meetingLabel = stats.nextMeeting.meetingCategory === 'styrelsemote'
        ? 'styrelsemöte'
        : stats.nextMeeting.type === 'ordinarie' ? 'ordinarie årsstämma' : 'extra bolagsstämma'

    return (
        <div className="flex items-center justify-between gap-4 rounded-lg bg-blue-50 dark:bg-blue-900/10 px-4 py-3">
            <div>
                <p className="font-medium text-sm text-blue-900 dark:text-blue-100">
                    Snart dags för {meetingLabel}
                </p>
                <p className="text-sm text-blue-700/80 dark:text-blue-200/70 mt-0.5">
                    Det är {stats.daysUntilNext} dagar kvar till {meetingLabel} ({formatDateLong(stats.nextMeeting.date)}).
                    <br />
                    Se till att dagordning och underlag är redo.
                </p>
            </div>
            <Button variant="ghost" size="sm" className="shrink-0 text-blue-600 hover:bg-blue-600/20 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-400/20">
                Förbered nu
            </Button>
        </div>
    )
}
