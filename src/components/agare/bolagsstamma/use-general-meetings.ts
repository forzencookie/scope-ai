import { useMemo, useState, useEffect } from "react"
import { useCompliance } from "@/hooks/use-compliance"
import { type GeneralMeeting, type GeneralMeetingDecision } from "@/data/ownership"
import { useVerifications } from "@/hooks/use-verifications"
import { useToast } from "@/components/ui/toast"

export function useGeneralMeetings() {
  const { documents: realDocuments, addDocument } = useCompliance()
  const { addVerification } = useVerifications()
  const { toast } = useToast()

  // Local state to track booked decisions (since we can't easily update the document content implementation-wise here)
  const [bookedDecisions, setBookedDecisions] = useState<string[]>([])

  // Map real documents to GeneralMeeting format
  const meetings = useMemo(() => {
    return (realDocuments || [])
      .filter(doc => doc.type === 'general_meeting_minutes')
      .map((doc) => {
        let content = {
          year: new Date(doc.date).getFullYear(),
          location: 'Ej angivet',
          chairperson: 'Ej angivet',
          secretary: 'Ej angivet',
          attendeesCount: 0,
          decisions: [] as GeneralMeetingDecision[],
          type: 'ordinarie' as const,
          sharesRepresented: 0,
          votesRepresented: 0
        }

        try {
          const parsed = JSON.parse(doc.content)
          if (parsed && typeof parsed === 'object') {
            content = { ...content, ...parsed }
             // Safety: Ensure arrays are actual arrays to prevent render crashes
            if (!Array.isArray(content.decisions)) content.decisions = [];
          }
        } catch (e) {
          console.warn("Failed to parse general meeting content:", doc.id, e);
        }

        // Apply booked status override
        const decisionsWithStatus = content.decisions.map((d: GeneralMeetingDecision) => ({
             ...d,
             booked: d.booked || bookedDecisions.includes(d.id || `${doc.id}-${d.title}`) 
        }))

        return {
          id: doc.id,
          date: doc.date,
          status: (doc.status === 'signed' ? 'protokoll signerat' : (doc.status === 'archived' ? 'genomförd' : 'kallad')) as GeneralMeeting['status'],
          meetingType: 'bolagsstamma' as const,
          ...content,
          decisions: decisionsWithStatus
        }
      })
  }, [realDocuments, bookedDecisions])

  // Fetch stats from server
  const [serverStats, setServerStats] = useState({
    upcoming: 0,
    completed: 0,
    totalDecisions: 0,
    nextMeetingDate: null as string | null,
    daysUntilNext: null as number | null
  })

  useEffect(() => {
    async function fetchStats() {
      const { supabase } = await import('@/lib/supabase')
      const { data, error } = await supabase.rpc('get_meeting_stats', { meeting_type: 'general_meeting_minutes' })

      if (!error && data) {
        setServerStats({
          upcoming: Number(data.planned) || 0, // 'planned' in RPC maps to 'upcoming/kallad'
          completed: Number(data.signed) || 0, // 'signed' maps to 'completed' here
          totalDecisions: Number(data.totalDecisions) || 0,
          nextMeetingDate: data.nextMeeting || null,
          daysUntilNext: data.daysUntilNext
        })
      }
    }
    fetchStats()
  }, [])

  // Calculate next meeting object for Alert Card (needs full type info)
  const nextMeetingObject = useMemo(() => {
    const sortedUpcoming = meetings
      .filter(m => m.status === 'kallad')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    return sortedUpcoming[0] || null
  }, [meetings])

  const stats = {
    upcoming: serverStats.upcoming,
    completed: serverStats.completed,
    totalDecisions: serverStats.totalDecisions,
    nextMeeting: nextMeetingObject ? nextMeetingObject : (serverStats.nextMeetingDate ? { date: serverStats.nextMeetingDate, type: 'ordinarie' as const } : null),
    daysUntilNext: serverStats.daysUntilNext
  }

  const bookDividend = (meeting: GeneralMeeting, decision: GeneralMeetingDecision) => {
    if (!decision.amount) return

    addVerification({
      description: `Utdelning enligt stämmobeslut ${meeting.year}`,
      date: meeting.date,
      rows: [
        {
          account: "2091", // Balanserad vinst/förlust
          debit: decision.amount,
          credit: 0,
          description: "Minskning av fritt eget kapital"
        },
        {
          account: "2898", // Outtagen vinstutdelning
          debit: 0,
          credit: decision.amount,
          description: "Uppbokad skuld till aktieägare"
        }
      ]
    })

    setBookedDecisions(prev => [...prev, decision.id || `${meeting.id}-${decision.title}`])
    
    toast({
        title: "Utdelning bokförd",
        description: `Bokfört ${decision.amount} kr som skuld till aktieägare.`,
    })
  }

  return {
    meetings,
    stats,
    addDocument,
    bookDividend
  }
}
