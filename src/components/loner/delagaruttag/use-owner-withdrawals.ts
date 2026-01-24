import { useMemo } from "react"
import { useVerifications } from "@/hooks/use-verifications"
import { usePartners } from "@/hooks/use-partners"
import { Withdrawal, PARTNER_ACCOUNTS } from "@/types/withdrawal"

export function useOwnerWithdrawals() {
  const { verifications, addVerification } = useVerifications()
  const { partners } = usePartners()

  // Derive withdrawals from Ledger
  const withdrawals = useMemo<Withdrawal[]>(() => {
    const list: Withdrawal[] = []

    verifications.forEach(v => {
      // Check rows for partner accounts
      const withdrawalRow = v.rows.find(r => ['2013', '2023'].includes(r.account) && r.debit > 0)
      const depositRow = v.rows.find(r => ['2018', '2028'].includes(r.account) && r.credit > 0)

      if (withdrawalRow) {
        const pid = withdrawalRow.account === '2013' ? 'p-1' : 'p-2'
        const p = partners.find(mp => mp.id === pid)
        if (p) {
          list.push({
            id: v.id,
            partnerId: pid,
            partnerName: p.name,
            date: v.date,
            amount: withdrawalRow.debit,
            type: 'uttag', // Treat all debits to 2013/2023 as withdrawals for now
            description: v.description,
            approved: true // Ledger entries are final
          })
        }
      }

      if (depositRow) {
        const pid = depositRow.account === '2018' ? 'p-1' : 'p-2'
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
  }, [verifications, partners])

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
  ) => {
    const accounts = PARTNER_ACCOUNTS[partnerId]
    if (!accounts) throw new Error("Ogiltigt partner-ID")

    let debitAcc = ""
    let creditAcc = ""

    if (type === 'uttag' || type === 'lön') {
      // Withdrawal: Debit Partner Account (2013), Credit Bank (1930)
      // Note: Typically salary (lön) might go via 7xxx accounts and taxes, but for simplified partner withdrawals (skattefritt etc) or basic recording:
      debitAcc = accounts.withdrawal
      creditAcc = "1930"

      await addVerification({
        date: date,
        description: description,
        sourceType: 'withdrawal',
        rows: [
          { 
             account: debitAcc, 
             description: `${type === 'lön' ? 'Lön' : 'Uttag'} ${partners.find(p => p.id === partnerId)?.name}`, 
             debit: amount, 
             credit: 0 
          },
          { 
             account: creditAcc, 
             description: "Utbetalning", 
             debit: 0, 
             credit: amount 
          }
        ]
      })
    } else {
      // Deposit: Debit Bank (1930), Credit Partner Account (2018)
      await addVerification({
        date: date,
        description: description,
        sourceType: 'deposit',
        rows: [
          { account: "1930", description: "Insättning", debit: amount, credit: 0 },
          { account: accounts.deposit, description: `Egen insättning ${partners.find(p => p.id === partnerId)?.name}`, debit: 0, credit: amount }
        ]
      })
    }
  }

  return {
    withdrawals,
    partnerStats,
    overallStats,
    partners,
    registerTransaction
  }
}
