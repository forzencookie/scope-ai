"use client"

import * as React from "react"
import { useState, useMemo } from "react"
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
import { StatCard, StatCardGrid } from "@/components/ui/stat-card"

type StatusFilter = 'all' | 'planerad' | 'genomförd' | 'protokoll signerat'

export function Styrelseprotokoll() {
  const { companyType } = useCompany()
  const [meetings] = useState<BoardMeeting[]>(mockBoardMeetings)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedMeeting, setSelectedMeeting] = useState<BoardMeeting | null>(null)
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [collapsedYears, setCollapsedYears] = useState<Set<number>>(new Set())

  // Calculate stats
  const stats = useMemo(() => {
    const signed = meetings.filter(m => m.status === 'protokoll signerat').length
    const completed = meetings.filter(m => m.status === 'genomförd').length
    const planned = meetings.filter(m => m.status === 'planerad').length
    const totalDecisions = meetings.reduce((sum, m) => 
      sum + m.agendaItems.filter(a => a.decision).length, 0
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

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <StatCardGrid columns={4}>
        <StatCard
          label="Totalt protokoll"
          value={meetings.length.toString()}
          subtitle="registrerade möten"
          icon={FileText}
        />
        <StatCard
          label="Signerade"
          value={stats.signed.toString()}
          subtitle={`av ${meetings.length} protokoll`}
          icon={CheckCircle}
        />
        <StatCard
          label="Planerade"
          value={stats.planned.toString()}
          subtitle="kommande möten"
          icon={Clock}
        />
        <StatCard
          label="Beslut"
          value={stats.totalDecisions.toString()}
          subtitle="dokumenterade beslut"
          icon={FileCheck}
        />
      </StatCardGrid>

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
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nytt protokoll
              </Button>
            </DialogTrigger>
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
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportera
          </Button>
        </div>
      </div>

      {/* Meetings List - Grouped by Year */}
      <div className="space-y-4">
        {sortedYears.map((year) => {
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
          })}
      </div>

      {filteredMeetings.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Inga protokoll hittades</p>
        </div>
      )}
    </div>
  )
}
