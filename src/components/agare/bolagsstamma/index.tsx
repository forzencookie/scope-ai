"use client"

import * as React from "react"
import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SearchBar } from "@/components/ui/search-bar"
import { PageHeader } from "@/components/shared"
import { MeetingStats } from "./meeting-stats"
import { UpcomingAlert } from "./upcoming-alert"
import { GeneralMeetingsGrid } from "./general-meetings-grid"
import { useGeneralMeetings } from "./use-general-meetings"
import { PlanMeetingDialog } from "../dialogs/mote"
import { SendNoticeDialog } from "../dialogs/kallelse"

export function Bolagsstamma() {
  const { meetings, stats, bookDividend } = useGeneralMeetings()

  const [searchQuery, setSearchQuery] = useState("")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showSendNoticeDialog, setShowSendNoticeDialog] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filteredMeetings = React.useMemo(() => {
    return meetings.filter(meeting => {
      const matchesSearch = 
        meeting.year.toString().includes(searchQuery) ||
        meeting.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
        meeting.decisions.some(d => d.title.toLowerCase().includes(searchQuery.toLowerCase()))
      return matchesSearch
    })
  }, [meetings, searchQuery])

  return (
    <div className="space-y-4 md:space-y-6">
      <PageHeader
        title="Bolagsstämma"
        subtitle="Protokoll, kallelser och beslut från bolagsstämmor."
        actions={
          <Button size="sm" onClick={() => setShowCreateDialog(true)} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Planera stämma</span>
            <span className="sm:hidden">Planera</span>
          </Button>
        }
      />

      <MeetingStats stats={stats} />
      
      <UpcomingAlert stats={stats} />

      <div className="flex flex-wrap items-center justify-between gap-3 md:gap-4">
         <SearchBar 
            placeholder="Sök på år, status eller beslut..." 
            value={searchQuery}
            onChange={setSearchQuery}
            className="w-full sm:max-w-md bg-background"
         />
      </div>

      <GeneralMeetingsGrid 
         meetings={filteredMeetings} 
         expandedId={expandedId}
         onToggleExpand={(id) => setExpandedId(prev => prev === id ? null : id)}
         onBookDecision={bookDividend}
         searchQuery={searchQuery}
      />
      
      <PlanMeetingDialog 
        open={showCreateDialog} 
        onOpenChange={setShowCreateDialog}
        type="general"
        defaultAgenda={["Fastställande av dagordning", "Val av ordförande", "Val av protokollförare"]}
      />
      <SendNoticeDialog 
        open={showSendNoticeDialog} 
        onOpenChange={setShowSendNoticeDialog}
        variant="corporate"
        recipientCount={2}
      />
    </div>
  )
}
