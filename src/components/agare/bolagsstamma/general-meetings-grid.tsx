import { GeneralMeeting, GeneralMeetingDecision } from "@/types/ownership"
import { MeetingCard } from "./meeting-card"
import { MeetingDetails } from "./meeting-details"
import { Vote } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface GeneralMeetingsGridProps {
    meetings: GeneralMeeting[]
    expandedId: string | null
    onToggleExpand: (id: string) => void
    onBookDecision: (meeting: GeneralMeeting, decision: GeneralMeetingDecision) => void
    searchQuery: string
}

export function GeneralMeetingsGrid({ meetings, expandedId, onToggleExpand, onBookDecision, searchQuery }: GeneralMeetingsGridProps) {
    if (meetings.length === 0) {
        return (
            <Card className="py-12 border-dashed">
              <CardContent className="text-center">
                <Vote className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Inga bolagsstämmor</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery ? 'Inga stämmor matchade din sökning' : 'Planera din första bolagsstämma'}
                </p>
              </CardContent>
            </Card>
        )
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {meetings.map((meeting) => (
                <MeetingCard 
                   key={meeting.id} 
                   meeting={meeting} 
                   isExpanded={expandedId === meeting.id}
                   onToggleExpand={() => onToggleExpand(meeting.id)}
                >
                    <MeetingDetails 
                        meeting={meeting} 
                        onBookDecision={onBookDecision} 
                    />
                </MeetingCard>
            ))}
        </div>
    )
}
