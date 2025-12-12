"use client"

import * as React from "react"
import { useState } from "react"
import {
  FileText,
  Calendar,
  Building2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MoreHorizontal,
  Eye,
  Check,
  CreditCard,
  Download,
  Sparkles,
  Plus,
  Hash,
  Banknote,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { SearchBar } from "@/components/ui/search-bar"
import { FilterButton } from "@/components/ui/filter-button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { mockSupplierInvoices, type SupplierInvoice } from "@/data/ownership"
import { AppStatusBadge } from "@/components/ui/status-badge"
import { type SupplierInvoiceStatus } from "@/lib/status-types"
import { 
  DataTable, 
  DataTableHeader, 
  DataTableHeaderCell, 
  DataTableBody, 
  DataTableRow, 
  DataTableCell 
} from "@/components/ui/data-table"
import { StatCard, StatCardGrid } from "@/components/ui/stat-card"

// Map internal status keys to display labels (using centralized status types)
const statusLabelMap: Record<SupplierInvoice['status'], SupplierInvoiceStatus> = {
  mottagen: 'Mottagen',
  attesterad: 'Attesterad',
  betald: 'Betald',
  förfallen: 'Förfallen',
  tvist: 'Tvist',
}

// Status configuration for dropdown menu
const statusConfig: Record<SupplierInvoice['status'], { icon: React.ElementType; label: SupplierInvoiceStatus }> = {
  mottagen: { icon: Clock, label: 'Mottagen' },
  attesterad: { icon: CheckCircle2, label: 'Attesterad' },
  betald: { icon: Check, label: 'Betald' },
  förfallen: { icon: AlertTriangle, label: 'Förfallen' },
  tvist: { icon: AlertTriangle, label: 'Tvist' },
}

export function LeverantorsfakturorTable() {
  const [invoices, setInvoices] = useState<SupplierInvoice[]>(mockSupplierInvoices)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [sortField, setSortField] = useState<'dueDate' | 'totalAmount' | 'supplierName'>('dueDate')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  // Filter and sort
  const filteredInvoices = React.useMemo(() => {
    let result = invoices

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(inv =>
        inv.supplierName.toLowerCase().includes(query) ||
        inv.invoiceNumber.toLowerCase().includes(query) ||
        inv.category?.toLowerCase().includes(query)
      )
    }

    // Status filter
    if (statusFilter) {
      result = result.filter(inv => inv.status === statusFilter)
    }

    // Sort
    result = [...result].sort((a, b) => {
      let comparison = 0
      if (sortField === 'dueDate') {
        comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      } else if (sortField === 'totalAmount') {
        comparison = a.totalAmount - b.totalAmount
      } else if (sortField === 'supplierName') {
        comparison = a.supplierName.localeCompare(b.supplierName)
      }
      return sortDir === 'asc' ? comparison : -comparison
    })

    return result
  }, [invoices, searchQuery, statusFilter, sortField, sortDir])

  // Stats
  const stats = React.useMemo(() => {
    const unpaid = invoices.filter(i => i.status !== 'betald')
    const overdue = invoices.filter(i => i.status === 'förfallen')
    const toApprove = invoices.filter(i => i.status === 'mottagen')
    
    return {
      totalUnpaid: unpaid.reduce((sum, i) => sum + i.totalAmount, 0),
      overdueAmount: overdue.reduce((sum, i) => sum + i.totalAmount, 0),
      overdueCount: overdue.length,
      toApproveCount: toApprove.length,
    }
  }, [invoices])

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
    if (selectedIds.size === filteredInvoices.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredInvoices.map(i => i.id)))
    }
  }

  const updateStatus = (id: string, status: SupplierInvoice['status']) => {
    setInvoices(prev => prev.map(inv =>
      inv.id === id ? { ...inv, status } : inv
    ))
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('sv-SE')
  }

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <StatCardGrid columns={4}>
        <StatCard
          label="Obetalda fakturor"
          value={formatCurrency(stats.totalUnpaid)}
          icon={FileText}
        />
        <StatCard
          label="Förfallna"
          value={formatCurrency(stats.overdueAmount)}
          subtitle={`${stats.overdueCount} fakturor`}
          icon={AlertTriangle}
        />
        <StatCard
          label="Att attestera"
          value={stats.toApproveCount.toString()}
          subtitle="fakturor"
          icon={Clock}
        />
        <StatCard
          label="AI-matchade"
          value="3"
          subtitle="av 4 mottagna"
          icon={Sparkles}
        />
      </StatCardGrid>

      {/* Section Separator */}
      <div className="border-b-2 border-border/60" />

      {/* Table */}
      <DataTable
        title="Leverantörsfakturor"
        headerActions={
          <>
            <SearchBar
              placeholder="Sök leverantör, fakturanummer..."
              value={searchQuery}
              onChange={setSearchQuery}
              className="w-64"
            />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <FilterButton
                  label="Filter"
                  isActive={!!statusFilter}
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Status</div>
                <DropdownMenuItem onClick={() => setStatusFilter(null)}>
                  Alla status
                </DropdownMenuItem>
                {Object.entries(statusConfig).map(([status, config]) => (
                  <DropdownMenuItem key={status} onClick={() => setStatusFilter(status)}>
                    <config.icon className="h-4 w-4 mr-2" />
                    {config.label}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Sortera efter</div>
                <DropdownMenuItem onClick={() => toggleSort('dueDate')}>
                  Förfallodatum {sortField === 'dueDate' && (sortDir === 'asc' ? '↑' : '↓')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleSort('totalAmount')}>
                  Belopp {sortField === 'totalAmount' && (sortDir === 'asc' ? '↑' : '↓')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleSort('supplierName')}>
                  Leverantör {sortField === 'supplierName' && (sortDir === 'asc' ? '↑' : '↓')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {selectedIds.size > 0 ? (
              <>
                <Button variant="outline" size="sm" className="h-8" onClick={() => {
                  selectedIds.forEach(id => updateStatus(id, 'attesterad'))
                  setSelectedIds(new Set())
                }}>
                  <Check className="h-4 w-4 mr-2" />
                  Attestera ({selectedIds.size})
                </Button>
                <Button variant="outline" size="sm" className="h-8">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Betala
                </Button>
              </>
            ) : (
              <Button size="sm" className="h-8">
                <Plus className="h-4 w-4 mr-2" />
                Ny faktura
              </Button>
            )}
          </>
        }
      >
        <DataTableHeader>
          <th className="w-10 px-4 py-3">
            <Checkbox
              checked={selectedIds.size === filteredInvoices.length && filteredInvoices.length > 0}
              onCheckedChange={toggleSelectAll}
            />
          </th>
          <DataTableHeaderCell 
            label="Leverantör" 
            icon={Building2}
          />
          <DataTableHeaderCell label="Fakturanr" icon={Hash} />
          <DataTableHeaderCell 
            label="Förfallodatum" 
            icon={Clock}
          />
          <DataTableHeaderCell 
            label="Belopp" 
            icon={Banknote}
          />
          <DataTableHeaderCell label="Status" icon={CheckCircle2} />
          <DataTableHeaderCell label="" />
        </DataTableHeader>
        <DataTableBody>
          {filteredInvoices.map((invoice) => {
            const statusLabel = statusLabelMap[invoice.status]
            const isOverdue = invoice.status === 'förfallen'

            return (
              <DataTableRow 
                key={invoice.id}
                selected={selectedIds.has(invoice.id)}
              >
                <DataTableCell>
                  <Checkbox
                    checked={selectedIds.has(invoice.id)}
                    onCheckedChange={() => toggleSelect(invoice.id)}
                  />
                </DataTableCell>
                <DataTableCell bold>
                  <div>
                    <div className="font-medium">{invoice.supplierName}</div>
                    {invoice.category && (
                      <div className="text-xs text-muted-foreground">{invoice.category}</div>
                    )}
                  </div>
                </DataTableCell>
                <DataTableCell>
                  <span className="font-mono text-sm">{invoice.invoiceNumber}</span>
                </DataTableCell>
                <DataTableCell>
                  <span className={cn(isOverdue && "text-red-600 dark:text-red-500/70 font-medium")}>
                    {formatDate(invoice.dueDate)}
                  </span>
                </DataTableCell>
                <DataTableCell>
                  <div>
                    <div className="font-medium">{formatCurrency(invoice.totalAmount)}</div>
                    <div className="text-xs text-muted-foreground">
                      varav moms {formatCurrency(invoice.vatAmount)}
                    </div>
                  </div>
                </DataTableCell>
                <DataTableCell>
                  <AppStatusBadge status={statusLabel} />
                </DataTableCell>
                <DataTableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Eye className="h-4 w-4 mr-2" />
                        Visa detaljer
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Download className="h-4 w-4 mr-2" />
                        Ladda ner
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {invoice.status === 'mottagen' && (
                        <DropdownMenuItem onClick={() => updateStatus(invoice.id, 'attesterad')}>
                          <Check className="h-4 w-4 mr-2" />
                          Attestera
                        </DropdownMenuItem>
                      )}
                      {invoice.status === 'attesterad' && (
                        <DropdownMenuItem onClick={() => updateStatus(invoice.id, 'betald')}>
                          <CreditCard className="h-4 w-4 mr-2" />
                          Markera som betald
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </DataTableCell>
              </DataTableRow>
            )
          })}
        </DataTableBody>
      </DataTable>

      {filteredInvoices.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Inga leverantörsfakturor hittades</p>
        </div>
      )}
    </div>
  )
}
