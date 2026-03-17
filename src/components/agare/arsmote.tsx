"use client"

import * as React from "react"
import { useState, useMemo, memo } from "react"
import {
  Download,
  CheckCircle,
  Clock,
  FileText,
  Send,
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

// Components
import { NextMeetingCard } from "./arsmote/next-meeting-card"
import { AnnualMeetingsGrid } from "./arsmote/annual-meetings-grid"
import { MeetingDetails } from "./arsmote/meeting-details"
import { useArsmoteStats } from "./arsmote/use-arsmote-stats"

// Types
import { type AnnualMeeting, type Decision, type Motion } from "@/types/meeting"

export const Arsmote = memo(function Arsmote() {
  const {
    meetings,
    stats,
    isLoading,
  } = useArsmoteStats()

  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string | null>(null)

  // Selection states
  const [selectedMeeting, setSelectedMeeting] = useState<AnnualMeeting | null>(null)

  // Filter meetings
  const filteredMeetings = useMemo(() => {
    let result = meetings

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(m =>
        (m.decisions || []).some((d: Decision) =>
          d.title?.toLowerCase().includes(query) ||
          d.decision?.toLowerCase().includes(query)
        ) ||
        (m.motions || []).some((mo: Motion) =>
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
      />

      {/* Next Meeting Hero Card */}
      <NextMeetingCard
        nextMeeting={stats.nextMeeting}
        prepProgress={stats.prepProgress}
        preparationItems={stats.preparationItems}
        stats={stats}
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
            <p className="text-sm text-muted-foreground">
              Be Scooby planera ett årsmöte via chatten.
            </p>
          </CardContent>
        </Card>
      )}

    </div>
  )
})

Arsmote.displayName = 'Arsmote'
