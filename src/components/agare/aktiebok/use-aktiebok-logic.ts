"use client"

import { useState, useMemo } from "react"
import { useVerifications } from "@/hooks/use-verifications"
import { useCompliance } from "@/hooks/use-compliance"
import { ShareholderDisplay, TransactionDisplay, StockTransactionType } from "./types"
import { type Shareholder } from "@/services/corporate/shareholder-service"

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
  const { shareholders: realShareholders } = useCompliance()
  const { verifications } = useVerifications()

  // Search/Filter state
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<'owners' | 'transactions'>('owners')

  // 1. Derived stats
  const stats = useMemo(() => {
    const s = realShareholders || []
    const totalShares = s.reduce((sum: number, sh: Shareholder) => sum + (sh.sharesCount || 0), 0)
    const totalVotes = s.reduce((sum: number, sh: Shareholder) => sum + ((sh.sharesCount || 0) * (sh.shareClass === 'A' ? 10 : 1)), 0)
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

    return (realShareholders || []).map((s: Shareholder) => {
      const votes = (s.sharesCount || 0) * (s.shareClass === 'A' ? 10 : 1)
      return {
        id: s.id,
        name: s.name,
        personalNumber: s.personalOrOrgNumber || '',
        type: isCompany(s.personalOrOrgNumber || '') ? 'company' : 'person',
        shares: s.sharesCount || 0,
        shareClass: (s.shareClass || 'B') as 'A' | 'B',
        ownershipPercentage: Math.round(((s.sharesCount || 0) / totalShares) * 100),
        acquisitionDate: s.acquisitionDate || '',
        acquisitionPrice: s.acquisitionPrice ?? 0,
        votes,
        votesPercentage: Math.round((votes / totalVotes) * 100),
        shareNumberFrom: 0,
        shareNumberTo: 0,
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
