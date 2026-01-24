// @ts-nocheck
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
        setStats(prev => ({
          ...prev,
          totalMembers: Number(data.totalMembers) || 0,
          activeMembers: Number(data.activeMembers) || 0,
          pendingMembers: Number(data.pendingMembers) || 0,
          totalFees: Number(data.totalFees) || 0,
          unpaidFees: Number(data.unpaidFees) || 0,
          unpaidCount: Number(data.unpaidCount) || 0
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
