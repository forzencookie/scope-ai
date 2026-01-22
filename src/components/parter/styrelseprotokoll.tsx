"use client"

import * as React from "react"
import { useState, useMemo, useEffect } from "react"
import { formatDateLong, formatDateShort } from "@/lib/utils"
import {
  FileText,
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
  FileCheck,
  ChevronDown,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import { AppStatusBadge } from "@/components/ui/status-badge"
import { FilterTabs } from "@/components/ui/filter-tabs"
import { SearchBar } from "@/components/ui/search-bar"
import { type MeetingStatus } from "@/lib/status-types"
import { mockBoardMeetings, type BoardMeeting, type AgendaItem } from "@/data/ownership"
import { useCompany } from "@/providers/company-provider"


import { useCompliance } from "@/hooks/use-compliance"

type StatusFilter = 'all' | 'planerad' | 'genomförd' | 'protokoll signerat'

export function Styrelseprotokoll() {
  const { companyType } = useCompany()
  const { documents: realDocuments, isLoadingDocuments, addDocument } = useCompliance()

  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedMeeting, setSelectedMeeting] = useState<BoardMeeting | null>(null)
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [collapsedYears, setCollapsedYears] = useState<Set<number>>(new Set())

  // Map real documents to BoardMeeting format, fallback to mock data for demo
  const meetings = useMemo(() => {
    const realMeetings = (realDocuments || [])
      .filter(doc => doc.type === 'board_meeting_minutes')
      .map((doc, idx) => {
        let content = {
          meetingNumber: idx + 1,
          location: 'Ej angivet',
          chairperson: 'Ej angivet',
          secretary: 'Ej angivet',
          attendees: [] as string[],
          agendaItems: [] as AgendaItem[],
          type: 'ordinarie' as const,
          absentees: [] as string[]
        }

        try {
          // Re-serialize content if it's JSON
          const parsed = JSON.parse(doc.content)
          content = { ...content, ...parsed }
        } catch (e) {
          // Fallback or handle raw content
        }

        return {
          id: doc.id,
          date: doc.date,
          status: (doc.status === 'signed' ? 'protokoll signerat' : (doc.status === 'archived' ? 'genomförd' : 'planerad')) as BoardMeeting['status'],
          absentees: content.absentees || [],
          type: content.type,
          meetingNumber: content.meetingNumber,
          location: content.location,
          chairperson: content.chairperson,
          secretary: content.secretary,
          attendees: content.attendees,
          agendaItems: content.agendaItems
        }
      })

    // Use mock data as fallback when no real data exists
    if (realMeetings.length === 0) {
      return []
    }

    return realMeetings
  }, [realDocuments])

  // Calculate stats from meetings data (works with both real and mock data)
  const stats = useMemo(() => {
    const signed = meetings.filter(m => m.status === 'protokoll signerat').length
    const completed = meetings.filter(m => m.status === 'genomförd').length
    const planned = meetings.filter(m => m.status === 'planerad').length
    const totalDecisions = meetings.reduce((sum, m) =>
      sum + m.agendaItems.filter(item => item.decision).length, 0
    )

    return { signed, completed, planned, totalDecisions }
  }, [meetings])

  // Filter meetings by search and status
  const filteredMeetings = useMemo(() => {
    let result = meetings

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(m => m.status === statusFilter)
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(m =>
        m.agendaItems.some(a =>
          a.title.toLowerCase().includes(query) ||
          a.decision?.toLowerCase().includes(query)
        ) ||
        m.location.toLowerCase().includes(query) ||
        m.chairperson.toLowerCase().includes(query) ||
        `#${m.meetingNumber}`.includes(query)
      )
    }

    return result
  }, [meetings, searchQuery, statusFilter])

  // Group meetings by year
  const meetingsByYear = useMemo(() => {
    const grouped: Record<number, BoardMeeting[]> = {}

    filteredMeetings.forEach(meeting => {
      const year = new Date(meeting.date).getFullYear()
      if (!grouped[year]) {
        grouped[year] = []
      }
      grouped[year].push(meeting)
    })

    // Sort meetings within each year by date (newest first)
    Object.keys(grouped).forEach(year => {
      grouped[parseInt(year)].sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )
    })

    return grouped
  }, [filteredMeetings])

  // Get sorted years (newest first)
  const sortedYears = useMemo(() => {
    return Object.keys(meetingsByYear)
      .map(Number)
      .sort((a, b) => b - a)
  }, [meetingsByYear])

  const toggleYearCollapsed = (year: number) => {
    setCollapsedYears(prev => {
      const newSet = new Set(prev)
      if (newSet.has(year)) {
        newSet.delete(year)
      } else {
        newSet.add(year)
      }
      return newSet
    })
  }

  const getMeetingStatusLabel = (status: BoardMeeting['status']): MeetingStatus => {
    const labels: Record<BoardMeeting['status'], MeetingStatus> = {
      'planerad': 'Planerad',
      'genomförd': 'Genomförd',
      'protokoll signerat': 'Signerat',
    }
    return labels[status]
  }

  const getMeetingTypeLabel = (type: BoardMeeting['type']) => {
    switch (type) {
      case 'ordinarie': return 'Ordinarie'
      case 'extra': return 'Extra'
      case 'konstituerande': return 'Konstituerande'
    }
  }

  const handleGenerateAISummary = async (meeting: BoardMeeting) => {
    setIsGeneratingAI(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsGeneratingAI(false)
  }

  const statusFilterOptions: { value: StatusFilter; label: string; count: number }[] = [
    { value: 'all', label: 'Alla', count: meetings.length },
    { value: 'planerad', label: 'Planerade', count: stats.planned },
    { value: 'genomförd', label: 'Genomförda', count: stats.completed },
    { value: 'protokoll signerat', label: 'Signerade', count: stats.signed },
  ]

  // Determine Hero Meeting (Priority: Planned > Signed > Completed)
  const heroMeeting = useMemo(() => {
    const planned = meetings.filter(m => m.status === 'planerad').sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]
    if (planned) return { meeting: planned, label: 'Nästa möte' }

    const latest = meetings.filter(m => m.status !== 'planerad').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
    if (latest) return { meeting: latest, label: 'Senaste protokoll' }

    return null
  }, [meetings])

  if (isLoadingDocuments) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-[400px]">
          <div className="md:col-span-8 h-full bg-muted animate-pulse rounded-xl" />
          <div className="md:col-span-4 flex flex-col gap-6 h-full">
            <div className="flex-1 bg-muted animate-pulse rounded-xl" />
            <div className="flex-1 bg-muted animate-pulse rounded-xl" />
          </div>
        </div>
        <div className="border-b-2 border-border/60" />
        <Card className="h-96 bg-muted animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Bento Grid Header */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Hero Card: Next/Latest Meeting */}
        <div className="md:col-span-8">
          <Card className="h-full bg-muted/20 border-border hover:bg-muted/30 transition-colors">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <Badge variant="outline" className="mb-2 bg-background">
                    {heroMeeting?.label || 'Översikt'}
                  </Badge>
                  <CardTitle className="text-3xl font-bold tracking-tight">
                    {heroMeeting ? `Styrelsemöte #${heroMeeting.meeting.meetingNumber}` : 'Styrelseprotokoll'}
                  </CardTitle>
                  <CardDescription className="text-base mt-2">
                    {heroMeeting ? (
                      <span className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4" />
                          {formatDateLong(heroMeeting.meeting.date)}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <MapPin className="h-4 w-4" />
                          {heroMeeting.meeting.location}
                        </span>
                      </span>
                    ) : (
                      "Samlade protokoll och beslutsunderlag från styrelsemöten."
                    )}
                  </CardDescription>
                </div>
                {heroMeeting && (
                  <Button variant="default" onClick={() => setSelectedMeeting(selectedMeeting?.id === heroMeeting.meeting.id ? null : heroMeeting.meeting)}>
                    <FileText className="h-4 w-4 mr-2" />
                    Visa detaljer
                  </Button>
                )}
              </div>
            </CardHeader>
            {heroMeeting && (
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border/50">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">Status</span>
                    <AppStatusBadge status={getMeetingStatusLabel(heroMeeting.meeting.status)} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">Ordförande</span>
                    <span className="font-medium text-sm truncate">{heroMeeting.meeting.chairperson}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">Antal beslut</span>
                    <span className="font-medium text-sm tabular-nums">
                      {heroMeeting.meeting.agendaItems.filter(i => i.decision).length} st
                    </span>
                  </div>
                </div>
              </CardContent>
            )}
            {!heroMeeting && (
              <CardContent className="flex items-center justify-center h-32">
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Skapa första protokollet
                </Button>
              </CardContent>
            )}
          </Card>
        </div>

        {/* Right Column: Stats & Actions */}
        <div className="md:col-span-4 flex flex-col gap-4">
          {/* Quick Stats Row */}
          <div className="grid grid-cols-2 gap-4 flex-1">
            <Card className="flex flex-col justify-center p-4 bg-background border-border shadow-sm">
              <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                <CheckCircle className="h-4 w-4" />
                <span className="text-xs font-medium">Signerade</span>
              </div>
              <p className="text-2xl font-bold tabular-nums">{stats.signed}</p>
            </Card>
            <Card className="flex flex-col justify-center p-4 bg-background border-border shadow-sm">
              <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                <FileCheck className="h-4 w-4" />
                <span className="text-xs font-medium">Beslut</span>
              </div>
              <p className="text-2xl font-bold tabular-nums">{stats.totalDecisions}</p>
            </Card>
          </div>

          {/* Create New Action Card */}
          <div
            className="flex-1 rounded-xl border border-dashed border-border hover:border-primary/50 hover:bg-muted/30 transition-all cursor-pointer flex flex-col items-center justify-center p-6 text-center group"
            onClick={() => setShowCreateDialog(true)}
          >
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
              <Plus className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold">Nytt protokoll</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-[150px]">Skapa och signera digitalt</p>
          </div>
        </div>
      </div>

      {/* Section Separator */}
      <div className="border-b-2 border-border/60" />

      {/* Filters Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Status Filter Tabs */}
        <FilterTabs
          options={statusFilterOptions}
          value={statusFilter}
          onChange={(v) => setStatusFilter(v as StatusFilter)}
        />

        {/* Search */}
        <SearchBar
          placeholder="Sök i protokoll..."
          value={searchQuery}
          onChange={setSearchQuery}
          className="flex-1 max-w-sm"
        />

        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportera
          </Button>
        </div>
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Skapa nytt styrelsemötesprotokoll</DialogTitle>
            <DialogDescription>
              Fyll i grundläggande information om mötet
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Datum</Label>
                <Input type="date" />
              </div>
              <div className="space-y-2">
                <Label>Mötesnummer</Label>
                <Input type="number" placeholder={`${meetings.length + 1}`} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Plats</Label>
              <Input placeholder="Kontoret, Digitalt via Teams..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ordförande</Label>
                <Input placeholder="Namn" />
              </div>
              <div className="space-y-2">
                <Label>Sekreterare</Label>
                <Input placeholder="Namn" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Mötestyp</Label>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">Ordinarie</Button>
                <Button variant="outline" size="sm" className="flex-1">Extra</Button>
                <Button variant="outline" size="sm" className="flex-1">Konstituerande</Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Avbryt
            </Button>
            <Button onClick={() => setShowCreateDialog(false)}>
              <Sparkles className="h-4 w-4 mr-2" />
              Skapa med AI-förslag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="space-y-4">
        {
          sortedYears.map((year) => {
            const yearMeetings = meetingsByYear[year] || []
            const isCollapsed = collapsedYears.has(year)
            const isExpanded = !isCollapsed
            return (
              <Collapsible key={year} open={isExpanded} onOpenChange={() => toggleYearCollapsed(year)}>
                <CollapsibleTrigger asChild>
                  <button className="flex items-center gap-3 w-full p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left">
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    )}
                    <span className="font-semibold text-lg">{year}</span>
                    <Badge variant="secondary" className="ml-2">
                      {yearMeetings.length} {yearMeetings.length === 1 ? 'möte' : 'möten'}
                    </Badge>
                    <div className="ml-auto flex gap-2">
                      <Badge variant="outline" className="text-xs">
                        {yearMeetings.filter(m => m.status === 'protokoll signerat').length} signerade
                      </Badge>
                    </div>
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3 space-y-3">
                  {yearMeetings.map((meeting) => (
                    <Card
                      key={meeting.id}
                      className={cn(
                        "cursor-pointer transition-all hover:shadow-md ml-6",
                        selectedMeeting?.id === meeting.id && "ring-2 ring-primary"
                      )}
                      onClick={() => setSelectedMeeting(selectedMeeting?.id === meeting.id ? null : meeting)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="text-lg flex items-center gap-2">
                              Styrelsemöte #{meeting.meetingNumber}
                              <Badge variant="outline">{getMeetingTypeLabel(meeting.type)}</Badge>
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
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {meeting.attendees.length} deltagare
                              </span>
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
                                {meeting.status === 'genomförd' && (
                                  <DropdownMenuItem>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Markera som signerat
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => handleGenerateAISummary(meeting)}>
                                  <Sparkles className="h-4 w-4 mr-2" />
                                  Generera AI-sammanfattning
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
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Ordförande:</span>
                                <span className="font-medium">{meeting.chairperson}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Sekreterare:</span>
                                <span className="font-medium">{meeting.secretary}</span>
                              </div>
                            </div>

                            {/* Attendees */}
                            <div className="text-sm">
                              <p className="text-muted-foreground mb-2">Närvarande:</p>
                              <div className="flex flex-wrap gap-2">
                                {meeting.attendees.map((attendee, idx) => (
                                  <Badge key={idx} variant="secondary">{attendee}</Badge>
                                ))}
                                {meeting.attendees.length === 0 && (
                                  <span className="text-muted-foreground italic">Ej registrerat</span>
                                )}
                              </div>
                            </div>

                            {/* Agenda & Decisions */}
                            <div className="text-sm">
                              <p className="text-muted-foreground mb-2">Dagordning & beslut:</p>
                              <div className="space-y-2">
                                {meeting.agendaItems.map((item) => (
                                  <div key={item.id} className="p-3 rounded-lg bg-muted/50">
                                    <div className="flex items-start gap-2">
                                      <span className="font-mono text-xs bg-background px-1.5 py-0.5 rounded border">
                                        §{item.number}
                                      </span>
                                      <div className="flex-1">
                                        <p className="font-medium">{item.title}</p>
                                        {item.description && (
                                          <p className="text-muted-foreground text-xs mt-1">{item.description}</p>
                                        )}
                                        {item.decision && (
                                          <p className="text-green-700 dark:text-green-400 text-xs mt-1">
                                            <span className="font-medium">Beslut:</span> {item.decision}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* AI Generation */}
                            <div className="flex gap-2 pt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleGenerateAISummary(meeting)}
                                disabled={isGeneratingAI}
                              >
                                <Sparkles className="h-4 w-4 mr-2" />
                                {isGeneratingAI ? 'Genererar...' : 'AI-sammanfattning'}
                              </Button>
                              <Button variant="outline" size="sm">
                                <Download className="h-4 w-4 mr-2" />
                                Ladda ned PDF
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )
          })
        }
      </div >

      {
        filteredMeetings.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Inga protokoll hittades</p>
          </div>
        )
      }
    </div >
  )
}
