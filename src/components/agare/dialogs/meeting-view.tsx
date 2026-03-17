"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AppStatusBadge } from "@/components/ui/status-badge"
import {
    Calendar,
    Clock,
    MapPin,
    Download,
    CheckCircle,
    Scale,
    User,
    StickyNote,
} from "lucide-react"
import { formatDateLong } from "@/lib/utils"
import { type GeneralMeeting } from "@/types/ownership"
import { type MeetingStatus } from "@/lib/status-types"
import { useCompany } from "@/providers/company-provider"
import {
    generateAnnualMeetingNoticePDF,
    generateMeetingMinutesPDF,
    type PDFCompanyInfo,
} from "@/lib/generators/pdf-generator"
import { PageOverlay } from "@/components/shared"

// ============================================================================
// Types & Helpers
// ============================================================================

const mapMeetingStatus = (status: GeneralMeeting['status']): MeetingStatus => {
    switch (status) {
        case 'planerad': return 'Planerad'
        case 'kallad': return 'Kallad'
        case 'genomförd': return 'Genomförd'
        case 'protokoll signerat': return 'Signerat'
        default: return 'Planerad'
    }
}

interface MeetingViewOverlayProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    meeting: GeneralMeeting | null
}

function InfoItem({ label, value, icon: Icon }: { label: string, value?: string | null, icon: any }) {
    if (!value) return null
    return (
        <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Icon className="h-3.5 w-3.5" />
                {label}
            </div>
            <p className="text-sm font-semibold">{value}</p>
        </div>
    )
}

/**
 * MeetingViewOverlay - Immersive detail view for a meeting.
 * Replaces the old MeetingViewDialog.
 */
export function MeetingViewDialog({
    open,
    onOpenChange,
    meeting,
}: MeetingViewOverlayProps) {
    const { company } = useCompany()
    
    if (!meeting) return null

    const isBoard = meeting.meetingCategory === 'styrelsemote'
    const displayDate = formatDateLong(meeting.date)
    
    const companyInfo: PDFCompanyInfo = {
        name: company?.name || 'Mitt Företag AB',
        orgNumber: company?.orgNumber || '',
        address: company?.address,
        city: company?.city,
        zipCode: company?.zipCode,
    }

    const scoobyPrompt = `Jag vill titta närmare på eller ändra ${isBoard ? 'styrelsemötet' : 'stämman'} den ${meeting.date}.`

    const handleDownloadKallelse = () => {
        generateAnnualMeetingNoticePDF({
            id: meeting.id,
            year: meeting.year,
            date: meeting.date,
            location: meeting.location,
            type: meeting.type,
            agenda: meeting.agenda,
            time: meeting.time,
            kallelseText: meeting.kallelseText || '',
            chairperson: meeting.chairperson,
            secretary: meeting.secretary,
        }, companyInfo)
    }

    const handleDownloadProtokoll = () => {
        generateMeetingMinutesPDF({
            year: meeting.year,
            date: meeting.date,
            time: meeting.time,
            location: meeting.location,
            type: meeting.type,
            meetingCategory: meeting.meetingCategory,
            meetingNumber: meeting.meetingNumber,
            chairperson: meeting.chairperson,
            secretary: meeting.secretary,
            attendees: meeting.attendees,
            decisions: (meeting.decisions || []).map(d => ({
                title: d.title,
                decision: d.decision,
                amount: d.amount,
                votingResult: d.votingResult,
            })),
            protokollText: (meeting as any).protokollText || undefined,
            agenda: meeting.agenda,
        }, companyInfo)
    }

    const title = isBoard
        ? `Styrelsemöte${meeting.meetingNumber ? ` #${meeting.meetingNumber}` : ''}`
        : `${meeting.type === 'ordinarie' ? 'Årsstämma' : 'Extra Bolagsstämma'} ${meeting.year}`

    return (
        <PageOverlay
            isOpen={open}
            onClose={() => onOpenChange(false)}
            title={title}
            subtitle={`${displayDate} • ${meeting.location || 'Distans'}`}
            scoobyPrompt={scoobyPrompt}
            status={<AppStatusBadge status={mapMeetingStatus(meeting.status)} />}
            actions={
                <div className="flex gap-2">
                    {meeting.kallelseText && (
                        <Button variant="outline" size="sm" onClick={handleDownloadKallelse}>
                            <Download className="h-4 w-4 mr-2" />
                            Kallelse (PDF)
                        </Button>
                    )}
                    {(meeting.status === 'genomförd' || meeting.status === 'protokoll signerat') && (
                        <Button variant="outline" size="sm" onClick={handleDownloadProtokoll}>
                            <Download className="h-4 w-4 mr-2" />
                            Protokoll (PDF)
                        </Button>
                    )}
                </div>
            }
        >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Decisions Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <Scale className="h-4 w-4 text-muted-foreground" />
                                Beslutsprotokoll
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {meeting.decisions && meeting.decisions.length > 0 ? (
                                <div className="space-y-4">
                                    {meeting.decisions.map((decision, index) => (
                                        <div key={decision.id || index} className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 relative">
                                            <span className="text-xs font-mono text-muted-foreground mt-1">§{index + 1}</span>
                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-bold text-sm">{decision.title}</p>
                                                    {decision.booked && (
                                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-600 text-[10px] font-bold uppercase tracking-wider">
                                                            <CheckCircle className="h-2.5 w-2.5" />
                                                            Bokförd
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-muted-foreground leading-relaxed">{decision.decision}</p>
                                                {decision.amount && (
                                                    <p className="text-sm font-bold text-primary mt-2">
                                                        {decision.amount.toLocaleString('sv-SE')} kr
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-12 text-center bg-muted/20 rounded-lg border-2 border-dashed">
                                    <p className="text-sm text-muted-foreground italic">Inga beslut har registrerats än.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Agenda Section */}
                    {meeting.agenda && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">Dagordning</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                                    {meeting.agenda}
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <div className="space-y-6">
                    {/* Meeting Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Mötesinfo</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <InfoItem icon={Calendar} label="Datum" value={displayDate} />
                            <InfoItem icon={Clock} label="Tid" value={meeting.time} />
                            <InfoItem icon={MapPin} label="Plats" value={meeting.location} />
                            
                            <div className="pt-4 border-t space-y-4">
                                <InfoItem icon={User} label="Ordförande" value={meeting.chairperson} />
                                <InfoItem icon={User} label="Sekreterare" value={meeting.secretary} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Participants */}
                    {meeting.attendees && meeting.attendees.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Närvarande</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {meeting.attendees.map((person, i) => (
                                        <div key={i} className="flex items-center gap-2 text-sm">
                                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                            {person}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Internal Notes */}
                    {(meeting as any).notes && (
                        <Card className="bg-amber-500/5 border-amber-500/10">
                            <CardHeader>
                                <CardTitle className="text-xs font-bold uppercase tracking-widest text-amber-600/70 flex items-center gap-2">
                                    <StickyNote className="h-3.5 w-3.5" />
                                    Anteckningar
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-amber-800/80 leading-relaxed italic">
                                    {(meeting as any).notes}
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </PageOverlay>
    )
}
