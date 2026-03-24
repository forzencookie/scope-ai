import { useMemo } from "react"
import { useVerifications } from "@/hooks/use-verifications"
import { usePartners } from "@/hooks/use-partners"
import { Withdrawal, getPartnerAccounts } from "@/types/withdrawal"

import type { Partner } from "@/types/ownership"

/**
 * Build a map of withdrawal/deposit accounts to partner IDs for all partners.
 * Uses partner's accountBase from DB when available, falls back to index-based calculation.
 */
function buildAccountToPartnerMap(partners: Partner[]): {
  withdrawalAccounts: Map<string, string>
  depositAccounts: Map<string, string>
} {
  const withdrawalAccounts = new Map<string, string>()
  const depositAccounts = new Map<string, string>()

  partners.forEach((partner, index) => {
    const accounts = getPartnerAccounts(index, partner.accountBase)
    withdrawalAccounts.set(accounts.withdrawal, partner.id)
    depositAccounts.set(accounts.deposit, partner.id)
  })

  return { withdrawalAccounts, depositAccounts }
}

export function useOwnerWithdrawals() {
  const { verifications, isLoading } = useVerifications()
  const { partners } = usePartners()

  const accountMap = useMemo(() => buildAccountToPartnerMap(partners), [partners])

  // Derive withdrawals from Ledger
  const withdrawals = useMemo<Withdrawal[]>(() => {
    const list: Withdrawal[] = []

    verifications.forEach(v => {
      // Check rows for any partner withdrawal accounts
      const withdrawalRow = v.rows.find(r => accountMap.withdrawalAccounts.has(r.account) && r.debit > 0)
      const depositRow = v.rows.find(r => accountMap.depositAccounts.has(r.account) && r.credit > 0)

      if (withdrawalRow) {
        const pid = accountMap.withdrawalAccounts.get(withdrawalRow.account)!
        const p = partners.find(mp => mp.id === pid)
        if (p) {
          list.push({
            id: v.id,
            partnerId: pid,
            partnerName: p.name,
            date: v.date,
            amount: withdrawalRow.debit,
            type: 'uttag',
            description: v.description,
            approved: true
          })
        }
      }

      if (depositRow) {
        const pid = accountMap.depositAccounts.get(depositRow.account)!
        const p = partners.find(mp => mp.id === pid)
        if (p) {
          list.push({
            id: v.id,
            partnerId: pid,
            partnerName: p.name,
            date: v.date,
            amount: depositRow.credit,
            type: 'insättning',
            description: v.description,
            approved: true
          })
        }
      }
    })

    return list
  }, [verifications, partners, accountMap])

  // Calculate stats per partner
  const partnerStats = useMemo(() => {
    return partners.map(partner => {
      const partnerWithdrawals = withdrawals.filter(w => w.partnerId === partner.id)
      const totalUttag = partnerWithdrawals
        .filter(w => w.type === 'uttag')
        .reduce((sum, w) => sum + w.amount, 0)
      const totalInsattning = partnerWithdrawals
        .filter(w => w.type === 'insättning')
        .reduce((sum, w) => sum + w.amount, 0)
      const totalLon = partnerWithdrawals
        .filter(w => w.type === 'lön')
        .reduce((sum, w) => sum + w.amount, 0)

      const nettoUttag = totalUttag + totalLon - totalInsattning
      const kapitalkonto = partner.capitalContribution - nettoUttag

      return {
        ...partner,
        totalUttag,
        totalInsattning,
        totalLon,
        nettoUttag,
        kapitalkonto,
      }
    })
  }, [withdrawals, partners])

  // Overall stats
  const overallStats = useMemo(() => {
    const totalUttag = withdrawals
      .filter(w => w.type === 'uttag')
      .reduce((sum, w) => sum + w.amount, 0)
    const totalInsattning = withdrawals
      .filter(w => w.type === 'insättning')
      .reduce((sum, w) => sum + w.amount, 0)
    const totalLon = withdrawals
      .filter(w => w.type === 'lön')
      .reduce((sum, w) => sum + w.amount, 0)
    const pendingCount = withdrawals.filter(w => !w.approved).length

    return { totalUttag, totalInsattning, totalLon, pendingCount }
  }, [withdrawals])

  const registerTransaction = async (
    type: 'uttag' | 'lön' | 'insättning',
    partnerId: string,
    amount: number,
    date: string,
    description: string
  ): Promise<string | null> => {
    // Solvency check for withdrawals: kapitalkonto must cover the amount
    if (type === 'uttag' || type === 'lön') {
      const stats = partnerStats.find(p => p.id === partnerId)
      if (stats && stats.kapitalkonto < amount) {
        throw new Error(
          `Otillräckligt kapital. ${stats.name} har ${stats.kapitalkonto.toLocaleString('sv-SE')} kr på kapitalkontot, ` +
          `men försöker ta ut ${amount.toLocaleString('sv-SE')} kr.`
        )
      }
    }

    const partnerData = partners.find(p => p.id === partnerId)
    const partnerName = partnerData?.name || 'Delägare'
    const partnerIdx = partners.indexOf(partnerData!)
    const accounts = getPartnerAccounts(partnerIdx >= 0 ? partnerIdx : 0, partnerData?.accountBase)

    const entries = (type === 'uttag' || type === 'lön')
      ? [
          { account: accounts.withdrawal, description: `${type === 'lön' ? 'Lön' : 'Uttag'} ${partnerName}`, debit: amount, credit: 0 },
          { account: "1930", description: "Utbetalning", debit: 0, credit: amount },
        ]
      : [
          { account: "1930", description: "Insättning", debit: amount, credit: 0 },
          { account: accounts.deposit, description: `Egen insättning ${partnerName}`, debit: 0, credit: amount },
        ]

    try {
      const res = await fetch('/api/verifikationer/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          series: 'A',
          date,
          description,
          entries,
          sourceType: 'owner_withdrawal',
          sourceId: `withdrawal-${Date.now()}`,
        }),
      })
      if (!res.ok) throw new Error('Failed to create verification')
      const data = await res.json()
      return data.verificationId || null
    } catch (err) {
      console.error('[useOwnerWithdrawals] registerTransaction error:', err)
      return null
    }
  }

  return {
    withdrawals,
    partnerStats,
    overallStats,
    partners,
    isLoading,
    registerTransaction
  }
}
