"use client"

import * as React from "react"
import { useState, useMemo, useEffect } from "react"
import { createPortal } from "react-dom"
import { formatCurrency, formatDate } from "@/lib/utils"
import {
  Users,
  Calendar,
  Mail,
  Phone,
  Plus,
  MoreHorizontal,
  Download,
  UserCheck,
  UserX,
  CreditCard,
  Clock,
  Award,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SearchBar } from "@/components/ui/search-bar"
import { FilterButton } from "@/components/ui/filter-button"
import { StatCard, StatCardGrid } from "@/components/ui/stat-card"
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
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
  GridTableHeader,
  GridTableRow,
  GridTableRows,
} from "@/components/ui/grid-table"
import { cn } from "@/lib/utils"
import { AppStatusBadge } from "@/components/ui/status-badge"
import { type MembershipStatus, type MembershipChangeType } from "@/lib/status-types"
import { mockMembers, mockMembershipChanges, type Member, type MembershipChange } from "@/data/ownership"
import { useVerifications } from "@/hooks/use-verifications"
import { useToast } from "@/components/ui/toast"
import { useBulkSelection } from "@/components/shared/bulk-action-toolbar"

// Default membership fee per type
const MEMBERSHIP_FEES: Record<Member['membershipType'], number> = {
  'ordinarie': 500,
  'stödmedlem': 200,
  'hedersmedlem': 0,
}

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

// Component that renders into the right sidebar via portal
function RightSidebarContent({
  changes,
  getMembershipChangeTypeLabel,
  formatDate
}: {
  changes: MembershipChange[]
  getMembershipChangeTypeLabel: (changeType: MembershipChange['changeType']) => MembershipChangeType
  formatDate: (date: string) => string
}) {
  const [sidebarElement, setSidebarElement] = useState<HTMLElement | null>(null)

  useEffect(() => {
    // Find the sidebar slot and update state
    const el = document.getElementById('page-right-sidebar')
    setSidebarElement(el)
  }, [])

  const content = (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Senaste aktivitet</CardTitle>
        <CardDescription className="text-xs">
          Medlemsändringar och händelser
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {changes.map((change) => {
            const changeLabel = getMembershipChangeTypeLabel(change.changeType)
            return (
              <div key={change.id} className="flex items-start gap-3 p-2 rounded-lg bg-muted/50">
                <AppStatusBadge status={changeLabel} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{change.memberName}</p>
                  <p className="text-xs text-muted-foreground truncate">{change.details}</p>
                </div>
                <div className="text-xs text-muted-foreground shrink-0">
                  {formatDate(change.date)}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )

  // If sidebar slot exists and is visible, portal content there
  if (sidebarElement) {
    return createPortal(content, sidebarElement)
  }

  // Fallback: render inline (for smaller screens or if slot not found)
  return content
}

export function Medlemsregister() {
  const { addVerification } = useVerifications()
  const toast = useToast()

  const [members, setMembers] = useState<Member[]>(mockMembers)
  const [changes] = useState<MembershipChange[]>(mockMembershipChanges)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)

  // New Member Form State
  const [newName, setNewName] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [newPhone, setNewPhone] = useState("")
  const [payFee, setPayFee] = useState(true) // Pays Annual Fee
  const [payCapital, setPayCapital] = useState(true) // Pays Initial Capital (Insats)
  const [capitalAmount, setCapitalAmount] = useState("100") // Default insats

  // Fetch stats from server
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    pendingMembers: 0,
    totalFees: 0,
    unpaidFees: 0,
    unpaidCount: 0,
    boardMembers: 0 // Note: RPC doesn't currently return boardMembers count, keeping it 0 or we need to update RPC.
    // Actually, looking at the RPC get_member_stats, it does NOT return boardMembers.
    // The previous client code calculated it: boardMembers: members.filter(m => m.roles.length > 0).length
    // I should probably keep the client-side calc for boardMembers if I don't want to update RPC, or update RPC.
    // For now, I'll use the RPC stats for the main cards.
    // The boardMembers stat is used in "Subtitle" of "Total Members" card.
  })

  useEffect(() => {
    async function fetchStats() {
      const { supabase } = await import('@/lib/supabase')
      const { data, error } = await supabase.rpc('get_member_stats')

      if (!error && data) {
        setStats(prev => ({
          ...prev,
          totalMembers: Number(data.totalMembers) || 0,
          activeMembers: Number(data.activeMembers) || 0,
          pendingMembers: Number(data.pendingMembers) || 0,
          totalFees: Number(data.totalFees) || 0,
          unpaidFees: Number(data.unpaidFees) || 0,
          unpaidCount: Number(data.unpaidCount) || 0
          // boardMembers remains 0 or handled separately
        }))
      }
    }
    fetchStats()
  }, [])

  // Calculate board members client-side for now as it's a small subset usually
  // or just omit if relying purely on RPC.
  // The 'members' state is mockMembers by default, so we can use it.
  const boardMembersCount = useMemo(() => members.filter(m => m.roles.length > 0).length, [members])

  // Merge for display
  const displayStats = {
    ...stats,
    boardMembers: boardMembersCount
  }

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

  const handleAddMember = async () => {
    if (!newName) {
      toast.error("Namn saknas", "Ange namn på medlemmen")
      return
    }

    // 1. Add to local list
    const newMember: Member = {
      id: `m-${Date.now()}`,
      name: newName,
      email: newEmail,
      phone: newPhone,
      memberNumber: (members.length + 1).toString().padStart(3, '0'),
      joinDate: new Date().toISOString().split('T')[0],
      membershipType: 'ordinarie',
      status: 'aktiv',
      feesPaid: payFee,
      currentYearFeePaid: payFee,
      roles: []
    }
    setMembers(prev => [...prev, newMember])

    // 2. Bookkeeping
    const date = new Date().toISOString().split('T')[0]

    // Capital Contribution (Insats) -> 2083
    if (payCapital && capitalAmount) {
      await addVerification({
        date,
        description: `Medlemsinsats ${newName}`,
        sourceType: 'member_capital',
        rows: [
          { account: "1930", description: `Inbetalning insats ${newName}`, debit: parseInt(capitalAmount), credit: 0 },
          { account: "2083", description: `Medlemsinsatser`, debit: 0, credit: parseInt(capitalAmount) }
        ]
      })
    }

    // Annual Fee -> 3890
    if (payFee) {
      const fee = MEMBERSHIP_FEES['ordinarie']
      if (fee > 0) {
        await addVerification({
          date,
          description: `Medlemsavgift ${newName}`,
          sourceType: 'member_fee',
          rows: [
            { account: "1930", description: `Inbetalning avgift ${newName}`, debit: fee, credit: 0 },
            { account: "3890", description: `Medlemsavgifter`, debit: 0, credit: fee }
          ]
        })
      }
    }

    toast.success("Medlem tillagd", `${newName} har lagts till och transaktioner har bokförts.`)
    setShowAddDialog(false)
    setNewName("")
    setNewEmail("")
    setNewPhone("")
  }

  return (
    <div className="space-y-6">
      {/* Page Heading */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Medlemsregister</h2>
            <p className="text-muted-foreground mt-1">
              Hantera föreningens medlemmar och avgifter.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Ny medlem
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Lägg till medlem</DialogTitle>
                  <DialogDescription>
                    Registrera en ny medlem och bokför insatser
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Namn</Label>
                    <Input placeholder="För- och efternamn" value={newName} onChange={e => setNewName(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>E-post</Label>
                      <Input type="email" placeholder="namn@exempel.se" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Telefon</Label>
                      <Input placeholder="070-XXX XX XX" value={newPhone} onChange={e => setNewPhone(e.target.value)} />
                    </div>
                  </div>

                  <div className="border-t pt-4 space-y-3">
                    <Label>Bokföring</Label>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="pay-fee" checked={payFee} onCheckedChange={(c) => setPayFee(Boolean(c))} />
                      <label
                        htmlFor="pay-fee"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Betala årsavgift (500 kr)
                      </label>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="pay-capital" checked={payCapital} onCheckedChange={(c) => setPayCapital(Boolean(c))} />
                        <label
                          htmlFor="pay-capital"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Betala medlemsinsats
                        </label>
                      </div>
                      {payCapital && (
                        <Input
                          type="number"
                          value={capitalAmount}
                          onChange={e => setCapitalAmount(e.target.value)}
                          className="w-32 mt-1"
                          placeholder="Belopp"
                        />
                      )}
                    </div>
                  </div>

                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    Avbryt
                  </Button>
                  <Button onClick={handleAddMember}>
                    Spara & Bokför
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
      {/* Membership Health Dashboard */}
      <div className="rounded-xl border bg-muted/20 p-5">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: Fee Collection Progress */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold">Avgiftsinsamling {new Date().getFullYear()}</h3>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-muted-foreground">
                  {displayStats.totalMembers - displayStats.unpaidCount} av {displayStats.totalMembers} har betalt
                </span>
                <span className="text-sm font-medium">
                  {displayStats.totalMembers > 0
                    ? Math.round(((displayStats.totalMembers - displayStats.unpaidCount) / displayStats.totalMembers) * 100)
                    : 0}%
                </span>
              </div>
              <div className="h-3 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-foreground/80 rounded-full transition-all duration-500"
                  style={{
                    width: displayStats.totalMembers > 0
                      ? `${((displayStats.totalMembers - displayStats.unpaidCount) / displayStats.totalMembers) * 100}%`
                      : '0%'
                  }}
                />
              </div>
              <div className="flex justify-between mt-2 text-sm">
                <span className="font-medium">
                  {formatCurrency(displayStats.totalFees - displayStats.unpaidFees)} inbetalt
                </span>
                {displayStats.unpaidFees > 0 && (
                  <span className="text-muted-foreground">
                    {formatCurrency(displayStats.unpaidFees)} kvar att samla in
                  </span>
                )}
              </div>
            </div>

            {/* Member Status Visual Breakdown */}
            <div className="flex items-center gap-4 pt-3 border-t border-border/50">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-foreground" />
                <span className="text-sm">{displayStats.activeMembers} aktiva</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-foreground/50" />
                <span className="text-sm">{displayStats.pendingMembers} vilande</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-foreground/30" />
                <span className="text-sm">{displayStats.boardMembers} i styrelsen</span>
              </div>
            </div>
          </div>

          {/* Right: Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-3 lg:w-auto lg:min-w-[280px]">
            <div className="flex flex-col p-3.5 rounded-lg bg-background/60 border border-border/50">
              <Users className="h-4 w-4 text-muted-foreground mb-1.5" />
              <p className="text-2xl font-bold tabular-nums">{displayStats.totalMembers}</p>
              <p className="text-xs text-muted-foreground">Medlemmar</p>
            </div>
            <div className="flex flex-col p-3.5 rounded-lg bg-background/60 border border-border/50">
              <UserCheck className="h-4 w-4 text-muted-foreground mb-1.5" />
              <p className="text-2xl font-bold tabular-nums">{displayStats.activeMembers}</p>
              <p className="text-xs text-muted-foreground">Aktiva</p>
            </div>
            <div className="flex flex-col p-3.5 rounded-lg bg-background/60 border border-border/50">
              <CreditCard className="h-4 w-4 text-muted-foreground mb-1.5" />
              <p className="text-2xl font-bold tabular-nums">{formatCurrency(displayStats.totalFees)}</p>
              <p className="text-xs text-muted-foreground">Avgifter</p>
            </div>
            <div className="flex flex-col p-3.5 rounded-lg bg-background/60 border border-border/50">
              <Clock className="h-4 w-4 text-muted-foreground mb-1.5" />
              <p className="text-2xl font-bold tabular-nums">{displayStats.unpaidCount}</p>
              <p className="text-xs text-muted-foreground">Obetalda</p>
            </div>
          </div>
        </div>
      </div>

      {/* Section Separator */}
      <div className="border-b-2 border-border/60" />

      {/* Actions Bar */}
      <div className="flex items-center gap-3">
        <SearchBar
          placeholder="Sök namn, e-post, medlemsnummer..."
          value={searchQuery}
          onChange={setSearchQuery}
          className="w-80"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <FilterButton
              label={statusFilter === 'aktiv' ? 'Aktiva' : statusFilter === 'vilande' ? 'Vilande' : statusFilter === 'avslutad' ? 'Avslutade' : 'Alla status'}
              isActive={!!statusFilter}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => setStatusFilter(null)}>Alla status</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setStatusFilter('aktiv')}>
              <UserCheck className="h-4 w-4 mr-2 text-green-600" />
              Aktiva
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('vilande')}>
              <Clock className="h-4 w-4 mr-2 text-amber-600" />
              Vilande
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('avslutad')}>
              <UserX className="h-4 w-4 mr-2 text-gray-600" />
              Avslutade
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {memberSelection.selectedCount > 0 && (
          <div className="flex items-center gap-2 ml-4">
            <span className="text-sm text-muted-foreground">{memberSelection.selectedCount} valda</span>
            <Button variant="outline" size="sm">
              <Mail className="h-4 w-4 mr-2" />
              Skicka e-post
            </Button>
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8">
            <Download className="h-4 w-4 mr-2" />
            Exportera
          </Button>
        </div>
      </div>

      {/* Members List */}
      {/* Members List */}
      <div className="overflow-x-auto">
        <GridTableHeader
          className="min-w-[800px]"
          columns={[
            { label: "", span: 1 }, // Checkbox
            { label: "Medlem", span: 3 },
            { label: "Kontakt", span: 2 },
            { label: "Typ", span: 2 },
            { label: "Medlem sedan", span: 1 },
            { label: "Avgift", span: 1 },
            { label: "Status", span: 1 },
            { label: "", span: 1 },
          ]}
        />
        <GridTableRows className="min-w-[800px]">
          {filteredMembers.map((member) => (
            <GridTableRow
              key={member.id}
              className={cn(
                memberSelection.isSelected(member.id) && "bg-primary/5"
              )}
            >
              {/* Checkbox */}
              <div className="col-span-1 flex items-center">
                <Checkbox
                  checked={memberSelection.isSelected(member.id)}
                  onCheckedChange={() => memberSelection.toggleItem(member.id)}
                />
              </div>

              {/* Medlem */}
              <div className="col-span-3">
                <div className="font-medium flex items-center gap-2">
                  {member.name}
                  {member.roles.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {member.roles[0]}
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  #{member.memberNumber}
                </div>
              </div>

              {/* Kontakt */}
              <div className="col-span-2 text-sm space-y-0.5">
                {member.email && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    <span className="truncate">{member.email}</span>
                  </div>
                )}
                {member.phone && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    {member.phone}
                  </div>
                )}
              </div>

              {/* Typ */}
              <div className="col-span-2">
                <Badge variant={member.membershipType === 'hedersmedlem' ? 'default' : 'secondary'}>
                  {member.membershipType === 'hedersmedlem' && <Award className="h-3 w-3 mr-1" />}
                  {getMembershipTypeLabel(member.membershipType)}
                </Badge>
              </div>

              {/* Join Date */}
              <div className="col-span-1 text-sm">
                {formatDate(member.joinDate)}
              </div>

              {/* Avgift */}
              <div className="col-span-1">
                <div>
                  <div className="tabular-nums text-sm">
                    {formatCurrency(MEMBERSHIP_FEES[member.membershipType])}
                  </div>
                  {member.membershipType !== 'hedersmedlem' && (
                    member.currentYearFeePaid ? (
                      <span className="text-xs text-green-600 dark:text-green-500/70">Betald</span>
                    ) : (
                      <span className="text-xs text-amber-600">Obetald</span>
                    )
                  )}
                </div>
              </div>

              {/* Status */}
              <div className="col-span-1">
                <AppStatusBadge status={getMembershipStatusLabel(member.status)} showIcon />
              </div>

              {/* Actions */}
              <div className="col-span-1 flex justify-end">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Visa profil</DropdownMenuItem>
                    <DropdownMenuItem>Redigera</DropdownMenuItem>
                    <DropdownMenuItem>
                      <Mail className="h-4 w-4 mr-2" />
                      Skicka e-post
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {!member.currentYearFeePaid && member.membershipType !== 'hedersmedlem' && (
                      <DropdownMenuItem>Skicka betalningspåminnelse</DropdownMenuItem>
                    )}
                    {member.status === 'aktiv' && (
                      <DropdownMenuItem>Sätt som vilande</DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600">Avsluta medlemskap</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </GridTableRow>
          ))}
        </GridTableRows>
      </div>

      {/* Recent Changes - Rendered in right sidebar if available */}
      <RightSidebarContent changes={changes} getMembershipChangeTypeLabel={getMembershipChangeTypeLabel} formatDate={formatDate} />

      {filteredMembers.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Inga medlemmar hittades</p>
        </div>
      )}
    </div>
  )
}
