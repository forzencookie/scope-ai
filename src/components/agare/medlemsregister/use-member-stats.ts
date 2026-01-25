import { useState, useEffect, useMemo } from "react"
import { useMembers, type Member } from "@/hooks/use-members"

export function useMemberStats() {
  const { members } = useMembers()
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    pendingMembers: 0,
    totalFees: 0,
    unpaidFees: 0,
    unpaidCount: 0,
  })

  useEffect(() => {
    async function fetchStats() {
      const { supabase } = await import('@/lib/database/supabase')
      const { data, error } = await supabase.rpc('get_member_stats')

      if (!error && data) {
        const rpcStats = data as any
        setStats(prev => ({
          ...prev,
          totalMembers: Number(rpcStats.totalMembers) || 0,
          activeMembers: Number(rpcStats.activeMembers) || 0,
          pendingMembers: Number(rpcStats.pendingMembers) || 0,
          totalFees: Number(rpcStats.totalFees) || 0,
          unpaidFees: Number(rpcStats.unpaidFees) || 0,
          unpaidCount: Number(rpcStats.unpaidCount) || 0
        }))
      }
    }
    fetchStats()
  }, [])

  // Calculate board members client-side
  const boardMembersCount = useMemo(() => members.filter(m => m.roles.length > 0).length, [members])

  const displayStats = {
    ...stats,
    boardMembers: boardMembersCount
  }

  return {
    ...displayStats
  }
}
