import { formatDateLong, cn } from "@/lib/utils"
import { HandHeart, MapPin, CheckCircle, Clock, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AppStatusBadge } from "@/components/ui/status-badge"
import { type MeetingStatus } from "@/lib/status-types"
import { type AnnualMeeting } from "@/types/meeting"

interface NextMeetingCardProps {
  nextMeeting: AnnualMeeting
  prepProgress: number
  preparationItems: Array<{ label: string; done: boolean }>
  stats: {
    votingMembersCount: number
    pendingMotions: number
    daysUntilNext: number | null
    completedCount: number
  }
  onOpenCreateDialog: () => void
}

export function NextMeetingCard({
  nextMeeting,
  prepProgress,
  preparationItems,
  stats,
  onOpenCreateDialog
}: NextMeetingCardProps) {

  const getMeetingStatusLabel = (status: AnnualMeeting['status']): MeetingStatus => {
    const labels: Record<AnnualMeeting['status'], MeetingStatus> = {
      'planerad': 'Planerad',
      'kallad': 'Kallad',
      'genomförd': 'Genomförd',
      'protokoll signerat': 'Signerat',
    }
    return labels[status]
  }

  if (!nextMeeting) {
    return (
      <div className="rounded-xl border bg-muted/20 p-6">
        <div className="text-center py-8">
          <HandHeart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Inget årsmöte planerat</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Planera ett årsmöte för att komma igång med förberedelserna.
          </p>
          <Button onClick={onOpenCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Planera årsmöte
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-muted/20 p-6">
      <div className="space-y-5">
        {/* Header with title and status */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <HandHeart className="h-4 w-4" />
              <span>Nästa årsmöte</span>
            </div>
            <h3 className="text-3xl font-bold tracking-tight">
              {formatDateLong(nextMeeting.date)}
            </h3>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{nextMeeting.location || 'Lokal ej angiven'}</span>
            </div>
          </div>
          <AppStatusBadge status={getMeetingStatusLabel(nextMeeting.status)} />
        </div>

        {/* Divider */}
        <div className="border-t border-border/50" />

        {/* Preparation Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Förberedelser</span>
            <span className="text-sm font-medium">{prepProgress}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                prepProgress === 100
                  ? "bg-green-500"
                  : prepProgress >= 60
                    ? "bg-foreground/80"
                    : "bg-amber-500"
              )}
              style={{ width: `${prepProgress}%` }}
            />
          </div>
          {/* Compact checklist */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            {preparationItems.map((item, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex items-center gap-1.5",
                  item.done ? "text-green-600 dark:text-green-500" : "text-muted-foreground"
                )}
              >
                {item.done ? (
                  <CheckCircle className="h-3.5 w-3.5" />
                ) : (
                  <Clock className="h-3.5 w-3.5" />
                )}
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border/50" />

        {/* Inline Stats */}
        <div className="flex items-center gap-8">
          <div className="text-center">
            <p className="text-2xl font-bold tabular-nums">{stats.votingMembersCount}</p>
            <p className="text-xs text-muted-foreground">Röstberättigade</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold tabular-nums">{stats.pendingMotions}</p>
            <p className="text-xs text-muted-foreground">Motioner</p>
          </div>
          {stats.daysUntilNext && stats.daysUntilNext > 0 && (
            <div className="text-center">
              <p className="text-2xl font-bold tabular-nums">{stats.daysUntilNext}</p>
              <p className="text-xs text-muted-foreground">Dagar kvar</p>
            </div>
          )}
          <div className="text-center">
            <p className="text-2xl font-bold tabular-nums">{stats.completedCount}</p>
            <p className="text-xs text-muted-foreground">Genomförda</p>
          </div>
        </div>
      </div>
    </div>
  )
}
