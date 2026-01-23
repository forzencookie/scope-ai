import { formatDateLong, formatDate } from "@/lib/utils"
import {
  Calendar,
  Users,
  Sparkles,
  MapPin,
  User,
  Gavel,
  MessageSquare,
  HandHeart,
  UserCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { type AnnualMeeting, Motion } from "@/types/meeting"

interface MeetingDetailsProps {
  meeting: AnnualMeeting
  onClose: () => void
}

export function MeetingDetails({ meeting, onClose }: MeetingDetailsProps) {

  const getMotionStatusBadge = (status: Motion['status']) => {
    switch (status) {
      case 'mottagen':
        return <Badge variant="outline">Mottagen</Badge>
      case 'behandlad':
        return <Badge variant="secondary">Behandlad</Badge>
      case 'godkänd':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Godkänd</Badge>
      case 'avslagen':
        return <Badge variant="destructive">Avslagen</Badge>
    }
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <HandHeart className="h-5 w-5 text-rose-600" />
              {meeting.type === 'ordinarie' ? 'Ordinarie årsmöte' : 'Extra årsmöte'} {meeting.year}
            </CardTitle>
            <CardDescription className="flex items-center gap-4 mt-1">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDateLong(meeting.date)}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {meeting.location}
              </span>
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Stäng
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Meeting details */}
          {(meeting.chairperson || meeting.secretary) && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Ordförande:</span>
                <span className="font-medium">{meeting.chairperson || 'Ej vald'}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Sekreterare:</span>
                <span className="font-medium">{meeting.secretary || 'Ej vald'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Närvarande:</span>
                <span className="font-medium">{meeting.attendeesCount || 0} st</span>
              </div>
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Röstande:</span>
                <span className="font-medium">{(meeting as any).votingMembersCount || meeting.attendeesCount || 0} st</span>
              </div>
            </div>
          )}

          {/* Motions */}
          {(meeting.motions || []).length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Motioner ({meeting.motions.length} st)
              </h4>
              <div className="space-y-2">
                {meeting.motions.map((motion: Motion) => (
                  <div
                    key={motion.id}
                    className="p-3 bg-muted/50 rounded-lg space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm">{motion.title}</p>
                        <p className="text-xs text-muted-foreground">
                          Inlämnad av {motion.submittedBy} • {formatDate(motion.submittedDate)}
                        </p>
                      </div>
                      {getMotionStatusBadge(motion.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">{motion.description}</p>
                    {motion.boardResponse && (
                      <div className="pt-2 border-t">
                        <p className="text-xs font-medium text-muted-foreground">Styrelsens yttrande:</p>
                        <p className="text-sm">{motion.boardResponse}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Decisions */}
          {(meeting.decisions || []).length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Gavel className="h-4 w-4" />
                Beslut ({meeting.decisions.length} st)
              </h4>
              <div className="space-y-2">
                {meeting.decisions.map((decision: any, index: number) => (
                  <div
                    key={decision.id}
                    className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
                  >
                    <span className="text-muted-foreground font-mono text-sm">
                      §{index + 1}
                    </span>
                    <div className="space-y-1 flex-1">
                      <p className="font-medium text-sm">{decision.title}</p>
                      <p className="text-sm text-muted-foreground">{decision.decision}</p>
                      {decision.votingResult && (
                        <div className="flex gap-3 text-xs pt-1">
                          <span className="text-green-600 dark:text-green-500/70">
                            För: {decision.votingResult.for}
                          </span>
                          <span className="text-red-600 dark:text-red-500/70">
                            Emot: {decision.votingResult.against}
                          </span>
                          <span className="text-muted-foreground">
                            Avstod: {decision.votingResult.abstained}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pending meeting info */}
          {(meeting.status === 'planerad' || meeting.status === 'kallad') && (
            <Card className="bg-purple-50/50 dark:bg-purple-950/20 border-0">
              <CardContent className="pt-4">
                <div className="flex items-start gap-2">
                  <Sparkles className="h-4 w-4 mt-0.5 text-purple-600" />
                  <div className="text-sm">
                    <p className="font-medium">AI-assistans tillgänglig</p>
                    <p className="text-muted-foreground">
                      När årsmötet genomförts kan AI hjälpa till att generera protokoll
                      baserat på dagordningen, motioner och fattade beslut.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
