"use client"

import * as React from "react"
import { useState, useMemo } from "react"
import { formatDateLong, cn } from "@/lib/utils"
import {
  Vote,
  Calendar,
  Users,
  Plus,
  MoreHorizontal,
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  Sparkles,
  MapPin,
  User,
  FileText,
  Gavel,
  Send,
  MessageSquare,
  HandHeart,
  FileCheck,
  UserCheck,
  Megaphone,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { SearchBar } from "@/components/ui/search-bar"
import { Textarea } from "@/components/ui/textarea"
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
import { MotionDialog } from "./dialogs/motion-dialog"
import { PlanMeetingDialog } from "./dialogs/plan-meeting-dialog"
import { SendNoticeDialog } from "./dialogs/send-notice-dialog"
import { AppStatusBadge } from "@/components/ui/status-badge"
import { type MeetingStatus } from "@/lib/status-types"
import { mockMembers } from "@/data/ownership"
import { Progress } from "@/components/ui/progress"

// Mock data for Förening annual meetings
interface ForeningMeeting {
  id: string
  year: number
  date: string
  location: string
  type: 'ordinarie' | 'extra'
  attendeesCount: number
  votingMembersCount: number
  chairperson: string
  secretary: string
  decisions: ForeningDecision[]
  motions: Motion[]
  status: 'kallad' | 'genomförd' | 'protokoll signerat'
  documentUrl?: string
}

interface ForeningDecision {
  id: string
  title: string
  description?: string
  decision: string
  votingResult?: {
    for: number
    against: number
    abstained: number
  }
}

interface Motion {
  id: string
  title: string
  submittedBy: string
  submittedDate: string
  description: string
  boardResponse?: string
  status: 'mottagen' | 'behandlad' | 'godkänd' | 'avslagen'
}

const mockForeningMeetings: ForeningMeeting[] = [
  {
    id: 'fm-1',
    year: 2024,
    date: '2024-03-15',
    location: 'Föreningslokalen, Storgatan 1',
    type: 'ordinarie',
    attendeesCount: 35,
    votingMembersCount: 33,
    chairperson: 'Anna Andersson',
    secretary: 'Maria Svensson',
    decisions: [
      { id: 'fd-1', title: 'Godkännande av verksamhetsberättelse', decision: 'Årsmötet godkände verksamhetsberättelsen för 2023' },
      { id: 'fd-2', title: 'Fastställande av bokslut', decision: 'Årsmötet fastställde bokslutet med ett överskott på 15 000 kr' },
      { id: 'fd-3', title: 'Ansvarsfrihet för styrelsen', decision: 'Årsmötet beviljade styrelsen ansvarsfrihet' },
      { id: 'fd-4', title: 'Medlemsavgift 2025', decision: 'Årsmötet beslutade att behålla medlemsavgiften på 500 kr/år', votingResult: { for: 28, against: 3, abstained: 2 } },
      { id: 'fd-5', title: 'Val av styrelse', decision: 'Anna Andersson omvaldes som ordförande. Erik Eriksson omvaldes som kassör.' },
    ],
    motions: [
      { id: 'mo-1', title: 'Fler aktiviteter för unga', submittedBy: 'Lisa Lindgren', submittedDate: '2024-02-01', description: 'Förslag om att anordna minst 4 aktiviteter per år riktade till yngre medlemmar.', boardResponse: 'Styrelsen ställer sig positiv och föreslår bifall.', status: 'godkänd' },
    ],
    status: 'protokoll signerat',
  },
  {
    id: 'fm-2',
    year: 2025,
    date: '2025-03-20',
    location: 'Föreningslokalen, Storgatan 1',
    type: 'ordinarie',
    attendeesCount: 0,
    votingMembersCount: 0,
    chairperson: '',
    secretary: '',
    decisions: [],
    motions: [
      { id: 'mo-2', title: 'Höjd medlemsavgift för stödmedlemmar', submittedBy: 'Erik Eriksson', submittedDate: '2025-01-15', description: 'Förslag om att höja avgiften för stödmedlemmar från 200 kr till 300 kr.', status: 'mottagen' },
      { id: 'mo-3', title: 'Ny hemsida', submittedBy: 'Sofia Berg', submittedDate: '2025-02-01', description: 'Förslag om att föreningen ska investera i en modern hemsida med medlemsportal.', boardResponse: 'Styrelsen föreslår att frågan utreds och återkommer med kostnadsförslag.', status: 'behandlad' },
      { id: 'mo-4', title: 'Miljöpolicy', submittedBy: 'Anna Andersson', submittedDate: '2025-02-10', description: 'Förslag om att föreningen ska anta en miljöpolicy.', status: 'mottagen' },
    ],
    status: 'kallad',
  },
]

export function Arsmote() {
  const [meetings] = useState<ForeningMeeting[]>(mockForeningMeetings)
  const [searchQuery, setSearchQuery] = useState("")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showMotionDialog, setShowMotionDialog] = useState(false)
  const [showSendNoticeDialog, setShowSendNoticeDialog] = useState(false)
  const [selectedMeeting, setSelectedMeeting] = useState<ForeningMeeting | null>(null)
  const [noticeMeeting, setNoticeMeeting] = useState<ForeningMeeting | null>(null)

  // Get voting-eligible members
  const votingMembers = useMemo(() => {
    return mockMembers.filter(m => m.status === 'aktiv' && m.currentYearFeePaid)
  }, [])

  // Calculate stats
  const stats = useMemo(() => {
    const upcoming = meetings.filter(m => m.status === 'kallad').length
    const completed = meetings.filter(m => m.status === 'protokoll signerat').length
    const nextMeeting = meetings.find(m => m.status === 'kallad')
    const pendingMotions = nextMeeting?.motions.filter(m => m.status === 'mottagen').length || 0

    // Calculate days until next meeting
    const daysUntilNext = nextMeeting
      ? Math.ceil((new Date(nextMeeting.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      : null

    return { upcoming, completed, nextMeeting, daysUntilNext, pendingMotions, votingMembersCount: votingMembers.length }
  }, [meetings, votingMembers])

  // Filter meetings
  const filteredMeetings = useMemo(() => {
    if (!searchQuery) return meetings
    const query = searchQuery.toLowerCase()
    return meetings.filter(m =>
      m.decisions.some(d =>
        d.title.toLowerCase().includes(query) ||
        d.decision.toLowerCase().includes(query)
      ) ||
      m.motions.some(mo =>
        mo.title.toLowerCase().includes(query) ||
        mo.description.toLowerCase().includes(query)
      ) ||
      m.location.toLowerCase().includes(query) ||
      m.year.toString().includes(query)
    )
  }, [meetings, searchQuery])

  const getMeetingStatusLabel = (status: ForeningMeeting['status']): MeetingStatus => {
    const labels: Record<ForeningMeeting['status'], MeetingStatus> = {
      'kallad': 'Kallad',
      'genomförd': 'Genomförd',
      'protokoll signerat': 'Signerat',
    }
    return labels[status]
  }

  const getMotionStatusBadge = (status: Motion['status']) => {
    switch (status) {
      case 'mottagen':
        return <Badge variant="outline">Mottagen</Badge>
      case 'behandlad':
        return <Badge variant="secondary">Behandlad av styrelsen</Badge>
      case 'godkänd':
        return <Badge className="bg-green-100 text-green-800">Godkänd</Badge>
      case 'avslagen':
        return <Badge variant="destructive">Avslagen</Badge>
    }
  }

  // Standard agenda for annual meeting
  const standardAgenda = [
    'Mötets öppnande',
    'Val av mötesordförande',
    'Val av mötessekreterare',
    'Val av justerare tillika rösträknare',
    'Godkännande av dagordning',
    'Fråga om mötet är stadgeenligt utlyst',
    'Fastställande av röstlängd',
    'Verksamhetsberättelse',
    'Ekonomisk redovisning',
    'Revisionsberättelse',
    'Fråga om ansvarsfrihet för styrelsen',
    'Beslut om medlemsavgifter',
    'Behandling av inkomna motioner',
    'Val av ordförande',
    'Val av övriga styrelseledamöter',
    'Val av revisorer',
    'Val av valberedning',
    'Övriga frågor',
    'Mötets avslutande',
  ]

  const handleOpenNotice = (meeting: ForeningMeeting) => {
    setNoticeMeeting(meeting)
    setShowSendNoticeDialog(true)
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <StatCardGrid columns={4}>
        <StatCard
          label="Nästa årsmöte"
          value={stats.nextMeeting ? formatDateLong(stats.nextMeeting.date) : 'Ej planerat'}
          subtitle={stats.daysUntilNext ? `${stats.daysUntilNext} dagar kvar` : 'Inget årsmöte planerat'}
          icon={Calendar}
        />
        <StatCard
          label="Röstberättigade"
          value={stats.votingMembersCount.toString()}
          subtitle="medlemmar med betald avgift"
          icon={UserCheck}
        />
        <StatCard
          label="Inkomna motioner"
          value={(stats.nextMeeting?.motions.length || 0).toString()}
          subtitle={`${stats.pendingMotions} inväntar styrelsens svar`}
          icon={MessageSquare}
        />
        <StatCard
          label="Genomförda"
          value={stats.completed.toString()}
          subtitle="årsmöten med signerat protokoll"
          icon={CheckCircle}
        />
      </StatCardGrid>

      {/* Section Separator */}
      <div className="border-b-2 border-border/60" />

      {/* Upcoming Meeting Alert */}
      {stats.nextMeeting && stats.daysUntilNext && stats.daysUntilNext > 0 && stats.daysUntilNext <= 60 && (
        <Card className="border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-rose-800 dark:text-rose-200">
                  <HandHeart className="h-5 w-5" />
                  Kommande årsmöte
                </CardTitle>
                <CardDescription className="text-rose-700 dark:text-rose-300">
                  Ordinarie årsmöte planerat {formatDateLong(stats.nextMeeting.date)}
                </CardDescription>
              </div>
              <Button variant="outline" onClick={() => handleOpenNotice(stats.nextMeeting!)}>
                <Send className="h-4 w-4 mr-2" />
                Skicka kallelse
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-rose-700 dark:text-rose-300">
                  {stats.daysUntilNext <= 14
                    ? 'Kallelse ska vara skickad enligt stadgarna!'
                    : 'Motioner kan lämnas in av medlemmar'}
                </span>
                <span className="font-medium text-rose-800 dark:text-rose-200">
                  {stats.daysUntilNext} dagar kvar
                </span>
              </div>
              <Progress
                value={Math.max(0, 100 - (stats.daysUntilNext / 60 * 100))}
                className="h-2"
              />
              <div className="flex items-center gap-4 text-sm text-rose-700 dark:text-rose-300">
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  {stats.nextMeeting.motions.length} motioner
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {stats.votingMembersCount} röstberättigade
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions Bar */}
      <div className="flex items-center gap-3">
        <SearchBar
          placeholder="Sök i årsmöten och motioner..."
          value={searchQuery}
          onChange={setSearchQuery}
          className="w-64"
        />

        <div className="ml-auto flex items-center gap-2">
          {/* New Motion */}
          <Button variant="outline" onClick={() => setShowMotionDialog(true)}>
            <MessageSquare className="h-4 w-4 mr-2" />
            Ny motion
          </Button>
          <MotionDialog
            open={showMotionDialog}
            onOpenChange={setShowMotionDialog}
            onSubmit={(data) => {
              // Handle submission logic here if needed
              console.log("Motion submitted", data)
            }}
          />

          {/* Plan Meeting */}
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Planera årsmöte
          </Button>
          <PlanMeetingDialog
            open={showCreateDialog}
            onOpenChange={setShowCreateDialog}
            type="annual"
            defaultAgenda={standardAgenda}
            onSubmit={(data) => {
              console.log("Meeting planned", data)
            }}
          />

          {/* Send Notice Dialog */}
          <SendNoticeDialog
            open={showSendNoticeDialog}
            onOpenChange={setShowSendNoticeDialog}
            variant="association"
            recipientCount={mockMembers.filter(m => m.status === 'aktiv').length}
            meeting={noticeMeeting || undefined}
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
                    <HandHeart className="h-5 w-5 text-rose-600" />
                    {meeting.type === 'ordinarie' ? 'Ordinarie årsmöte' : 'Extra årsmöte'} {meeting.year}
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
                    {meeting.attendeesCount > 0 && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {meeting.attendeesCount} närvarande
                      </span>
                    )}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <AppStatusBadge status={getMeetingStatusLabel(meeting.status)} showIcon />
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
                        <DropdownMenuItem onClick={() => handleOpenNotice(meeting)}>
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
                      <UserCheck className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Röstande:</span>
                      <span className="font-medium">{meeting.votingMembersCount || 0} st</span>
                    </div>
                  </div>

                  {/* Motions */}
                  {meeting.motions.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-medium flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Motioner ({meeting.motions.length} st)
                      </h4>
                      <div className="space-y-2">
                        {meeting.motions.map((motion) => (
                          <div
                            key={motion.id}
                            className="p-3 bg-muted rounded-lg space-y-2"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium text-sm">{motion.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  Inlämnad av {motion.submittedBy} • {formatDateLong(motion.submittedDate)}
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
                            className="flex items-start gap-3 p-3 bg-muted rounded-lg"
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
                  {meeting.status === 'kallad' && (
                    <Card className="bg-muted/50">
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-2">
                          <Sparkles className="h-4 w-4 mt-0.5 text-primary" />
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
            )}
          </Card>
        ))}

        {/* Empty state */}
        {filteredMeetings.length === 0 && (
          <Card className="py-12">
            <CardContent className="text-center">
              <HandHeart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Inga årsmöten</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? 'Inga årsmöten matchade din sökning' : 'Planera ditt första årsmöte'}
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Planera årsmöte
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
              <span>Digital kallelse till medlemmar</span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <CheckCircle className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <span>Motionshantering med styrelsens yttranden</span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <CheckCircle className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <span>Valberedningens förslag</span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <CheckCircle className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <span>Digital röstning och poströstning</span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <CheckCircle className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <span>AI-genererat årsmötesprotokoll</span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <CheckCircle className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <span>Verksamhetsberättelse och ekonomisk rapport</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
