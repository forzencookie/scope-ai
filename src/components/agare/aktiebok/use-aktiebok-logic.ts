"use client"

import { useState, useMemo } from "react"
import { useVerifications } from "@/hooks/use-verifications"
import { useCompliance } from "@/hooks/use-compliance"
import { ShareholderDisplay, TransactionDisplay, StockTransactionType } from "./types"

const SHARE_REGEX = /(\d+)\s*aktier/i
const NAME_REGEX_TO = /till\s+(.+?)(?:\s*$|\s*från)/i
const NAME_REGEX_FROM = /från\s+(.+?)(?:\s*$|\s*till)/i

// Determine if identifier is org number (company) or personal number (person)
function isCompany(ssnOrgNr: string): boolean {
  if (!ssnOrgNr) return false
  const cleaned = ssnOrgNr.replace(/\D/g, '')
  if (cleaned.length >= 3) {
    const thirdDigit = parseInt(cleaned[2])
    return thirdDigit >= 2
  }
  return false
}

/**
 * useAktiebokLogic - Read-only logic for the Aktiebok (Share Register) dashboard.
 * 
 * ALL MUTATIONS (New Share Issue, Transfers, Splits) are handled by Scooby via AI Tools.
 * This hook purely maps database state (Shareholders & Verifications) to the UI.
 */
export function useAktiebokLogic() {
  const { realShareholders } = useCompliance()
  const { verifications } = useVerifications()

  // Search/Filter state
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<'owners' | 'transactions'>('owners')

  // 1. Derived stats
  const stats = useMemo(() => {
    const s = realShareholders || []
    const totalShares = s.reduce((sum, sh) => sum + (sh.shares_count || 0), 0)
    const totalVotes = s.reduce((sum, sh) => sum + ((sh.shares_count || 0) * (sh.share_class === 'A' ? 10 : 1)), 0)
    return {
      totalShares,
      totalVotes,
      shareholderCount: s.length,
      totalValue: 0
    }
  }, [realShareholders])

  // 2. Map real shareholders to component format
  const shareholders = useMemo<ShareholderDisplay[]>(() => {
    const totalShares = stats.totalShares || 1
    const totalVotes = stats.totalVotes || 1

    return (realShareholders || []).map(s => {
      const votes = (s.shares_count || 0) * (s.share_class === 'A' ? 10 : 1)
      return {
        id: s.id,
        name: s.name,
        personalNumber: s.ssn_org_nr || '',
        type: isCompany(s.ssn_org_nr || '') ? 'company' : 'person',
        shares: s.shares_count || 0,
        shareClass: (s.share_class || 'B') as 'A' | 'B',
        ownershipPercentage: Math.round(((s.shares_count || 0) / totalShares) * 100),
        acquisitionDate: s.acquisition_date || s.created_at?.split('T')[0] || '',
        acquisitionPrice: s.acquisition_price ?? 0,
        votes,
        votesPercentage: Math.round((votes / totalVotes) * 100),
        shareNumberFrom: s.share_number_from,
        shareNumberTo: s.share_number_to,
      }
    })
  }, [realShareholders, stats.totalShares, stats.totalVotes])

  // 3. Derive transactions from verifications (The system of record)
  const transactions = useMemo<TransactionDisplay[]>(() => {
    // Filter verifications related to equity/share transactions
    const equityVerifications = verifications.filter(v =>
      v.sourceType === 'equity_issue' ||
      v.sourceType === 'share_transfer' ||
      v.description.toLowerCase().includes('nyemission') ||
      v.description.toLowerCase().includes('aktier') ||
      v.description.toLowerCase().includes('överlåtelse')
    )

    return equityVerifications.map(v => {
      const shareMatch = v.description.match(SHARE_REGEX)
      const shares = shareMatch ? parseInt(shareMatch[1]) : 0

      const toMatch = v.description.match(NAME_REGEX_TO)
      const fromMatch = v.description.match(NAME_REGEX_FROM)
      const toName = toMatch ? toMatch[1].trim() : 'Okänd'
      const fromName = fromMatch ? fromMatch[1].trim() : undefined

      let type: StockTransactionType = 'Nyemission'
      const desc = v.description.toLowerCase()
      if (v.sourceType === 'share_transfer' || desc.includes('överlåtelse')) {
        type = 'Köp'
      } else if (desc.includes('gåva')) {
        type = 'Gåva'
      } else if (desc.includes('arv')) {
        type = 'Arv'
      } else if (desc.includes('split')) {
        type = 'Split'
      }

      const bankRow = v.rows.find(r => r.account === '1930')
      const total = bankRow ? (bankRow.debit || bankRow.credit || 0) : 0
      const pricePerShare = shares > 0 ? total / shares : 0

      return {
        id: String(v.id),
        date: v.date || '',
        type,
        fromShareholder: type === 'Nyemission' ? 'Bolaget' : (fromName || '—'),
        toShareholder: toName,
        shares,
        shareClass: 'B' as 'A' | 'B',
        pricePerShare,
        totalPrice: total
      }
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [verifications])

  // 4. Filtering
  const filteredShareholders = useMemo(() => {
    if (!searchQuery) return shareholders
    const query = searchQuery.toLowerCase()
    return shareholders.filter(s =>
      s.name.toLowerCase().includes(query) || 
      s.personalNumber.includes(query)
    )
  }, [shareholders, searchQuery])

  const filteredTransactions = useMemo(() => {
    let result = transactions
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(tx =>
        tx.toShareholder.toLowerCase().includes(query) ||
        tx.fromShareholder?.toLowerCase().includes(query) ||
        tx.type.toLowerCase().includes(query)
      )
    }
    return result
  }, [transactions, searchQuery])

  return {
    stats,
    filteredShareholders,
    shareholders,
    filteredTransactions,
    searchQuery,
    setSearchQuery,
    activeTab,
    setActiveTab,
  }
}
