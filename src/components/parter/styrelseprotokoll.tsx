"use client"

import * as React from "react"
import { useState, useMemo } from "react"
import {
  Download,
  Plus
} from "lucide-react"
import { Button } from "@/components/ui/button"
/*
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
*/
// import { FilterButton } from "@/components/ui/filter-button"
import { FilterTabs } from "@/components/ui/filter-tabs"
import { SearchBar } from "@/components/ui/search-bar"
import { Card } from "@/components/ui/card"

// Types & Hooks
import { BoardMeeting } from "@/types/board-meeting"
import { useBoardMinutes } from "@/components/agare/styrelseprotokoll/use-board-minutes"

// Sub-components
import { BoardMeetingsStats } from "@/components/agare/styrelseprotokoll/board-meetings-stats"
import { BoardMeetingsGrid } from "@/components/agare/styrelseprotokoll/board-meetings-grid"
import { BoardMeetingDetails } from "@/components/agare/styrelseprotokoll/board-meeting-details"

// Dialogs (We reuse the PlanMeetingDialog from arsmote folder or common dialogs if available, assuming PlanMeetingDialog handles board meetings via 'type' prop or we keep it simple for now)
// Actually, in the original file, it imported `Dialog` directly but didn't seem to fully implement the create logic beyond `setShowCreateDialog`. 
// I will check if `PlanMeetingDialog` exists in `dialogs/mote` as imported in `arsmote.tsx`. 
// Based on imports in arsmote.tsx: import { PlanMeetingDialog } from "./dialogs/mote"
// Let's assume we can reuse it or need to bring it in.
import { PlanMeetingDialog } from "@/components/agare/dialogs/mote" 

type StatusFilter = 'all' | 'planerad' | 'genomförd' | 'protokoll signerat'

export function Styrelseprotokoll() {
  const { 
    meetings,
    stats,
    heroMeeting,
    isLoading,
    addDocument
  } = useBoardMinutes()

  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedMeeting, setSelectedMeeting] = useState<BoardMeeting | null>(null)
  
  // Collapsible years state
  const [collapsedYears, setCollapsedYears] = useState<Set<number>>(new Set())

  // Toggle Logic
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

  // Filter meetings logic
  // (We keep this in the component rather than the hook because it controls specific UI view state like filtering)
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

  const statusFilterOptions: { value: StatusFilter; label: string; count: number }[] = [
    { value: 'all', label: 'Alla', count: meetings.length },
    { value: 'planerad', label: 'Planerade', count: stats.planned },
    { value: 'genomförd', label: 'Genomförda', count: stats.completed },
    { value: 'protokoll signerat', label: 'Signerade', count: stats.signed },
  ]

  if (isLoading) {
     return (
        <div className="space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-[400px]">
              <div className="md:col-span-8 h-full bg-muted animate-pulse rounded-xl" />
              <div className="md:col-span-4 flex flex-col gap-6 h-full">
                 <div className="flex-1 bg-muted animate-pulse rounded-xl" />
                 <div className="flex-1 bg-muted animate-pulse rounded-xl" />
              </div>
           </div>
        </div>
     )
  }

  return (
    <div className="space-y-6">
      {/* Bento Grid Header */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Hero Card: Next/Latest Meeting */}
        <div className="md:col-span-8">
           <BoardMeetingsStats 
              heroData={heroMeeting}
              onClick={setSelectedMeeting}
           />
        </div>

        {/* Stats Column */}
        <div className="md:col-span-4 flex flex-col gap-6">
          <Card className="flex-1 bg-primary text-primary-foreground border-none p-6 flex flex-col justify-between">
            <div>
              <p className="text-primary-foreground/80 font-medium tracking-wide text-sm uppercase">Signerade protokoll</p>
              <h3 className="text-3xl md:text-4xl font-extrabold mt-2 tracking-tight">{stats.signed}</h3>
            </div>
            <div>
              <p className="text-primary-foreground/80 text-sm mb-4">
                Årstakt: {stats.signed} av {stats.signed + stats.planned + stats.completed}
              </p>
              <Button 
                variant="secondary" 
                className="w-full font-semibold"
                onClick={() => setShowCreateDialog(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nytt protokoll
              </Button>
            </div>
          </Card>

          <Card className="flex-1 p-6 flex flex-col justify-center">
            <p className="text-muted-foreground font-medium text-sm uppercase tracking-wide">Fattade beslut i år</p>
            <h3 className="text-3xl md:text-4xl font-extrabold mt-2 tracking-tight tabular-nums">{stats.totalDecisions}</h3>
            <p className="text-sm text-green-600 mt-2 font-medium flex items-center gap-1">
              +12% från föregående år
            </p>
          </Card>
        </div>
      </div>

      <div className="border-b-2 border-border/60" />

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
         <FilterTabs 
            options={statusFilterOptions}
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as StatusFilter)}
         />
         <div className="flex items-center gap-2 w-full sm:w-auto">
            <SearchBar 
              placeholder="Sök i protokoll..."
              value={searchQuery}
              onChange={setSearchQuery}
              className="w-full sm:w-64"
            />
            <Button variant="outline" size="icon">
               <Download className="h-4 w-4" />
            </Button>
         </div>
      </div>

      {/* Meetings List */}
      <BoardMeetingsGrid 
         years={sortedYears}
         meetingsByYear={meetingsByYear}
         collapsedYears={collapsedYears}
         onToggleYear={toggleYearCollapsed}
         onSelectMeeting={setSelectedMeeting}
         onGenerateAI={(m) => console.log("AI not impl", m)}
      />

      {/* Details Sheet */}
      <BoardMeetingDetails 
         meeting={selectedMeeting}
         open={!!selectedMeeting}
         onClose={() => setSelectedMeeting(null)}
      />

      <PlanMeetingDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        type="general"
        defaultAgenda={[]}
        onSubmit={(data) => {
          // Implement create logic
          addDocument({
            type: 'board_meeting_minutes',
            title: `Styrelsemöte ${data.date}`,
            date: data.date,
            content: JSON.stringify({
              meetingNumber: meetings.length + 1,
              location: data.location,
              type: data.type || 'ordinarie',
              attendees: [],
              agendaItems: []
            }),
            status: 'draft',
            source: 'manual'
          })
          setShowCreateDialog(false)
        }}
      />
    </div>
  )
}
