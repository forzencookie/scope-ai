import { CheckCircle, Banknote, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { GeneralMeeting, GeneralMeetingDecision } from "@/data/ownership"

interface MeetingDetailsProps {
    meeting: GeneralMeeting
    onBookDecision: (meeting: GeneralMeeting, decision: GeneralMeetingDecision) => void
}

export function MeetingDetails({ meeting, onBookDecision }: MeetingDetailsProps) {
    return (
        <CardContent className="pt-0 border-t bg-muted/20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                
                {/* Protocol Info */}
                <div className="space-y-4">
                    <div>
                        <h4 className="text-sm font-medium mb-1">Protokollförare</h4>
                        <p className="text-sm text-muted-foreground">{meeting.secretary}</p>
                    </div>
                    <div>
                        <h4 className="text-sm font-medium mb-1">Justerare</h4>
                        <p className="text-sm text-muted-foreground">Ej angivet</p>
                    </div>
                </div>

                {/* Decisions List */}
                <div className="space-y-3">
                     <h4 className="text-sm font-medium">Beslut</h4>
                     {meeting.decisions.map((decision, index) => (
                        <div
                            key={decision.id || index}
                            className={cn(
                                "flex flex-col sm:flex-row sm:items-start justify-between gap-3 p-3 rounded-lg border",
                                decision.booked ? "bg-green-50 border-green-100" : "bg-muted/50 border-border"
                            )}
                        >
                            <div className="flex items-start gap-3">
                                <span className="text-muted-foreground font-mono text-sm mt-0.5">
                                    §{index + 1}
                                </span>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium text-sm">{decision.title}</p>
                                        {decision.booked && (
                                            <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium flex items-center gap-1">
                                                <CheckCircle className="h-3 w-3" />
                                                Bokförd
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground">{decision.decision}</p>
                                    {decision.amount && (
                                        <p className="text-sm font-medium mt-1">
                                            Belopp: {decision.amount.toLocaleString('sv-SE')} kr
                                        </p>
                                    )}
                                </div>
                            </div>

                            {decision.type === 'dividend' && decision.amount && !decision.booked && meeting.status === 'protokoll signerat' && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="shrink-0"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onBookDecision(meeting, decision)
                                    }}
                                >
                                    <Banknote className="h-3.5 w-3.5 mr-2 text-green-600" />
                                    Bokför utdelning
                                </Button>
                            )}
                        </div>
                     ))}
                </div>
            </div>

            {/* Pending AI info */}
             {meeting.status === 'kallad' && (
                <Card className="bg-muted/50 mt-6">
                    <CardContent className="pt-4">
                        <div className="flex items-start gap-2">
                            <Sparkles className="h-4 w-4 mt-0.5 text-primary" />
                            <div className="text-sm">
                                <p className="font-medium">AI-assistans tillgänglig</p>
                                <p className="text-muted-foreground">
                                    När stämman genomförts kan AI hjälpa till att generera protokoll
                                    baserat på dagordningen och fattade beslut.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </CardContent>
    )
}
