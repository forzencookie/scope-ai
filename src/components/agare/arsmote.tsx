"use client"

import * as React from "react"
import { useState, useMemo, memo } from "react"
import {
  Plus,
  Download,
  CheckCircle,
  Clock,
  FileText,
  Send,
  MessageSquare,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { SearchBar } from "@/components/ui/search-bar"
import { FilterButton } from "@/components/ui/filter-button"
import { PageHeader } from "@/components/shared"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent } from "@/components/ui/card"
import { HandHeart } from "lucide-react"

// Dialogs
import { MotionDialog } from "./dialogs/motion"
import { PlanMeetingDialog } from "./dialogs/mote"
import { SendNoticeDialog } from "./dialogs/kallelse"

// Components
import { NextMeetingCard } from "./arsmote/next-meeting-card"
import { AnnualMeetingsGrid } from "./arsmote/annual-meetings-grid"
import { MeetingDetails } from "./arsmote/meeting-details"
import { useArsmoteStats } from "./arsmote/use-arsmote-stats"

// Types
import { type AnnualMeeting } from "@/types/meeting"

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

export const Arsmote = memo(function Arsmote() {
  const { 
    meetings, 
    stats, 
    isLoading, 
    members,
    addDocument
  } = useArsmoteStats()

  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  
  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showMotionDialog, setShowMotionDialog] = useState(false)
  const [showSendNoticeDialog, setShowSendNoticeDialog] = useState(false)
  
  // Selection states
  const [selectedMeeting, setSelectedMeeting] = useState<AnnualMeeting | null>(null)
  const [noticeMeeting, setNoticeMeeting] = useState<AnnualMeeting | null>(null)

  // Filter meetings
  const filteredMeetings = useMemo(() => {
    let result = meetings

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(m =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (m.decisions || []).some((d: any) =>
          d.title?.toLowerCase().includes(query) ||
          d.decision?.toLowerCase().includes(query)
        ) ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  const handleOpenNotice = (meeting: AnnualMeeting) => {
    setNoticeMeeting(meeting)
    setShowSendNoticeDialog(true)
  }

  if (isLoading) {
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
    <div className="space-y-4 md:space-y-6">
      {/* Page Heading */}
      <PageHeader
        title="Årsmöte"
        subtitle="Planera, dokumentera och förvalta föreningens årsmöten."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => setShowMotionDialog(true)} className="flex-1 sm:flex-none">
              <MessageSquare className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Ny motion</span>
            </Button>
            <Button size="sm" onClick={() => setShowCreateDialog(true)} className="flex-1 sm:flex-none">
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Planera årsmöte</span>
            </Button>
          </>
        }
      />

      {/* Next Meeting Hero Card */}
      <NextMeetingCard
        nextMeeting={stats.nextMeeting}
        prepProgress={stats.prepProgress}
        preparationItems={stats.preparationItems}
        stats={stats}
        onOpenCreateDialog={() => setShowCreateDialog(true)}
      />

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
      <AnnualMeetingsGrid
        meetings={filteredMeetings}
        selectedMeetingId={selectedMeeting?.id || null}
        onSelectMeeting={setSelectedMeeting}
        onOpenNotice={handleOpenNotice}
      />

      {/* Expanded Meeting Details */}
      {selectedMeeting && (
        <MeetingDetails
          meeting={selectedMeeting}
          onClose={() => setSelectedMeeting(null)}
        />
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
        recipientCount={members.filter(m => m.status === 'aktiv').length}
        meeting={noticeMeeting || undefined}
        onSubmit={() => console.log("Notice prepared")}
      />
    </div>
  )
})

Arsmote.displayName = 'Arsmote'
