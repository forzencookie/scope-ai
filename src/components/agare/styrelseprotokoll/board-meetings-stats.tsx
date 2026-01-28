import { formatDateLong } from "@/lib/utils"
import {
  Calendar,
  MapPin,
  FileCheck,
  ChevronRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AppStatusBadge } from "@/components/ui/status-badge"
import { getBoardMeetingStatusLabel } from "@/lib/meeting-utils"
import { type BoardMeeting } from "@/types/board-meeting"

interface BoardMeetingsStatsProps {
  heroData: { meeting: BoardMeeting; label: string } | null
  onClick: (meeting: BoardMeeting) => void
}

export function BoardMeetingsStats({ heroData, onClick }: BoardMeetingsStatsProps) {
  const meeting = heroData?.meeting

  return (
    <Card className="h-full bg-muted/20 border-border hover:bg-muted/30 transition-colors">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <Badge variant="outline" className="mb-2 bg-background">
              {heroData?.label || 'Översikt'}
            </Badge>
            <CardTitle className="text-3xl font-bold tracking-tight">
              {meeting ? `Styrelsemöte #${meeting.meetingNumber}` : 'Nästa möte'}
            </CardTitle>
            <CardDescription className="text-base mt-2">
              {meeting ? (
                <span className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    {formatDateLong(meeting.date)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    {meeting.location}
                  </span>
                </span>
              ) : (
                "Planera ditt första styrelsemöte för att komma igång."
              )}
            </CardDescription>
          </div>
          {meeting && (
             
            <AppStatusBadge status={getBoardMeetingStatusLabel(meeting.status)} />
          )}
        </div>
      </CardHeader>
      <CardContent>
        {meeting ? (
          <div className="space-y-6">
            <div className="flex gap-8">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Beslutade punkter</p>
                <p className="text-2xl font-bold">
                  {meeting.agendaItems.filter(i => i.decision).length}
                  <span className="text-base font-normal text-muted-foreground ml-1">
                    av {meeting.agendaItems.length}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Närvarande</p>
                <p className="text-2xl font-bold">
                  {meeting.attendees.length}
                  <span className="text-base font-normal text-muted-foreground ml-1">ledamöter</span>
                </p>
              </div>
            </div>
            
            <div className="pt-2">
              <Button onClick={() => onClick(meeting)} className="w-full gap-2">
                {meeting.status === 'planerad' ? (
                  <>Öppna mötesverktyg <ChevronRight className="h-4 w-4" /></>
                ) : (
                  <>Visa protokoll <FileCheck className="h-4 w-4" /></>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center h-full">
            <p className="text-muted-foreground">Inga möten skapade ännu.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
