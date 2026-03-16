"use client"

import * as React from "react"
import { useState } from "react"
import { SearchBar } from "@/components/ui/search-bar"
import { FilterTabs } from "@/components/ui/filter-tabs"
import { PageHeader } from "@/components/shared"
import { MeetingStats } from "./meeting-stats"
import { UpcomingAlert } from "./upcoming-alert"
import { GeneralMeetingsGrid } from "./general-meetings-grid"
import { useGeneralMeetings } from "./use-general-meetings"
import { MeetingViewDialog } from "../dialogs/meeting-view"
import { type GeneralMeeting } from "@/types/ownership"

type CategoryFilter = 'alla' | 'bolagsstamma' | 'styrelsemote'

export function Bolagsstamma() {
  const { meetings, stats, bookDividend, saveKallelse, updateMeeting, getKallelseRecipients } = useGeneralMeetings()

  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('alla')
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
      />

      <MeetingStats stats={stats} />

      <UpcomingAlert stats={stats} onPrepare={handleMeetingClick} />

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

    </div>
  )
}
