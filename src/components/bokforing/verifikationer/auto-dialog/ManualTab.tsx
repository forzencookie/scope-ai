"use client"

import { useCallback, useMemo, useRef, useState } from 'react'
import { Plus, Trash2, Upload, CheckCircle2, RefreshCw, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { basAccounts } from '@/data/accounts'
import type { VerificationEntry } from '@/services/verification-service'

// ---------------------------------------------------------------------------
// Account Search Input
// ---------------------------------------------------------------------------

function AccountSearchInput({
  value,
  onChange,
}: {
  value: string
  onChange: (account: string) => void
}) {
  const [query, setQuery] = useState(value)
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    if (!query) return basAccounts.filter((a) => a.isCommon).slice(0, 12)
    const q = query.toLowerCase()
    return basAccounts
      .filter((a) => a.number.includes(q) || a.name.toLowerCase().includes(q))
      .slice(0, 12)
  }, [query])

  function handleSelect(account: string) {
    setQuery(account)
    onChange(account)
    setOpen(false)
  }

  function handleBlur() {
    // Delay to allow click on dropdown item
    setTimeout(() => setOpen(false), 150)
  }

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          onChange(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={handleBlur}
        placeholder="Sök konto..."
        className="h-8 text-sm font-mono"
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-md max-h-48 overflow-y-auto">
          {filtered.map((acc) => (
            <button
              key={acc.number}
              type="button"
              className="w-full text-left px-2 py-1.5 text-sm hover:bg-accent flex items-center gap-2"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(acc.number)}
            >
              <span className="font-mono text-xs text-muted-foreground w-10">{acc.number}</span>
              <span className="truncate">{acc.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EntryRow {
  account: string
  description: string
  debit: number
  credit: number
}

interface ManualTabProps {
  onCreated: () => void
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ManualTab({ onCreated }: ManualTabProps) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [description, setDescription] = useState('')
  const [series, setSeries] = useState('A')
  const [rows, setRows] = useState<EntryRow[]>([
    { account: '', description: '', debit: 0, credit: 0 },
    { account: '', description: '', debit: 0, credit: 0 },
  ])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const totalDebit = rows.reduce((s, r) => s + r.debit, 0)
  const totalCredit = rows.reduce((s, r) => s + r.credit, 0)
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0

  function updateRow(index: number, field: keyof EntryRow, value: string | number) {
    setRows((prev) =>
      prev.map((r, i) =>
        i === index
          ? { ...r, [field]: field === 'debit' || field === 'credit' ? Number(value) || 0 : value }
          : r
      )
    )
  }

  function addRow() {
    setRows((prev) => [...prev, { account: '', description: '', debit: 0, credit: 0 }])
  }

  function removeRow(index: number) {
    if (rows.length <= 2) return
    setRows((prev) => prev.filter((_, i) => i !== index))
  }

  // OCR scan
  const handleFileUpload = useCallback(async (file: File) => {
    setIsScanning(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/ai/extract-receipt', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) throw new Error('OCR-scanning misslyckades')

      const { data } = await res.json()

      // Prefill from OCR results
      if (data.date?.value) setDate(data.date.value)
      if (data.supplier?.value) setDescription(`Inköp — ${data.supplier.value}`)

      const amount = Number(data.amount?.value) || 0
      if (amount > 0) {
        // Assume 25% VAT purchase
        const gross = amount
        const net = Math.round((gross / 1.25) * 100) / 100
        const vat = Math.round((gross - net) * 100) / 100
        setSeries('B')
        setRows([
          { account: '6110', description: data.category?.value || 'Kontorsmaterial', debit: net, credit: 0 },
          { account: '2641', description: 'Ingående moms 25%', debit: vat, credit: 0 },
          { account: '1930', description: 'Bank', debit: 0, credit: gross },
        ])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OCR-scanning misslyckades')
    } finally {
      setIsScanning(false)
    }
  }, [])

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFileUpload(file)
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFileUpload(file)
  }

  // Submit manual verification
  async function handleSubmit() {
    if (!isBalanced) return
    if (!date || !description) {
      setError('Datum och beskrivning krävs')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const entries: VerificationEntry[] = rows
        .filter((r) => r.account && (r.debit > 0 || r.credit > 0))
        .map((r) => ({
          account: r.account,
          debit: r.debit,
          credit: r.credit,
          description: r.description || undefined,
        }))

      // Create as pending booking, then immediately book
      const createRes = await fetch('/api/pending-bookings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceType: 'ai_entry',
          sourceId: `manual-${Date.now()}`,
          description,
          entries,
          series,
          date,
        }),
      })

      if (!createRes.ok) {
        const data = await createRes.json().catch(() => ({ error: 'Unknown' }))
        throw new Error(data.error || 'Kunde inte skapa post')
      }

      const { id: pbId } = await createRes.json()

      // Book it
      const bookRes = await fetch('/api/pending-bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'book', id: pbId, finalEntries: entries }),
      })

      if (!bookRes.ok) {
        const data = await bookRes.json().catch(() => ({ error: 'Unknown' }))
        throw new Error(data.error || 'Bokföring misslyckades')
      }

      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Något gick fel')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* OCR upload zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center transition-colors',
          isScanning ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-muted-foreground/50'
        )}
      >
        {isScanning ? (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Skannar dokument...
          </div>
        ) : (
          <>
            <Upload className="h-6 w-6 mx-auto text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground mt-2">
              Dra och släpp kvitto/faktura, eller{' '}
              <label className="text-primary cursor-pointer hover:underline">
                välj fil
                <input
                  type="file"
                  className="hidden"
                  accept="image/*,.pdf"
                  onChange={handleFileInput}
                />
              </label>
            </p>
          </>
        )}
      </div>

      {/* Form fields */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label className="text-xs">Datum</Label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1"
          />
        </div>
        <div className="col-span-2">
          <Label className="text-xs">Beskrivning</Label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="T.ex. Kontorsmaterial, IKEA"
            className="mt-1"
          />
        </div>
      </div>

      <div className="w-32">
        <Label className="text-xs">Serie</Label>
        <Select value={series} onValueChange={setSeries}>
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="A">A — Försäljning</SelectItem>
            <SelectItem value="B">B — Inköp</SelectItem>
            <SelectItem value="L">L — Lön</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Entry rows */}
      <div>
        <Label className="text-xs">Konteringsrader</Label>
        <table className="w-full text-sm mt-2">
          <thead>
            <tr className="text-muted-foreground text-xs">
              <th className="text-left py-1 font-normal w-36">Konto</th>
              <th className="text-left py-1 font-normal">Beskrivning</th>
              <th className="text-right py-1 font-normal w-28">Debet</th>
              <th className="text-right py-1 font-normal w-28">Kredit</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                <td className="py-1 pr-2">
                  <AccountSearchInput
                    value={row.account}
                    onChange={(v) => updateRow(i, 'account', v)}
                  />
                </td>
                <td className="py-1 pr-2">
                  <Input
                    value={row.description}
                    onChange={(e) => updateRow(i, 'description', e.target.value)}
                    placeholder="Beskrivning"
                    className="h-8 text-sm"
                  />
                </td>
                <td className="py-1 pr-2">
                  <Input
                    type="number"
                    value={row.debit || ''}
                    onChange={(e) => updateRow(i, 'debit', e.target.value)}
                    className="h-8 text-sm text-right"
                  />
                </td>
                <td className="py-1 pr-2">
                  <Input
                    type="number"
                    value={row.credit || ''}
                    onChange={(e) => updateRow(i, 'credit', e.target.value)}
                    className="h-8 text-sm text-right"
                  />
                </td>
                <td className="py-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    disabled={rows.length <= 2}
                    onClick={() => removeRow(i)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t font-medium">
              <td colSpan={2} className="py-2">
                <Button variant="ghost" size="sm" onClick={addRow}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Lägg till rad
                </Button>
              </td>
              <td className="py-2 text-right tabular-nums text-xs">
                {totalDebit > 0 ? totalDebit.toFixed(2) : ''}
              </td>
              <td className="py-2 text-right tabular-nums text-xs">
                {totalCredit > 0 ? totalCredit.toFixed(2) : ''}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>

        {/* Balance indicator */}
        {totalDebit > 0 && !isBalanced && (
          <div className="flex items-center gap-1.5 text-xs text-destructive mt-1">
            <AlertCircle className="h-3.5 w-3.5" />
            Obalanserad: debet {totalDebit.toFixed(2)} ≠ kredit {totalCredit.toFixed(2)}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {/* Submit */}
      <div className="flex justify-end pt-2 border-t">
        <Button
          onClick={handleSubmit}
          disabled={!isBalanced || isSubmitting || !description}
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              Skapar...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
              Skapa verifikation
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
