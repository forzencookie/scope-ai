import { ChevronDown, Calendar, Users, MoreHorizontal, Download, CheckCircle, Send, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn, formatDateLong } from "@/lib/utils"
import { AppStatusBadge } from "@/components/ui/status-badge"
import { getBoardMeetingStatusLabel } from "@/lib/meeting-utils"
import { type BoardMeeting } from "@/types/board-meeting"

const getMeetingTypeLabel = (type: BoardMeeting['type']) => {
   switch (type) {
      case 'ordinarie': return 'Ordinarie'
      case 'extra': return 'Extra'
      case 'konstituerande': return 'Konstituerande'
   }
   return type
}

interface BoardMeetingsGridProps {
  years: number[]
  meetingsByYear: Record<number, BoardMeeting[]>
  collapsedYears: Set<number>
  onToggleYear: (year: number) => void
  onSelectMeeting: (meeting: BoardMeeting) => void
  onGenerateAI: (meeting: BoardMeeting) => void
}

export function BoardMeetingsGrid({
  years,
  meetingsByYear,
  collapsedYears,
  onToggleYear,
  onSelectMeeting,
  onGenerateAI
}: BoardMeetingsGridProps) {

  return (
    <div className="space-y-4">
      {years.map(year => (
        <Collapsible
          key={year}
          open={!collapsedYears.has(year)}
          onOpenChange={() => onToggleYear(year)}
          className="space-y-2"
        >
          <div className="flex items-center gap-2">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="p-0 h-auto hover:bg-transparent">
                <ChevronDown className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  collapsedYears.has(year) && "-rotate-90"
                )} />
                <span className="font-semibold text-lg ml-2">{year}</span>
              </Button>
            </CollapsibleTrigger>
            <div className="h-px flex-1 bg-border/60" />
            <span className="text-xs text-muted-foreground">{meetingsByYear[year].length} möten</span>
          </div>

          <CollapsibleContent>
             <div className="grid gap-3">
               {meetingsByYear[year].map(meeting => (
                 <Card
                   key={meeting.id}
                   className="hover:border-primary/50 transition-colors cursor-pointer"
                   onClick={() => onSelectMeeting(meeting)}
                 >
                   <CardHeader className="p-4">
                     <div className="flex items-start justify-between gap-4">
                       <div className="space-y-1">
                         <div className="flex items-center gap-2">
                           <span className="font-semibold">Styrelsemöte #{meeting.meetingNumber}</span>
                           <Badge variant="outline" className="text-xs font-normal">
                             {getMeetingTypeLabel(meeting.type)}
                           </Badge>
                         </div>
                         <div className="flex items-center gap-4 text-sm text-muted-foreground">
                           <span className="flex items-center gap-1">
                             <Calendar className="h-3 w-3" />
                             {formatDateLong(meeting.date)}
                           </span>
                           <span className="flex items-center gap-1">
                             <Users className="h-3 w-3" />
                             {meeting.attendees.length} närvarande
                           </span>
                         </div>
                       </div>

                       <div className="flex items-center gap-2">
                         <AppStatusBadge status={getBoardMeetingStatusLabel(meeting.status)} />
                         <DropdownMenu>
                           <DropdownMenuTrigger asChild>
                             <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                               <MoreHorizontal className="h-4 w-4" />
                             </Button>
                           </DropdownMenuTrigger>
                           <DropdownMenuContent align="end">
                             <DropdownMenuItem onClick={() => onSelectMeeting(meeting)}>
                               Visa detaljer
                             </DropdownMenuItem>
                             <DropdownMenuSeparator />
                             <DropdownMenuItem>
                               <Download className="h-4 w-4 mr-2" />
                               Ladda ned PDF
                             </DropdownMenuItem>
                             {meeting.status === 'genomförd' && (
                               <>
                                 <DropdownMenuItem>
                                   <CheckCircle className="h-4 w-4 mr-2" />
                                   Signera protokoll
                                 </DropdownMenuItem>
                                 <DropdownMenuItem onClick={() => onGenerateAI(meeting)}>
                                   <Sparkles className="h-4 w-4 mr-2" />
                                   Generera med AI
                                 </DropdownMenuItem>
                               </>
                             )}
                             {meeting.status === 'protokoll signerat' && (
                               <DropdownMenuItem>
                                 <Send className="h-4 w-4 mr-2" />
                                 Dela protokoll
                               </DropdownMenuItem>
                             )}
                           </DropdownMenuContent>
                         </DropdownMenu>
                       </div>
                     </div>
                   </CardHeader>
                   <CardContent className="p-4 pt-0">
                     {/* Show a preview of decisions if any exist */}
                     {meeting.agendaItems.some(i => i.decision) && (
                       <div className="mt-2 p-3 bg-muted/30 rounded-lg text-sm">
                         <p className="font-medium text-xs text-muted-foreground mb-2">Viktiga beslut:</p>
                         <ul className="space-y-1">
                           {meeting.agendaItems
                             .filter(i => i.decision)
                             .slice(0, 2)
                             .map((item, idx) => (
                               <li key={idx} className="flex gap-2">
                                 <span className="text-muted-foreground">•</span>
                                 <span className="line-clamp-1">{item.title}</span>
                               </li>
                             ))}
                           {meeting.agendaItems.filter(i => i.decision).length > 2 && (
                             <li className="text-xs text-muted-foreground pl-3">
                               + {meeting.agendaItems.filter(i => i.decision).length - 2} till
                             </li>
                           )}
                         </ul>
                       </div>
                     )}
                   </CardContent>
                 </Card>
               ))}
             </div>
          </CollapsibleContent>
        </Collapsible>
      ))}
    </div>
  )
}
