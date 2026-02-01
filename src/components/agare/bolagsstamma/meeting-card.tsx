import { Users, MapPin, User, Scale } from "lucide-react"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { AppStatusBadge } from "@/components/ui/status-badge"
import { formatDateLong } from "@/lib/utils"
import { type GeneralMeeting } from "@/types/ownership"
import { type MeetingStatus } from "@/lib/status-types"

const mapMeetingStatus = (status: GeneralMeeting['status']): MeetingStatus => {
    switch (status) {
        case 'planerad': return 'Planerad'
        case 'kallad': return 'Kallad'
        case 'genomförd': return 'Genomförd'
        case 'protokoll signerat': return 'Signerat'
        default: return 'Planerad'
    }
}

interface MeetingCardProps {
    meeting: GeneralMeeting
    onClick: () => void
}

export function MeetingCard({ meeting, onClick }: MeetingCardProps) {
    return (
        <Card 
            className="hover:shadow-md cursor-pointer transition-all duration-200 hover:border-primary/50"
            onClick={onClick}
        >
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                            <AppStatusBadge status={mapMeetingStatus(meeting.status)} />
                        <CardTitle className="text-lg mt-2 flex items-center gap-2">
                            {meeting.meetingCategory === 'styrelsemote'
                                ? `Styrelsemöte${meeting.meetingNumber ? ` #${meeting.meetingNumber}` : ''}`
                                : `${meeting.type === 'ordinarie' ? 'Årsstämma' : 'Extra Bolagsstämma'} ${meeting.year}`
                            }
                        </CardTitle>
                        <CardDescription>{formatDateLong(meeting.date)}</CardDescription>
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
                        <span>
                            {meeting.meetingCategory === 'styrelsemote'
                                ? `${meeting.attendees?.length || 0} närvarande`
                                : `${meeting.attendeesCount} deltagare (${meeting.sharesRepresented} aktier)`
                            }
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span>Ordf: {meeting.chairperson}</span>
                    </div>
                    
                    {meeting.decisions && meeting.decisions.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                            <div className="flex items-center gap-2 mb-2 font-medium">
                                <Scale className="h-4 w-4" />
                                <span>Viktiga beslut ({meeting.decisions.length})</span>
                            </div>
                            <ul className="list-disc list-inside text-muted-foreground space-y-1">
                                {meeting.decisions.slice(0, 2).map((d) => (
                                    <li key={d.id} className="truncate">{d.title}</li>
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
        </Card>
    )
}
