"use client"

import * as React from "react"
import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SearchBar } from "@/components/ui/search-bar"
import { FilterTabs } from "@/components/ui/filter-tabs"
import { PageHeader } from "@/components/shared"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MeetingStats } from "./meeting-stats"
import { UpcomingAlert } from "./upcoming-alert"
import { GeneralMeetingsGrid } from "./general-meetings-grid"
import { useGeneralMeetings } from "./use-general-meetings"
import { PlanMeetingDialog, type MeetingFormData } from "../dialogs/mote"
import { MeetingViewDialog } from "../dialogs/meeting-view"
import { type GeneralMeeting } from "@/types/ownership"

type CategoryFilter = 'alla' | 'bolagsstamma' | 'styrelsemote'

export function Bolagsstamma() {
  const { meetings, stats, bookDividend, createMeeting, createBoardMeeting, saveKallelse, updateMeeting, getKallelseRecipients } = useGeneralMeetings()

  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('alla')
  const [showCreateStammaDialog, setShowCreateStammaDialog] = useState(false)
  const [showCreateBoardDialog, setShowCreateBoardDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [selectedMeeting, setSelectedMeeting] = useState<GeneralMeeting | null>(null)

  const filteredMeetings = React.useMemo(() => {
    return meetings.filter(meeting => {
      // Category filter
      if (categoryFilter !== 'alla' && meeting.meetingCategory !== categoryFilter) return false

      // Search filter
      const matchesSearch = !searchQuery ||
        meeting.year.toString().includes(searchQuery) ||
        meeting.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
        meeting.decisions.some(d => d.title.toLowerCase().includes(searchQuery.toLowerCase()))
      return matchesSearch
    })
  }, [meetings, searchQuery, categoryFilter])

  const categoryFilterOptions = React.useMemo(() => {
    const stammaCount = meetings.filter(m => m.meetingCategory === 'bolagsstamma').length
    const boardCount = meetings.filter(m => m.meetingCategory === 'styrelsemote').length
    return [
      { value: 'alla', label: 'Alla', count: meetings.length },
      { value: 'bolagsstamma', label: 'Bolagsstämma', count: stammaCount },
      { value: 'styrelsemote', label: 'Styrelsemöte', count: boardCount },
    ]
  }, [meetings])

  const handleSaveMeeting = async (data: MeetingFormData) => {
    await createMeeting({
      date: data.date,
      year: data.year,
      time: data.time,
      location: data.location || 'Ej angivet',
      type: data.type,
      agenda: data.agenda
    })
  }

  const handleSaveBoardMeeting = async (data: MeetingFormData) => {
    await createBoardMeeting({
      date: data.date,
      time: data.time,
      location: data.location || 'Ej angivet',
      type: data.type,
    })
  }

  const handleMeetingClick = (meetingId: string) => {
    const meeting = meetings.find(m => m.id === meetingId)
    if (meeting) {
      setSelectedMeeting(meeting)
      setShowViewDialog(true)
    }
  }

  const handleUpdateMeeting = async (meeting: GeneralMeeting, updates: Partial<GeneralMeeting>) => {
    await updateMeeting(meeting.id, updates)
    setSelectedMeeting(prev => prev ? { ...prev, ...updates } : null)
  }

  const handleSaveKallelse = async (meetingId: string, kallelseText: string) => {
    await saveKallelse(meetingId, kallelseText)
    setSelectedMeeting(prev => prev ? { ...prev, kallelseText, kallelseSavedAt: new Date().toISOString() } : null)
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <PageHeader
        title="Möten & Protokoll"
        subtitle="Bolagsstämmor och styrelsemöten med protokoll, kallelser och beslut."
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="w-full sm:w-auto">
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Nytt möte</span>
                <span className="sm:hidden">Nytt</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowCreateStammaDialog(true)}>
                Planera bolagsstämma
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowCreateBoardDialog(true)}>
                Nytt styrelsemöte
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

      <MeetingStats stats={stats} />

      <UpcomingAlert stats={stats} />

      <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-between items-start sm:items-center">
        <FilterTabs
          options={categoryFilterOptions}
          value={categoryFilter}
          onChange={(v) => setCategoryFilter(v as CategoryFilter)}
          size="sm"
        />
        <SearchBar
          placeholder="Sök på år, status eller beslut..."
          value={searchQuery}
          onChange={setSearchQuery}
          className="w-full sm:max-w-md bg-background"
        />
      </div>

      <GeneralMeetingsGrid
         meetings={filteredMeetings}
         onMeetingClick={handleMeetingClick}
         onBookDecision={bookDividend}
         searchQuery={searchQuery}
      />

      {/* Meeting view/edit dialog */}
      <MeetingViewDialog
        open={showViewDialog}
        onOpenChange={setShowViewDialog}
        meeting={selectedMeeting}
        onUpdate={handleUpdateMeeting}
        onSaveKallelse={handleSaveKallelse}
        onBookDecision={bookDividend}
        kallelseRecipients={getKallelseRecipients()}
      />

      {/* Create bolagsstämma dialog */}
      <PlanMeetingDialog
        open={showCreateStammaDialog}
        onOpenChange={setShowCreateStammaDialog}
        type="general"
        onSubmit={handleSaveMeeting}
      />

      {/* Create styrelsemöte dialog */}
      <PlanMeetingDialog
        open={showCreateBoardDialog}
        onOpenChange={setShowCreateBoardDialog}
        type="board"
        onSubmit={handleSaveBoardMeeting}
      />
    </div>
  )
}
