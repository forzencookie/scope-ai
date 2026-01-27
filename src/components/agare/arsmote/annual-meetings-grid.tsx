import { formatDateLong, cn } from "@/lib/utils"
import {
  Calendar,
  Users,
  MessageSquare,
  Gavel,
  HandHeart,
  MapPin,
  MoreHorizontal,
  Download,
  Send,
  CheckCircle,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  GridTableHeader,
  GridTableRow,
  GridTableRows,
} from "@/components/ui/grid-table"
import { AppStatusBadge } from "@/components/ui/status-badge"
import { getAnnualMeetingStatusLabel } from "@/lib/meeting-utils"
import { type AnnualMeeting } from "@/types/meeting"

interface AnnualMeetingsGridProps {
  meetings: AnnualMeeting[]
  selectedMeetingId: string | null
  onSelectMeeting: (meeting: AnnualMeeting | null) => void
  onOpenNotice: (meeting: AnnualMeeting) => void
}

export function AnnualMeetingsGrid({ 
  meetings, 
  selectedMeetingId, 
  onSelectMeeting,
  onOpenNotice 
}: AnnualMeetingsGridProps) {
  return (
    <div className="overflow-x-auto pb-4 -mx-2">
      <div className="md:min-w-[800px] px-2">
        <GridTableHeader
          minWidth="0"
          columns={[
            { label: "År", icon: Calendar, span: 1 },
            { label: "Typ", span: 2 },
            { label: "Datum & Plats", span: 3 },
            { label: "Motioner", icon: MessageSquare, span: 1 },
            { label: "Beslut", icon: Gavel, span: 1 },
            { label: "Närvarande", icon: Users, span: 1 },
            { label: "Status", span: 2 },
            { label: "", span: 1 },
          ]}
        />
        <GridTableRows>
          {meetings.map((meeting) => (
            <GridTableRow
              key={meeting.id}
              minWidth="0"
              className={cn(
                "cursor-pointer",
                selectedMeetingId === meeting.id && "bg-primary/5"
              )}
              onClick={() => onSelectMeeting(selectedMeetingId === meeting.id ? null : meeting)}
            >
              {/* År */}
              <div className="col-span-1 font-bold text-lg">
                {meeting.year}
              </div>

              {/* Typ */}
              <div className="col-span-2">
                <Badge variant={meeting.type === 'extra' ? 'secondary' : 'default'}>
                  <HandHeart className="h-3 w-3 mr-1" />
                  {meeting.type === 'ordinarie' ? 'Ordinarie' : 'Extra'}
                </Badge>
              </div>

              {/* Datum & Plats */}
              <div className="col-span-3">
                <div className="font-medium text-sm">{formatDateLong(meeting.date)}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {meeting.location || 'Ej angiven'}
                </div>
              </div>

              {/* Motioner */}
              <div className="col-span-1 tabular-nums">
                {(meeting.motions || []).length}
              </div>

              {/* Beslut */}
              <div className="col-span-1 tabular-nums">
                {(meeting.decisions || []).length}
              </div>

              {/* Närvarande */}
              <div className="col-span-1 tabular-nums">
                {meeting.attendeesCount || '-'}
              </div>

              {/* Status */}
              <div className="col-span-2">
                <AppStatusBadge status={getAnnualMeetingStatusLabel(meeting.status)} showIcon />
              </div>

              {/* Actions */}
              <div className="col-span-1 flex justify-end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Visa protokoll</DropdownMenuItem>
                    <DropdownMenuItem>Redigera</DropdownMenuItem>
                    <DropdownMenuItem>
                      <Download className="h-4 w-4 mr-2" />
                      Ladda ned PDF
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {(meeting.status === 'planerad' || meeting.status === 'kallad') && (
                      <DropdownMenuItem onClick={() => onOpenNotice(meeting)}>
                        <Send className="h-4 w-4 mr-2" />
                        Skicka kallelse
                      </DropdownMenuItem>
                    )}
                    {meeting.status === 'genomförd' && (
                      <DropdownMenuItem>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Markera som signerat
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generera AI-protokoll
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </GridTableRow>
          ))}
        </GridTableRows>
      </div>
    </div>
  )
}
