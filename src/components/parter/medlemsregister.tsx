"use client"

import * as React from "react"
import { useState, useMemo } from "react"
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
import { DataTableRaw } from "@/components/ui/data-table"
import { cn } from "@/lib/utils"
import { AppStatusBadge } from "@/components/ui/status-badge"
import { type MembershipStatus, type MembershipChangeType } from "@/lib/status-types"
import { mockMembers, mockMembershipChanges, type Member, type MembershipChange } from "@/data/ownership"
import { useVerifications } from "@/hooks/use-verifications"
import { useToast } from "@/components/ui/toast"

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

export function Medlemsregister() {
  const { addVerification } = useVerifications()
  const toast = useToast()

  const [members, setMembers] = useState<Member[]>(mockMembers)
  const [changes] = useState<MembershipChange[]>(mockMembershipChanges)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // New Member Form State
  const [newName, setNewName] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [newPhone, setNewPhone] = useState("")
  const [payFee, setPayFee] = useState(true) // Pays Annual Fee
  const [payCapital, setPayCapital] = useState(true) // Pays Initial Capital (Insats)
  const [capitalAmount, setCapitalAmount] = useState("100") // Default insats

  // Calculate stats
  const stats = useMemo(() => {
    const active = members.filter(m => m.status === 'aktiv')
    const pending = members.filter(m => m.status === 'vilande')
    const unpaid = active.filter(m => !m.currentYearFeePaid)
    const totalFees = active.reduce((sum, m) => sum + MEMBERSHIP_FEES[m.membershipType], 0)
    const unpaidFees = unpaid.reduce((sum, m) => sum + MEMBERSHIP_FEES[m.membershipType], 0)

    return {
      totalMembers: members.length,
      activeMembers: active.length,
      pendingMembers: pending.length,
      totalFees,
      unpaidFees,
      unpaidCount: unpaid.length,
      boardMembers: members.filter(m => m.roles.length > 0).length,
    }
  }, [members])

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

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredMembers.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredMembers.map(m => m.id)))
    }
  }

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
      {/* Stats Overview */}
      <StatCardGrid columns={4}>
        <StatCard
          label="Totalt medlemmar"
          value={stats.totalMembers.toString()}
          subtitle={`${stats.boardMembers} med styrelseuppdrag`}
          icon={Users}
        />
        <StatCard
          label="Aktiva medlemmar"
          value={stats.activeMembers.toString()}
          subtitle={`${stats.pendingMembers} vilande`}
          icon={UserCheck}
        />
        <StatCard
          label="Förväntade avgifter"
          value={formatCurrency(stats.totalFees)}
          subtitle="innevarande år"
          icon={CreditCard}
        />
        <StatCard
          label="Obetalda avgifter"
          value={formatCurrency(stats.unpaidFees)}
          subtitle={`${stats.unpaidCount} medlemmar`}
          icon={Clock}
        />
      </StatCardGrid>

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

        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 ml-4">
            <span className="text-sm text-muted-foreground">{selectedIds.size} valda</span>
            <Button variant="outline" size="sm">
              <Mail className="h-4 w-4 mr-2" />
              Skicka e-post
            </Button>
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8">
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
          <Button variant="outline" size="sm" className="h-8">
            <Download className="h-4 w-4 mr-2" />
            Exportera
          </Button>
        </div>
      </div>

      {/* Members List */}
      <DataTableRaw>
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="border-b border-border/40 text-left text-muted-foreground">
              <th className="w-10 px-4 py-3">
                <Checkbox
                  checked={selectedIds.size === filteredMembers.length && filteredMembers.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </th>
              <th className="px-4 py-3 font-medium">Medlem</th>
              <th className="px-4 py-3 font-medium">Kontakt</th>
              <th className="px-4 py-3 font-medium">Typ</th>
              <th className="px-4 py-3 font-medium">Medlem sedan</th>
              <th className="px-4 py-3 font-medium">Avgift</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.map((member) => (
              <tr
                key={member.id}
                className={cn(
                  "border-b border-border/40 hover:bg-muted/30 transition-colors",
                  selectedIds.has(member.id) && "bg-primary/5"
                )}
              >
                <td className="px-4 py-3">
                  <Checkbox
                    checked={selectedIds.has(member.id)}
                    onCheckedChange={() => toggleSelect(member.id)}
                  />
                </td>
                <td className="px-4 py-3">
                  <div>
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
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm space-y-0.5">
                    {member.email && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {member.email}
                      </div>
                    )}
                    {member.phone && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {member.phone}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={member.membershipType === 'hedersmedlem' ? 'default' : 'secondary'}>
                    {member.membershipType === 'hedersmedlem' && <Award className="h-3 w-3 mr-1" />}
                    {getMembershipTypeLabel(member.membershipType)}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-sm">
                  {formatDate(member.joinDate)}
                </td>
                <td className="px-4 py-3">
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
                </td>
                <td className="px-4 py-3">
                  <AppStatusBadge status={getMembershipStatusLabel(member.status)} showIcon />
                </td>
                <td className="px-4 py-3">
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataTableRaw>

      {/* Recent Changes */}
      <Card>
        <CardHeader>
          <CardTitle>Senaste aktivitet</CardTitle>
          <CardDescription>
            Medlemsändringar och händelser
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {changes.map((change) => {
              const changeLabel = getMembershipChangeTypeLabel(change.changeType)
              return (
                <div key={change.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                  <AppStatusBadge status={changeLabel} showIcon />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{change.memberName}</p>
                    <p className="text-xs text-muted-foreground">{change.details}</p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(change.date)}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {filteredMembers.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Inga medlemmar hittades</p>
        </div>
      )}
    </div>
  )
}
