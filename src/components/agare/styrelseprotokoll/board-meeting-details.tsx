import { formatDateLong } from "@/lib/utils"
import {
  Calendar,
  Users,
  MapPin,
  User,
  X,
  Clock,
  CheckCircle2,
  AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { AppStatusBadge } from "@/components/ui/status-badge"
import { getBoardMeetingStatusLabel } from "@/lib/meeting-utils"
import { type BoardMeeting } from "@/types/board-meeting"

interface BoardMeetingDetailsProps {
  meeting: BoardMeeting | null
  open: boolean
  onClose: () => void
}

export function BoardMeetingDetails({ meeting, open, onClose }: BoardMeetingDetailsProps) {
  if (!meeting) return null

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-xl w-full p-0 flex flex-col gap-0">
        <SheetHeader className="p-6 pb-4 border-b">
          <div className="flex items-center justify-between mb-2">
            <Badge variant="outline">Möte #{meeting.meetingNumber}</Badge>
            <AppStatusBadge status={getBoardMeetingStatusLabel(meeting.status)} />
          </div>
          <SheetTitle className="text-2xl">Styrelsemöte</SheetTitle>
          <SheetDescription className="flex items-center gap-4 mt-2">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {formatDateLong(meeting.date)}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              {meeting.location}
            </span>
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-8">
            {/* Attendees Section */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Närvaro
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <p className="font-medium text-xs text-muted-foreground uppercase tracking-wider">Närvarande</p>
                  <ul className="space-y-1">
                    {meeting.attendees.map((person, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <User className="h-3 w-3 text-muted-foreground" />
                        {person}
                      </li>
                    ))}
                  </ul>
                </div>
                {meeting.absentees && meeting.absentees.length > 0 && (
                   <div className="space-y-2">
                    <p className="font-medium text-xs text-muted-foreground uppercase tracking-wider">Frånvarande</p>
                    <ul className="space-y-1">
                      {meeting.absentees.map((person, i) => (
                        <li key={i} className="flex items-center gap-2 text-muted-foreground">
                          <X className="h-3 w-3" />
                          {person}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Roles Section */}
            <div className="grid grid-cols-2 gap-4 text-sm">
               <div>
                 <p className="font-medium text-xs text-muted-foreground uppercase tracking-wider mb-1">Ordförande</p>
                 <p className="font-medium">{meeting.chairperson}</p>
               </div>
               <div>
                 <p className="font-medium text-xs text-muted-foreground uppercase tracking-wider mb-1">Sekreterare</p>
                 <p className="font-medium">{meeting.secretary}</p>
               </div>
            </div>

            <Separator />

            {/* Agenda/Protocol Section */}
            <div>
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Dagordning & Beslut
              </h4>
              <div className="space-y-4">
                {meeting.agendaItems.map((item) => (
                  <div key={item.id} className="relative pl-6 pb-2 border-l-2 border-muted hover:border-primary/50 transition-colors">
                    <div className="absolute -left-[5px] top-0.5 h-2.5 w-2.5 rounded-full bg-muted border-2 border-background ring-1 ring-muted-foreground/20" />
                    
                    <div className="flex items-start justify-between gap-4">
                       <h5 className="font-medium text-sm">
                         <span className="text-muted-foreground mr-2">§{item.number}</span>
                         {item.title}
                       </h5>
                       {item.responsible && (
                         <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                           {item.responsible}
                         </Badge>
                       )}
                    </div>
                    
                    {item.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {item.description}
                      </p>
                    )}

                    {item.decision && (
                      <div className="mt-3 p-3 bg-green-50/50 dark:bg-green-900/10 rounded-md border border-green-100 dark:border-green-900/20">
                        <div className="flex items-start gap-2">
                           <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                           <div className="space-y-1">
                             <p className="text-xs font-semibold text-green-700 dark:text-green-400">Beslut</p>
                             <p className="text-sm">{item.decision}</p>
                           </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="p-4 border-t bg-muted/10">
           <div className="flex gap-2 justify-end">
             <Button variant="outline" onClick={onClose}>Stäng</Button>
             {meeting.status === 'planerad' ? (
                <Button>Starta möte</Button>
             ) : (
                <Button>
                   <AlertCircle className="h-4 w-4 mr-2" />
                   Rapportera fel
                </Button>
             )}
           </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
