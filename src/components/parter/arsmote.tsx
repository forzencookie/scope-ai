"use client"

import * as React from "react"
import { useState, useMemo } from "react"
import { formatDateLong, formatDate, cn } from "@/lib/utils"
import {
  Vote,
  Calendar,
  Users,
  Plus,
  MoreHorizontal,
  Download,
  CheckCircle,
  Clock,
  Sparkles,
  MapPin,
  User,
  FileText,
  Gavel,
  Send,
  MessageSquare,
  HandHeart,
  UserCheck,
  AlertCircle,
  ChevronRight,
  FileCheck,
  ClipboardList,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SearchBar } from "@/components/ui/search-bar"
import { FilterButton } from "@/components/ui/filter-button"
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
import {
  GridTableHeader,
  GridTableRow,
  GridTableRows,
} from "@/components/ui/grid-table"
import { MotionDialog } from "./dialogs/motion"
import { PlanMeetingDialog } from "./dialogs/mote"
import { SendNoticeDialog } from "./dialogs/kallelse"
import { AppStatusBadge } from "@/components/ui/status-badge"
import { type MeetingStatus } from "@/lib/status-types"
import { mockMembers, mockGeneralMeetings as mockAnnualMeetings, type AnnualMeeting } from "@/data/ownership"
import { useCompliance } from "@/hooks/use-compliance"

// Motion type
interface Motion {
  id: string
  title: string
  submittedBy: string
  submittedDate: string
  description: string
  boardResponse?: string
  status: 'mottagen' | 'behandlad' | 'godkänd' | 'avslagen'
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

export function Arsmote() {
  const { documents: realDocuments, isLoadingDocuments, addDocument } = useCompliance()

  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showMotionDialog, setShowMotionDialog] = useState(false)
  const [showSendNoticeDialog, setShowSendNoticeDialog] = useState(false)
  const [selectedMeeting, setSelectedMeeting] = useState<AnnualMeeting | null>(null)
  const [noticeMeeting, setNoticeMeeting] = useState<AnnualMeeting | null>(null)

  // Get voting-eligible members
  const votingMembers = useMemo(() => {
    return mockMembers.filter(m => m.status === 'aktiv' && m.currentYearFeePaid)
  }, [])

  // Map real documents to AnnualMeeting format or use mock data
  const meetings = useMemo(() => {
    const realMeetings = (realDocuments || [])
      .filter(doc => doc.type === 'general_meeting_minutes')
      .map((doc) => {
        let content: Partial<AnnualMeeting> = {
          year: new Date(doc.date).getFullYear(),
          location: 'Ej angivet',
          chairperson: '',
          secretary: '',
          attendeesCount: 0,
          decisions: [],
          motions: [],
          type: 'ordinarie' as const
        }

        try {
          const parsed = JSON.parse(doc.content)
          content = { ...content, ...parsed }
        } catch (e) {
          // Fallback
        }

        return {
          id: doc.id,
          date: doc.date,
          status: (doc.status === 'signed' ? 'protokoll signerat' : (doc.status === 'archived' ? 'genomförd' : 'planerad')) as AnnualMeeting['status'],
          ...content
        } as AnnualMeeting
      })

    // Return real meetings if we have them, otherwise use mock data
    return realMeetings.length > 0 ? realMeetings : mockAnnualMeetings
  }, [realDocuments])

  // Calculate stats
  const stats = useMemo(() => {
    const now = new Date()
    const upcomingMeetings = meetings.filter(m => m.status === 'planerad' || m.status === 'kallad')
    const completedMeetings = meetings.filter(m => m.status === 'protokoll signerat')
    const nextMeeting = upcomingMeetings.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]

    const allMotions = meetings.flatMap(m => m.motions || [])
    const pendingMotions = allMotions.filter((m: Motion) => m.status === 'mottagen').length
    const totalMotions = nextMeeting?.motions?.length || 0

    const daysUntilNext = nextMeeting
      ? Math.ceil((new Date(nextMeeting.date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null

    // Preparation checklist progress
    const preparationItems = nextMeeting ? [
      { label: 'Datum bestämt', done: !!nextMeeting.date },
      { label: 'Lokal bokad', done: !!nextMeeting.location && nextMeeting.location !== 'Ej angivet' },
      { label: 'Kallelse skickad', done: nextMeeting.status === 'kallad' },
      { label: 'Motioner behandlade', done: pendingMotions === 0 && totalMotions > 0 },
      { label: 'Dagordning klar', done: true }, // Assume standard agenda
    ] : []

    const prepProgress = preparationItems.length > 0
      ? Math.round((preparationItems.filter(i => i.done).length / preparationItems.length) * 100)
      : 0

    return {
      upcomingCount: upcomingMeetings.length,
      completedCount: completedMeetings.length,
      nextMeeting,
      daysUntilNext,
      pendingMotions,
      totalMotions,
      votingMembersCount: votingMembers.length,
      preparationItems,
      prepProgress
    }
  }, [meetings, votingMembers])

  // Filter meetings
  const filteredMeetings = useMemo(() => {
    let result = meetings

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(m =>
        (m.decisions || []).some((d: any) =>
          d.title?.toLowerCase().includes(query) ||
          d.decision?.toLowerCase().includes(query)
        ) ||
        (m.motions || []).some((mo: any) =>
          mo.title?.toLowerCase().includes(query) ||
          mo.description?.toLowerCase().includes(query)
        ) ||
        m.location?.toLowerCase().includes(query) ||
        m.year?.toString().includes(query)
      )
    }

    if (statusFilter) {
      result = result.filter(m => m.status === statusFilter)
    }

    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [meetings, searchQuery, statusFilter])

  const getMeetingStatusLabel = (status: AnnualMeeting['status']): MeetingStatus => {
    const labels: Record<AnnualMeeting['status'], MeetingStatus> = {
      'planerad': 'Planerad',
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
        return <Badge variant="secondary">Behandlad</Badge>
      case 'godkänd':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Godkänd</Badge>
      case 'avslagen':
        return <Badge variant="destructive">Avslagen</Badge>
    }
  }

  const handleOpenNotice = (meeting: AnnualMeeting) => {
    setNoticeMeeting(meeting)
    setShowSendNoticeDialog(true)
  }

  if (isLoadingDocuments) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border bg-muted/20 p-5 h-48 animate-pulse" />
        <div className="border-b-2 border-border/60" />
        <div className="grid gap-4 grid-cols-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Heading */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Årsmöte</h2>
            <p className="text-muted-foreground mt-1">
              Planera, dokumentera och förvalta föreningens årsmöten.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setShowMotionDialog(true)}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Ny motion
            </Button>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Planera årsmöte
            </Button>
          </div>
        </div>
      </div>

      {/* Next Meeting Hero Card */}
      <div className="rounded-xl border bg-muted/20 p-6">
        {stats.nextMeeting ? (
          <div className="space-y-5">
            {/* Header with title and status */}
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <HandHeart className="h-4 w-4" />
                  <span>Nästa årsmöte</span>
                </div>
                <h3 className="text-3xl font-bold tracking-tight">
                  {formatDateLong(stats.nextMeeting.date)}
                </h3>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{stats.nextMeeting.location || 'Lokal ej angiven'}</span>
                </div>
              </div>
              <AppStatusBadge status={getMeetingStatusLabel(stats.nextMeeting.status)} />
            </div>

            {/* Divider */}
            <div className="border-t border-border/50" />

            {/* Preparation Progress */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Förberedelser</span>
                <span className="text-sm font-medium">{stats.prepProgress}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    stats.prepProgress === 100
                      ? "bg-green-500"
                      : stats.prepProgress >= 60
                        ? "bg-foreground/80"
                        : "bg-amber-500"
                  )}
                  style={{ width: `${stats.prepProgress}%` }}
                />
              </div>
              {/* Compact checklist */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                {stats.preparationItems.map((item, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "flex items-center gap-1.5",
                      item.done ? "text-green-600 dark:text-green-500" : "text-muted-foreground"
                    )}
                  >
                    {item.done ? (
                      <CheckCircle className="h-3.5 w-3.5" />
                    ) : (
                      <Clock className="h-3.5 w-3.5" />
                    )}
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border/50" />

            {/* Inline Stats */}
            <div className="flex items-center gap-8">
              <div className="text-center">
                <p className="text-2xl font-bold tabular-nums">{stats.votingMembersCount}</p>
                <p className="text-xs text-muted-foreground">Röstberättigade</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold tabular-nums">{stats.pendingMotions}</p>
                <p className="text-xs text-muted-foreground">Motioner</p>
              </div>
              {stats.daysUntilNext && stats.daysUntilNext > 0 && (
                <div className="text-center">
                  <p className="text-2xl font-bold tabular-nums">{stats.daysUntilNext}</p>
                  <p className="text-xs text-muted-foreground">Dagar kvar</p>
                </div>
              )}
              <div className="text-center">
                <p className="text-2xl font-bold tabular-nums">{stats.completedCount}</p>
                <p className="text-xs text-muted-foreground">Genomförda</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <HandHeart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Inget årsmöte planerat</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Planera ett årsmöte för att komma igång med förberedelserna.
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Planera årsmöte
            </Button>
          </div>
        )}
      </div>

      {/* Section Separator */}
      <div className="border-b-2 border-border/60" />

      {/* Actions Bar */}
      <div className="flex items-center gap-3">
        <SearchBar
          placeholder="Sök i årsmöten, motioner..."
          value={searchQuery}
          onChange={setSearchQuery}
          className="w-80"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <FilterButton
              label={
                statusFilter === 'planerad' ? 'Planerade' :
                  statusFilter === 'kallad' ? 'Kallade' :
                    statusFilter === 'genomförd' ? 'Genomförda' :
                      statusFilter === 'protokoll signerat' ? 'Signerade' :
                        'Alla status'
              }
              isActive={!!statusFilter}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => setStatusFilter(null)}>Alla status</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setStatusFilter('planerad')}>
              <Clock className="h-4 w-4 mr-2" />
              Planerade
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('kallad')}>
              <Send className="h-4 w-4 mr-2" />
              Kallade
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('genomförd')}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Genomförda
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('protokoll signerat')}>
              <FileText className="h-4 w-4 mr-2" />
              Signerade
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8">
            <Download className="h-4 w-4 mr-2" />
            Exportera
          </Button>
        </div>
      </div>

      {/* Meetings Table */}
      <div className="overflow-x-auto pb-4 -mx-2">
        <div className="min-w-[800px] px-2">
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
            {filteredMeetings.map((meeting) => (
              <GridTableRow
                key={meeting.id}
                minWidth="0"
                className={cn(
                  "cursor-pointer",
                  selectedMeeting?.id === meeting.id && "bg-primary/5"
                )}
                onClick={() => setSelectedMeeting(selectedMeeting?.id === meeting.id ? null : meeting)}
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
                  <AppStatusBadge status={getMeetingStatusLabel(meeting.status)} showIcon />
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
              </GridTableRow>
            ))}
          </GridTableRows>
        </div>
      </div>

      {/* Expanded Meeting Details */}
      {selectedMeeting && (
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <HandHeart className="h-5 w-5 text-rose-600" />
                  {selectedMeeting.type === 'ordinarie' ? 'Ordinarie årsmöte' : 'Extra årsmöte'} {selectedMeeting.year}
                </CardTitle>
                <CardDescription className="flex items-center gap-4 mt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDateLong(selectedMeeting.date)}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {selectedMeeting.location}
                  </span>
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedMeeting(null)}>
                Stäng
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Meeting details */}
              {(selectedMeeting.chairperson || selectedMeeting.secretary) && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Ordförande:</span>
                    <span className="font-medium">{selectedMeeting.chairperson || 'Ej vald'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Sekreterare:</span>
                    <span className="font-medium">{selectedMeeting.secretary || 'Ej vald'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Närvarande:</span>
                    <span className="font-medium">{selectedMeeting.attendeesCount || 0} st</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Röstande:</span>
                    <span className="font-medium">{(selectedMeeting as any).votingMembersCount || selectedMeeting.attendeesCount || 0} st</span>
                  </div>
                </div>
              )}

              {/* Motions */}
              {(selectedMeeting.motions || []).length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Motioner ({selectedMeeting.motions.length} st)
                  </h4>
                  <div className="space-y-2">
                    {selectedMeeting.motions.map((motion: Motion) => (
                      <div
                        key={motion.id}
                        className="p-3 bg-muted/50 rounded-lg space-y-2"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-sm">{motion.title}</p>
                            <p className="text-xs text-muted-foreground">
                              Inlämnad av {motion.submittedBy} • {formatDate(motion.submittedDate)}
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
              {(selectedMeeting.decisions || []).length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Gavel className="h-4 w-4" />
                    Beslut ({selectedMeeting.decisions.length} st)
                  </h4>
                  <div className="space-y-2">
                    {selectedMeeting.decisions.map((decision: any, index: number) => (
                      <div
                        key={decision.id}
                        className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
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
              {(selectedMeeting.status === 'planerad' || selectedMeeting.status === 'kallad') && (
                <Card className="bg-purple-50/50 dark:bg-purple-950/20 border-0">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-2">
                      <Sparkles className="h-4 w-4 mt-0.5 text-purple-600" />
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
        </Card>
      )}

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

      {/* Dialogs */}
      <MotionDialog
        open={showMotionDialog}
        onOpenChange={setShowMotionDialog}
        onSubmit={(data) => {
          console.log("Motion submitted", data)
        }}
      />

      <PlanMeetingDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        type="annual"
        defaultAgenda={standardAgenda}
        onSubmit={(data) => {
          addDocument({
            type: 'general_meeting_minutes',
            title: `${data.type === 'extra' ? 'Extra årsmöte' : 'Ordinarie årsmöte'} ${data.year}`,
            date: data.date,
            content: JSON.stringify({
              year: parseInt(data.year),
              location: data.location,
              type: data.type,
              decisions: [],
              motions: [],
              attendeesCount: 0
            }),
            status: 'draft',
            source: 'manual'
          })
          setShowCreateDialog(false)
        }}
      />

      <SendNoticeDialog
        open={showSendNoticeDialog}
        onOpenChange={setShowSendNoticeDialog}
        variant="association"
        recipientCount={mockMembers.filter(m => m.status === 'aktiv').length}
        meeting={noticeMeeting || undefined}
        onSubmit={() => console.log("Notice prepared")}
      />
    </div>
  )
}
