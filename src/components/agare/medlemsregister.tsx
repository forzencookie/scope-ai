"use client"

import * as React from "react"
import { useState, useMemo } from "react"
import { formatDate } from "@/lib/utils"
import {
  Users,
  Mail,
  Phone,
  Plus,
  MoreHorizontal,
  Download,
  AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { SearchBar } from "@/components/ui/search-bar"
import { FilterButton } from "@/components/ui/filter-button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import {
  GridTableHeader,
  GridTableRow,
  GridTableRows,
} from "@/components/ui/grid-table"
import { cn } from "@/lib/utils"
import { AppStatusBadge } from "@/components/ui/status-badge"
import { type MembershipStatus, type MembershipChangeType } from "@/lib/status-types"
import { type MembershipChange } from "@/data/ownership"
import { useBulkSelection } from "@/components/shared/bulk-action-toolbar"
import { useMembers, type Member } from "@/hooks/use-members"

// Components
import { RightSidebarContent } from "./medlemsregister/right-sidebar-content"
import { useMemberStats } from "./medlemsregister/use-member-stats"
import { MemberStatsGrid } from "./medlemsregister/member-stats-grid"
import { AddMemberDialog } from "./medlemsregister/add-member-dialog"

// Helper to convert member status to centralized status type
const getMembershipStatusLabel = (status: Member['status']): MembershipStatus => {
  const labels: Record<Member['status'], MembershipStatus> = {
    aktiv: 'Aktiv',
    vilande: 'Vilande',
    avslutad: 'Avslutad',
  }
  return labels[status]
}

// Helper to convert change type to centralized status type  
const getMembershipChangeTypeLabel = (changeType: MembershipChange['changeType']): MembershipChangeType => {
  const labels: Record<MembershipChange['changeType'], MembershipChangeType> = {
    'gått med': 'Gått med',
    'lämnat': 'Lämnat',
    'statusändring': 'Statusändring',
    'rollbyte': 'Rollbyte',
  }
  return labels[changeType]
}

export function Medlemsregister() {
  const { members } = useMembers()
  const stats = useMemberStats()
  
  // Local state - membership changes should be fetched from API when available
  const [changes] = useState<MembershipChange[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)

  // Filter members
  const filteredMembers = useMemo(() => {
    let result = members

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(m =>
        m.name.toLowerCase().includes(query) ||
        m.email?.toLowerCase().includes(query) ||
        m.memberNumber.toLowerCase().includes(query)
      )
    }

    if (statusFilter) {
      result = result.filter(m => m.status === statusFilter)
    }

    return result
  }, [members, searchQuery, statusFilter])

  const getMembershipTypeLabel = (type: Member['membershipType']) => {
    switch (type) {
      case 'ordinarie': return 'Ordinarie'
      case 'stödmedlem': return 'Stödmedlem'
      case 'hedersmedlem': return 'Hedersmedlem'
    }
  }

  // Use shared bulk selection hook (must be after filteredMembers is defined)
  const memberSelection = useBulkSelection(filteredMembers)

  return (
    <div className="space-y-6">
      {/* Right Sidebar Portal */}
      <RightSidebarContent 
        changes={changes}
        getMembershipChangeTypeLabel={getMembershipChangeTypeLabel}
        formatDate={formatDate}
      />

      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Medlemsregister</h2>
            <p className="text-muted-foreground mt-1">
              Hantera medlemmar, medlemsavgifter och roller.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportera lista
            </Button>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Lägg till medlem
            </Button>
          </div>
        </div>
      </div>

      <MemberStatsGrid stats={stats} />

      {/* Actions Bar */}
      <div className="flex items-center gap-3">
        <SearchBar
          placeholder="Sök medlem..."
          value={searchQuery}
          onChange={setSearchQuery}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <FilterButton
              label={statusFilter === 'aktiv' ? 'Aktiva' : statusFilter === 'vilande' ? 'Vilande' : 'Alla status'}
              isActive={!!statusFilter}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => setStatusFilter(null)}>Alla status</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setStatusFilter('aktiv')}>Aktiva</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('vilande')}>Vilande</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('avslutad')}>Avslutade</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="ml-auto flex items-center gap-2">
          {memberSelection.selectedCount > 0 && (
            <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-md text-sm">
              <span className="font-medium">{memberSelection.selectedCount} valda</span>
              <Button size="sm" variant="ghost" className="h-6 px-2">Skicka e-post</Button>
            </div>
          )}
        </div>
      </div>

      {/* Members Table */}
      <div className="overflow-x-auto pb-4 -mx-2">
        <div className="min-w-[800px] px-2">
          <GridTableHeader
            minWidth="0"
            columns={[
              { label: "Namn & Medlemsnr", icon: Users, span: 3 },
              { label: "Kontakt", span: 3 },
              { label: "Medlemskap", span: 2 },
              { label: "Status", span: 2 },
              { label: "", span: 1 },
            ]}
          />
          <GridTableRows>
            {filteredMembers.map((member) => (
              <GridTableRow
                key={member.id}
                minWidth="0"
                className={cn("cursor-pointer", memberSelection.isSelected(member.id) && "bg-primary/5")}
                onClick={() => memberSelection.toggleItem(member.id)}
              >
                {/* Namn & Nr */}
                <div className="col-span-3 flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-xs">
                    {member.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium text-sm flex items-center gap-2">
                      {member.name}
                      {member.roles && member.roles.length > 0 && (
                        <Badge variant="outline" className="text-[10px] h-4 px-1">
                          It-ansvarig { /* Mock role display, or implement role mapping */ }
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">#{member.memberNumber}</div>
                  </div>
                </div>

                {/* Kontakt */}
                <div className="col-span-3 space-y-0.5">
                  <div className="flex items-center gap-1.5 text-sm">
                    <Mail className="h-3 w-3 text-muted-foreground" />
                    <span className="truncate max-w-[180px]">{member.email}</span>
                  </div>
                  {member.phone && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      <span>{member.phone}</span>
                    </div>
                  )}
                </div>

                {/* Medlemskap */}
                <div className="col-span-2 space-y-1">
                  <div className="text-sm font-medium">
                    {getMembershipTypeLabel(member.membershipType)}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      member.currentYearFeePaid ? "bg-green-500" : "bg-red-500"
                    )} />
                    {member.currentYearFeePaid ? "Betald" : "Ej betald"}
                  </div>
                </div>

                {/* Status */}
                <div className="col-span-2">
                  <AppStatusBadge status={getMembershipStatusLabel(member.status)} showIcon />
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
                      <DropdownMenuItem>Redigera</DropdownMenuItem>
                      <DropdownMenuItem>Ändra status</DropdownMenuItem>
                      <DropdownMenuItem>Registrera betalning</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">Avsluta medlemskap</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </GridTableRow>
            ))}
          </GridTableRows>
        </div>
      </div>
        
      <AddMemberDialog 
        open={showAddDialog} 
        onOpenChange={setShowAddDialog} 
        memberCount={members.length} 
      />
    </div>
  )
}
