"use client"

import { useState, useMemo } from "react"
import { useVerifications } from "@/hooks/use-verifications"
import { useToast } from "@/components/ui/toast"
import { useCompliance } from "@/hooks/use-compliance"
import { useCompany } from "@/providers/company-provider"
import { StockTransactionType, ShareholderDisplay, TransactionDisplay } from "./types"

const SHARE_REGEX = /(\d+)\s*aktier/i
const NAME_REGEX_TO = /till\s+(.+?)(?:\s*$|\s*från)/i
const NAME_REGEX_FROM = /från\s+(.+?)(?:\s*$|\s*till)/i

// Determine if identifier is org number (company) or personal number (person)
function isCompany(ssnOrgNr: string): boolean {
  if (!ssnOrgNr) return false
  // Swedish org numbers start with digits 2-9 in position 3
  // Personal numbers have digits 0-3 in position 3 (month)
  const cleaned = ssnOrgNr.replace(/\D/g, '')
  if (cleaned.length >= 3) {
    const thirdDigit = parseInt(cleaned[2])
    return thirdDigit >= 2
  }
  return false
}

export function useAktiebokLogic() {
  const { addVerification, verifications } = useVerifications()
  const toast = useToast()
  const { shareholders: realShareholders, addShareholder, updateShareholder, refetchShareholders } = useCompliance()
  const { company } = useCompany()

  // Local state
  const [searchQuery, setSearchQuery] = useState("")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [activeTab, setActiveTab] = useState<'owners' | 'transactions'>('owners')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form State
  const [txType, setTxType] = useState<StockTransactionType>('Nyemission')
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0])
  const [txShares, setTxShares] = useState("")
  const [txPrice, setTxPrice] = useState("")
  const [txTo, setTxTo] = useState("")
  const [txToSsn, setTxToSsn] = useState("")
  const [txFrom, setTxFrom] = useState("")
  const [txShareClass, setTxShareClass] = useState<'A' | 'B'>('B')

  // Derived stats
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

  // Calculate next available share number
  const nextShareNumber = useMemo(() => {
    if (!realShareholders?.length) return 1
    let maxNumber = 0
    for (const s of realShareholders) {
      if (s.share_number_to && s.share_number_to > maxNumber) {
        maxNumber = s.share_number_to
      }
    }
    return maxNumber + 1
  }, [realShareholders])

  // Map real shareholders to component format
  const shareholders = useMemo<ShareholderDisplay[]>(() => {
    const totalShares = stats.totalShares || 1
    const totalVotes = stats.totalVotes || 1

    return (realShareholders || []).map(s => {
      const votes = s.shares_count * (s.share_class === 'A' ? 10 : 1)
      return {
        id: s.id,
        name: s.name,
        personalNumber: s.ssn_org_nr,
        type: isCompany(s.ssn_org_nr) ? 'company' : 'person',
        shares: s.shares_count,
        shareClass: (s.share_class || 'B') as 'A' | 'B',
        ownershipPercentage: Math.round((s.shares_count / totalShares) * 100),
        acquisitionDate: s.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
        acquisitionPrice: 0,
        votes,
        votesPercentage: Math.round((votes / totalVotes) * 100),
        shareNumberFrom: s.share_number_from,
        shareNumberTo: s.share_number_to,
      }
    })
  }, [realShareholders, stats.totalShares, stats.totalVotes])

  // Derive transactions from verifications
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
      // Parse shares from description
      const shareMatch = v.description.match(SHARE_REGEX)
      const shares = shareMatch ? parseInt(shareMatch[1]) : 0

      // Parse names from description
      const toMatch = v.description.match(NAME_REGEX_TO)
      const fromMatch = v.description.match(NAME_REGEX_FROM)
      const toName = toMatch ? toMatch[1].trim() : 'Okänd'
      const fromName = fromMatch ? fromMatch[1].trim() : undefined

      // Determine transaction type from sourceType or description
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

      // Calculate total from bank account row
      const bankRow = v.rows.find(r => r.account === '1930')
      const total = bankRow ? (bankRow.debit || bankRow.credit || 0) : 0
      const pricePerShare = shares > 0 ? total / shares : 0

      return {
        id: String(v.id),
        date: v.date,
        type,
        fromShareholder: type === 'Nyemission' ? 'Bolaget' : (fromName || '—'),
        toShareholder: toName,
        shares,
        shareClass: 'B' as 'A' | 'B', // Default, could parse from description
        pricePerShare,
        totalPrice: total
      }
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [verifications])

  const filteredShareholders = useMemo(() => {
    if (!searchQuery) return shareholders
    const query = searchQuery.toLowerCase()
    return shareholders.filter(s =>
      s.name.toLowerCase().includes(query)
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

  const handleSaveTransaction = async () => {
    // Split only requires a factor (stored in txShares), not a recipient
    if (txType === 'Split') {
      const factor = parseInt(txShares)
      if (!factor || factor < 2) {
        toast.error("Ogiltig splitfaktor", "Ange en splitfaktor på minst 2 (t.ex. 2 för 2:1 split).")
        return
      }
    } else {
      // Validate required fields based on transaction type
      if (!txTo || !txShares) {
        toast.error("Uppgifter saknas", "Fyll i mottagare och antal aktier.")
        return
      }

      // For transfers (Köp, Gåva, Arv), we need a "from" shareholder
      if (['Köp', 'Gåva', 'Arv'].includes(txType) && !txFrom) {
        toast.error("Uppgifter saknas", "Ange vem som överlåter aktierna.")
        return
      }

      // Nyemission requires price
      if (txType === 'Nyemission' && !txPrice) {
        toast.error("Uppgifter saknas", "Ange pris per aktie för nyemission.")
        return
      }
    }

    setIsSubmitting(true)

    const shares = parseInt(txShares)
    const price = txPrice ? parseFloat(txPrice) : 0
    const total = shares * price
    const quotaValue = (company?.totalShares ?? 0) > 0
      ? (company?.shareCapital ?? 0) / (company?.totalShares ?? 1)
      : 0

    try {
      // Check if recipient shareholder exists, create if not
      let toShareholder = realShareholders.find(s => s.name === txTo)

      if (!toShareholder && txToSsn) {
        // Create new shareholder
        await addShareholder({
          name: txTo,
          ssn_org_nr: txToSsn,
          shares_count: 0, // Will be updated after transaction
          share_class: txShareClass,
        })
        await refetchShareholders()
        toShareholder = realShareholders.find(s => s.name === txTo)
      }

      // Auto-assign share number range for new shares
      const newShareFrom = nextShareNumber
      const newShareTo = nextShareNumber + shares - 1

      // Handle different transaction types
      switch (txType) {
        case 'Nyemission': {
          // New share issue: Cash in, share capital increases
          await addVerification({
            date: txDate,
            description: `Nyemission ${shares} ${txShareClass}-aktier till ${txTo} (aktienr ${newShareFrom}–${newShareTo})`,
            sourceType: 'equity_issue',
            rows: [
              { account: "1930", description: "Insättning nyemission", debit: total, credit: 0 },
              { account: "2081", description: "Aktiekapital", debit: 0, credit: shares * quotaValue },
              ...(total > shares * quotaValue ? [
                { account: "2097", description: "Överkursfond", debit: 0, credit: total - (shares * quotaValue) }
              ] : [])
            ]
          })

          // Update shareholder share count and share number range
          if (toShareholder) {
            await updateShareholder({
              id: toShareholder.id,
              shares_count: toShareholder.shares_count + shares,
              share_number_from: toShareholder.share_number_from ?? newShareFrom,
              share_number_to: newShareTo,
            })
          }
          break
        }

        case 'Köp':
        case 'Gåva':
        case 'Arv': {
          // Share transfer: No accounting entry for the company (between shareholders)
          // But we record the transaction for the share register
          const fromShareholder = realShareholders.find(s => s.name === txFrom)

          if (!fromShareholder) {
            toast.error("Fel", "Överlåtaren finns inte i aktieboken.")
            setIsSubmitting(false)
            return
          }

          if (fromShareholder.shares_count < shares) {
            toast.error("Fel", "Överlåtaren har inte tillräckligt med aktier.")
            setIsSubmitting(false)
            return
          }

          // Record the transfer (informational verification, no accounting impact)
          const typeLabel = txType === 'Köp' ? 'Överlåtelse' : txType
          await addVerification({
            date: txDate,
            description: `${typeLabel} ${shares} ${txShareClass}-aktier från ${txFrom} till ${txTo}${price > 0 ? ` för ${total.toLocaleString('sv-SE')} kr` : ''}`,
            sourceType: 'share_transfer',
            rows: [] // No accounting rows for internal transfers
          })

          // Update both shareholders
          await updateShareholder({
            id: fromShareholder.id,
            shares_count: fromShareholder.shares_count - shares,
          })

          if (toShareholder) {
            await updateShareholder({
              id: toShareholder.id,
              shares_count: toShareholder.shares_count + shares,
            })
          }
          break
        }

        case 'Split': {
          // Stock split: multiply all shares by the factor (ABL 5:2)
          const factor = parseInt(txShares)
          if (!realShareholders || realShareholders.length === 0) {
            toast.error("Fel", "Inga aktieägare att splitta.")
            setIsSubmitting(false)
            return
          }

          const totalSharesBefore = realShareholders.reduce((sum, s) => sum + s.shares_count, 0)
          const totalSharesAfter = totalSharesBefore * factor

          // Update each shareholder: multiply shares, recalculate ranges
          let runningShareNumber = 1
          for (const shareholder of realShareholders) {
            const newCount = shareholder.shares_count * factor
            const newFrom = runningShareNumber
            const newTo = runningShareNumber + newCount - 1
            runningShareNumber = newTo + 1

            await updateShareholder({
              id: shareholder.id,
              shares_count: newCount,
              share_number_from: newFrom,
              share_number_to: newTo,
            })
          }

          // Record the split (no accounting impact, just share count change)
          await addVerification({
            date: txDate,
            description: `Aktiesplit ${factor}:1 — ${totalSharesBefore} aktier blev ${totalSharesAfter} aktier`,
            sourceType: 'equity_issue',
            rows: [] // No accounting impact
          })

          // Validate: ownership percentages unchanged
          // (each shareholder's proportion = oldCount/totalBefore = newCount/totalAfter)

          break
        }

        default:
          toast.error("Fel", "Okänd transaktionstyp")
          setIsSubmitting(false)
          return
      }

      await refetchShareholders()

      toast.success("Transaktion registrerad", `${txType} registrerad för ${txTo}`)
      setShowAddDialog(false)

      // Reset form
      setTxTo("")
      setTxToSsn("")
      setTxFrom("")
      setTxShares("")
      setTxPrice("")
      setTxType('Nyemission')
    } catch (error) {
      console.error(error)
      toast.error("Ett fel uppstod", "Kunde inte spara transaktionen")
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    stats,
    filteredShareholders,
    shareholders,
    filteredTransactions,
    searchQuery, setSearchQuery,
    showAddDialog, setShowAddDialog,
    activeTab, setActiveTab,
    isSubmitting,
    
    // Form props
    txType, setTxType,
    txDate, setTxDate,
    txShares, setTxShares,
    txPrice, setTxPrice,
    txTo, setTxTo,
    txToSsn, setTxToSsn,
    txFrom, setTxFrom,
    txShareClass, setTxShareClass,
    
    handleSaveTransaction
  }
}
