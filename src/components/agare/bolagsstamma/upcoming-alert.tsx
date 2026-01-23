import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { formatDateLong } from "@/lib/utils"

interface UpcomingAlertProps {
    stats: {
        daysUntilNext: number | null
        nextMeeting: any | null
    }
}

export function UpcomingAlert({ stats }: UpcomingAlertProps) {
    if (stats.daysUntilNext === null || stats.daysUntilNext > 14 || !stats.nextMeeting) {
        return null
    }

    return (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-900">
            <CardContent className="pt-6 flex items-start gap-4">
                <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                <div className="flex-1">
                    <h3 className="font-medium text-orange-900 dark:text-orange-200">
                        Snart dags för bolagsstämma
                    </h3>
                    <p className="text-sm text-orange-800/80 dark:text-orange-300/80 mt-1">
                        Det är {stats.daysUntilNext} dagar kvar till {stats.nextMeeting.type === 'ordinarie' ? 'ordinarie årsstämma' : 'extra bolagsstämma'} ({formatDateLong(stats.nextMeeting.date)}).
                        Se till att dagordning och underlag är redo.
                    </p>
                </div>
                <Button variant="outline" className="border-orange-300 hover:bg-orange-100 text-orange-700">
                    Förbered nu
                </Button>
            </CardContent>
        </Card>
    )
}
