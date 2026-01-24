// @ts-nocheck
import { useState, useMemo, useEffect } from 'react';
import { usePartners } from '@/hooks/use-partners';
import { useVerifications } from '@/hooks/use-verifications';
import { PARTNER_ACCOUNTS, Partner } from '@/data/ownership';
import { useCompany } from '@/providers/company-provider';

export function usePartnerManagement() {
  const { companyType } = useCompany();
  const { verifications } = useVerifications();
  const { partners, addPartner } = usePartners();
  
  // Calculate verified balances for partners
  const enrichedPartners = useMemo(() => {
    // Optimization: Pre-calculate account balances in a single pass O(V)
    const accountBalances = new Map<string, number>();

    if (verifications) {
      verifications.forEach(v => {
        v.rows.forEach(row => {
           accountBalances.set(row.account, (accountBalances.get(row.account) || 0) + (row.credit - row.debit));
        })
      })
    }
  
    return partners.map(p => {
      const accounts = PARTNER_ACCOUNTS[p.id];
      if (!accounts) return p;
      
      const capitalDelta = accountBalances.get(accounts.capital) || 0;
      const depositDelta = accountBalances.get(accounts.deposit) || 0;
      const withdrawalDelta = accountBalances.get(accounts.withdrawal) || 0;
      
      const ledgerBalance = capitalDelta + depositDelta + withdrawalDelta;

      return {
        ...p,
        // @ts-ignore
        currentCapitalBalance: ledgerBalance !== 0 ? ledgerBalance : p.capitalContribution
      }
    })
  }, [partners, verifications])

  const [rpcStats, setRpcStats] = useState({
      partnerCount: 0,
      totalCapital: 0,
      totalWithdrawals: 0
  })

  useEffect(() => {
    async function fetchStats() {
      const { supabase } = await import('@/lib/database/supabase')
      const { data, error } = await supabase.rpc('get_partner_stats')

      if (!error && data) {
        setRpcStats({
          partnerCount: Number(data.partnerCount) || 0,
          totalCapital: Number(data.totalCapital) || 0,
          totalWithdrawals: Number(data.totalWithdrawals) || 0
        })
      }
    }
    fetchStats()
  }, [])

  const stats = useMemo(() => {
      // Prioritize RPC stats if available, else derive local
      // Actually, RPC might be better for aggregation if DB is source of truth.
      // But we have local enrichedPartners.
      // Let's mix:
      const calculatedTotalOwners = enrichedPartners.length
      // @ts-ignore
      const calculatedTotalCapital = enrichedPartners.reduce((acc, p) => acc + (p.currentCapitalBalance || 0), 0)
      const calculatedActivePartners = enrichedPartners.filter(p => p.ownershipPercentage > 0).length
      
      return {
          totalOwners: calculatedTotalOwners,
          totalCapital: calculatedTotalCapital, // Use calculated for live updates
          activePartners: calculatedActivePartners,
          totalWithdrawals: rpcStats.totalWithdrawals // Use RPC for withdrawals sum as verified logic is complex
      }
  }, [enrichedPartners, rpcStats])

  return {
      partners: enrichedPartners,
      originalPartners: partners, // Expose raw if needed
      stats,
      addPartner,
      companyType
  }
}
