import { Users, FileText, Send, CheckCircle, Download, MoreHorizontal, MapPin, User, Scale } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AppStatusBadge } from "@/components/ui/status-badge"
import { formatDateLong, cn } from "@/lib/utils"
import { type GeneralMeeting } from "@/data/ownership"
import { type MeetingStatus } from "@/lib/status-types"

const mapMeetingStatus = (status: GeneralMeeting['status']): MeetingStatus => {
    switch (status) {
        case 'kallad': return 'Kallad'
        case 'genomförd': return 'Genomförd'
        case 'protokoll signerat': return 'Signerat'
        default: return 'Planerad'
    }
}

interface MeetingCardProps {
    meeting: GeneralMeeting
    isExpanded: boolean
    onToggleExpand: () => void
    children?: React.ReactNode
}

export function MeetingCard({ meeting, isExpanded, onToggleExpand, children }: MeetingCardProps) {
    return (
        <Card 
            className={cn(
                "hover:shadow-md transition-all cursor-pointer transition-all duration-200", 
                isExpanded ? "ring-2 ring-primary" : "hover:border-primary/50"
            )}
            onClick={onToggleExpand}
        >
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <AppStatusBadge status={mapMeetingStatus(meeting.status)} />
                        <CardTitle className="text-lg mt-2 flex items-center gap-2">
                            {meeting.type === 'ordinarie' ? 'Årsstämma' : 'Extra Bolagsstämma'} {meeting.year}
                        </CardTitle>
                        <CardDescription>{formatDateLong(meeting.date)}</CardDescription>
                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation()
                                    onToggleExpand()
                                }}>
                                    <FileText className="mr-2 h-4 w-4" />
                                    Visa protokoll
                                </DropdownMenuItem>
                                {meeting.status === 'kallad' && (
                                    <DropdownMenuItem>
                                        <Send className="mr-2 h-4 w-4" />
                                        Skicka kallelse
                                    </DropdownMenuItem>
                                )}
                                {meeting.status !== 'protokoll signerat' && meeting.status !== 'genomförd' && (
                                    <DropdownMenuItem>
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Signera digitalt
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                    <Download className="mr-2 h-4 w-4" />
                                    Ladda ner PDF
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid gap-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{meeting.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{meeting.attendeesCount} deltagare ({meeting.sharesRepresented} aktier)</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span>Ordf: {meeting.chairperson}</span>
                    </div>
                    
                    {!isExpanded && meeting.decisions && meeting.decisions.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                            <div className="flex items-center gap-2 mb-2 font-medium">
                                <Scale className="h-4 w-4" />
                                <span>Viktiga beslut ({meeting.decisions.length})</span>
                            </div>
                            <ul className="list-disc list-inside text-muted-foreground space-y-1">
                                {meeting.decisions.slice(0, 2).map((d, i) => (
                                    <li key={i} className="truncate">{d.title}</li>
                                ))}
                                {meeting.decisions.length > 2 && (
                                    <li className="text-xs italic">
                                        + {meeting.decisions.length - 2} till...
                                    </li>
                                )}
                            </ul>
                        </div>
                    )}
                </div>
            </CardContent>
            {isExpanded && children}
        </Card>
    )
}
