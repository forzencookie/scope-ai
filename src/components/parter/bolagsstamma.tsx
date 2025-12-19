"use client"

import * as React from "react"
import { useState, useMemo } from "react"
import { formatDateLong } from "@/lib/utils"
import {
  Vote,
  Calendar,
  Users,
  Plus,
  MoreHorizontal,
  Download,
  Search,
  CheckCircle,
  Clock,
  AlertCircle,
  Sparkles,
  MapPin,
  User,
  FileText,
  Gavel,
  Send,
  Scale,
  TrendingUp,
  FileCheck,
  Building,
  Banknote,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { StatCard, StatCardGrid } from "@/components/ui/stat-card"
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
import { PlanMeetingDialog } from "./dialogs/plan-meeting-dialog"
import { SendNoticeDialog } from "./dialogs/send-notice-dialog"
import { Label } from "@/components/ui/label"
import { AppStatusBadge } from "@/components/ui/status-badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import {
  mockGeneralMeetings,
  mockShareholders,
  type GeneralMeeting,
  type GeneralMeetingDecision
} from "@/data/ownership"
import { useCorporate } from "@/hooks/use-corporate"

import { useVerifications } from "@/hooks/use-verifications"
import { useToast } from "@/components/ui/toast"

export function Bolagsstamma() {
  const { meetings: allMeetings, addMeeting, updateDecision } = useCorporate()
  const { addVerification } = useVerifications()
  const { success } = useToast()
  const meetings = allMeetings.filter(m => m.meetingType === 'bolagsstamma')


  const [searchQuery, setSearchQuery] = useState("")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showSendNoticeDialog, setShowSendNoticeDialog] = useState(false)
  const [selectedMeeting, setSelectedMeeting] = useState<GeneralMeeting | null>(null)
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)

  // Calculate stats
  const stats = useMemo(() => {
    const upcoming = meetings.filter(m => m.status === 'kallad').length
    const completed = meetings.filter(m => m.status === 'protokoll signerat').length
    const totalDecisions = meetings.reduce((sum, m) => sum + m.decisions.length, 0)

    // Sort meetings by date to find the next one correctly
    const sortedUpcoming = meetings
      .filter(m => m.status === 'kallad')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    const nextMeeting = sortedUpcoming[0]

    // Calculate days until next meeting
    const daysUntilNext = nextMeeting
      ? Math.ceil((new Date(nextMeeting.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      : null

    return { upcoming, completed, totalDecisions, nextMeeting, daysUntilNext }
  }, [meetings])

  // Filter meetings
  const filteredMeetings = useMemo(() => {
    if (!searchQuery) return meetings
    const query = searchQuery.toLowerCase()
    return meetings.filter(m =>
      m.decisions.some(d =>
        d.title.toLowerCase().includes(query) ||
        d.decision.toLowerCase().includes(query)
      ) ||
      m.location.toLowerCase().includes(query) ||
      m.chairperson.toLowerCase().includes(query) ||
      m.year.toString().includes(query)
    )
  }, [meetings, searchQuery])

  const getStatusBadge = (status: GeneralMeeting['status']) => {
    switch (status) {
      case 'protokoll signerat':
        return <AppStatusBadge status="Signerat" showIcon />
      case 'genomförd':
        return <AppStatusBadge status="Genomförd" showIcon />
      case 'kallad':
        return <AppStatusBadge status="Kallad" showIcon />
    }
  }

  const getMeetingTypeLabel = (type: GeneralMeeting['type']) => {
    switch (type) {
      case 'ordinarie': return 'Ordinarie årsstämma'
      case 'extra': return 'Extra bolagsstämma'
    }
  }

  const handleGenerateAISummary = async (meeting: GeneralMeeting) => {
    setIsGeneratingAI(true)
    // Simulate AI generation
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsGeneratingAI(false)
  }

  const handleBookDecision = (meeting: GeneralMeeting, decision: GeneralMeetingDecision) => {
    if (!decision.amount) return

    addVerification({
      description: `Utdelning enligt stämmobeslut ${meeting.year}`,
      date: meeting.date,
      rows: [
        {
          account: "2091 Balanserad vinst",
          debit: decision.amount,
          credit: 0,
          description: "Minskning av fritt eget kapital"
        },
        {
          account: "2898 Skuld till aktieägare",
          debit: 0,
          credit: decision.amount,
          description: "Uppbokad skuld till aktieägare"
        }
      ]
    })

    updateDecision(meeting.id, decision.id, { booked: true })

    success(
      "Utdelning bokförd",
      `Utdelning på ${decision.amount.toLocaleString('sv-SE')} kr har bokförts som en skuld till aktieägarna.`
    )
  }

  // Standard agenda for annual meeting
  const standardAgenda = [
    'Val av ordförande vid stämman',
    'Upprättande och godkännande av röstlängd',
    'Godkännande av dagordningen',
    'Val av en eller två justeringsmän',
    'Prövning av om stämman blivit behörigen sammankallad',
    'Framläggande av årsredovisning och revisionsberättelse',
    'Beslut om fastställande av resultaträkning och balansräkning',
    'Beslut om dispositioner av vinst eller förlust enligt fastställd balansräkning',
    'Beslut om ansvarsfrihet för styrelseledamöter och VD',
    'Fastställande av arvoden till styrelse och revisor',
    'Val av styrelse och eventuella suppleanter',
    'Val av revisor och eventuell revisorssuppleant',
    'Annat ärende som ankommer på stämman enligt ABL eller bolagsordningen',
    'Stämmans avslutande',
  ]

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <StatCardGrid columns={4}>
        <StatCard
          label="Nästa stämma"
          value={stats.nextMeeting ? formatDateLong(stats.nextMeeting.date) : 'Ej planerad'}
          subtitle={stats.daysUntilNext ? `${stats.daysUntilNext} dagar kvar` : 'Ingen stämma planerad'}
          icon={Calendar}
        />
        <StatCard
          label="Aktieägare"
          value={mockShareholders.length.toString()}
          subtitle="att kalla till stämman"
          icon={Users}
        />
        <StatCard
          label="Genomförda"
          value={stats.completed.toString()}
          subtitle="stämmor med signerat protokoll"
          icon={CheckCircle}
        />
        <StatCard
          label="Stämmobeslut"
          value={stats.totalDecisions.toString()}
          subtitle="dokumenterade beslut"
          icon={Gavel}
        />
      </StatCardGrid>

      {/* Upcoming Meeting Alert */}
      {stats.nextMeeting && stats.daysUntilNext && stats.daysUntilNext > 0 && stats.daysUntilNext <= 60 && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                  <AlertCircle className="h-5 w-5" />
                  Kommande årsstämma
                </CardTitle>
                <CardDescription className="text-amber-700 dark:text-amber-300">
                  {getMeetingTypeLabel(stats.nextMeeting.type)} planerad {formatDateLong(stats.nextMeeting.date)}
                </CardDescription>
              </div>
              <Button variant="outline" onClick={() => setShowSendNoticeDialog(true)}>
                <Send className="h-4 w-4 mr-2" />
                Skicka kallelse
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-amber-700 dark:text-amber-300">
                  Förberedelser: {stats.daysUntilNext <= 28 ? 'Kallelse måste skickas nu!' : 'Kallelse ska skickas senast 4 veckor innan'}
                </span>
                <span className="font-medium text-amber-800 dark:text-amber-200">
                  {stats.daysUntilNext} dagar kvar
                </span>
              </div>
              <Progress
                value={Math.max(0, 100 - (stats.daysUntilNext / 60 * 100))}
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Sök i stämmor och beslut..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Planera stämma
          </Button>
          <PlanMeetingDialog
            open={showCreateDialog}
            onOpenChange={setShowCreateDialog}
            type="general"
            defaultAgenda={standardAgenda}
            onSubmit={(data) => {
              addMeeting({
                year: parseInt(data.year) || new Date().getFullYear(),
                date: data.date,
                location: data.location,
                type: data.type === 'extra' ? 'extra' : 'ordinarie',
                meetingType: 'bolagsstamma',
                attendeesCount: 0,
                chairperson: '',
                secretary: '',
                decisions: [],
                status: 'kallad',
                // Mock data for AB specific fields if needed
                sharesRepresented: 0,
                votesRepresented: 0,
              })
            }}
          />

          {/* Send Notice Dialog */}
          <SendNoticeDialog
            open={showSendNoticeDialog}
            onOpenChange={setShowSendNoticeDialog}
            variant="corporate"
            recipientCount={mockShareholders.length}
            onSubmit={() => console.log("Notice prepared")}
          />

          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportera
          </Button>
        </div>
      </div>

      {/* Meetings List */}
      <div className="space-y-4">
        {filteredMeetings.map((meeting) => (
          <Card
            key={meeting.id}
            className={cn(
              "cursor-pointer transition-all hover:shadow-md",
              selectedMeeting?.id === meeting.id && "ring-2 ring-primary"
            )}
            onClick={() => setSelectedMeeting(selectedMeeting?.id === meeting.id ? null : meeting)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Vote className="h-5 w-5 text-primary" />
                    {getMeetingTypeLabel(meeting.type)} {meeting.year}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDateLong(meeting.date)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {meeting.location}
                    </span>
                    {meeting.sharesRepresented && (
                      <span className="flex items-center gap-1">
                        <Scale className="h-3 w-3" />
                        {meeting.sharesRepresented.toLocaleString('sv-SE')} aktier representerade
                      </span>
                    )}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(meeting.status)}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
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
                      {meeting.status === 'kallad' && (
                        <DropdownMenuItem onClick={() => setShowSendNoticeDialog(true)}>
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
                      <DropdownMenuItem onClick={() => handleGenerateAISummary(meeting)}>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generera AI-protokoll
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>

            {/* Expanded content */}
            {selectedMeeting?.id === meeting.id && (
              <CardContent className="pt-0">
                <div className="border-t pt-4 space-y-4">
                  {/* Meeting details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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
                      <Scale className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Röster:</span>
                      <span className="font-medium">{meeting.votesRepresented?.toLocaleString('sv-SE') || 0}</span>
                    </div>
                  </div>

                  {/* Decisions */}
                  {meeting.decisions.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-medium flex items-center gap-2">
                        <Gavel className="h-4 w-4" />
                        Beslut ({meeting.decisions.length} st)
                      </h4>
                      <div className="space-y-2">
                        {meeting.decisions.map((decision, index) => (
                          <div
                            key={decision.id}
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
                                  handleBookDecision(meeting, decision)
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
                  )}

                  {/* Pending meeting info */}
                  {meeting.status === 'kallad' && (
                    <Card className="bg-muted/50">
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
                </div>
              </CardContent>
            )}
          </Card>
        ))}

        {/* Empty state */}
        {filteredMeetings.length === 0 && (
          <Card className="py-12">
            <CardContent className="text-center">
              <Vote className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Inga bolagsstämmor</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? 'Inga stämmor matchade din sökning' : 'Planera din första bolagsstämma'}
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Planera stämma
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Upcoming features */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Kommande funktioner
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="flex items-start gap-2 text-sm">
              <CheckCircle className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <span>AI-genererad kallelse baserad på bolagets data</span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <CheckCircle className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <span>Digital röstning och fullmaktshantering</span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <CheckCircle className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <span>Automatisk protokollgenerering</span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <CheckCircle className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <span>Besluts- och utdelningsberäkningar</span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <CheckCircle className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <span>Årsredovisningspresentation</span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <CheckCircle className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <span>Integration med Bolagsverket</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

