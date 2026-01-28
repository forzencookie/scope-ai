import { useMemo, useState } from "react"
import { useCompliance } from "@/hooks/use-compliance"
import { type GeneralMeeting, type GeneralMeetingDecision } from "@/types/ownership"
import { useVerifications } from "@/hooks/use-verifications"
import { useToast } from "@/components/ui/toast"

export function useGeneralMeetings() {
  const { documents: realDocuments, addDocument } = useCompliance()
  const { addVerification } = useVerifications()
  const toast = useToast()

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

  // Calculate stats directly from meetings array (unified data source)
  const stats = useMemo(() => {
    const upcoming = meetings.filter(m => m.status === 'kallad').length
    const completed = meetings.filter(m => m.status === 'genomförd' || m.status === 'protokoll signerat').length
    const totalDecisions = meetings.reduce((sum, m) => sum + (m.decisions?.length || 0), 0)
    
    // Find next upcoming meeting
    const sortedUpcoming = meetings
      .filter(m => m.status === 'kallad')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    const nextMeeting = sortedUpcoming[0] || null
    
    // Calculate days until next meeting
    let daysUntilNext: number | null = null
    if (nextMeeting) {
      const today = new Date()
      const meetingDate = new Date(nextMeeting.date)
      const diffTime = meetingDate.getTime() - today.getTime()
      daysUntilNext = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    }
    
    return {
      upcoming,
      completed,
      totalDecisions,
      nextMeeting,
      daysUntilNext
    }
  }, [meetings])

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

    toast.success(
      "Utdelning bokförd",
      `Bokfört ${decision.amount?.toLocaleString('sv-SE')} kr som skuld till aktieägare.`
    )
  }

  // Create a new meeting (saves to corporate_documents)
  const createMeeting = async (meetingData: {
    date: string
    year: number
    location: string
    type: 'ordinarie' | 'extra'
  }) => {
    const content = JSON.stringify({
      year: meetingData.year,
      location: meetingData.location,
      type: meetingData.type,
      chairperson: 'Ej angivet',
      secretary: 'Ej angivet',
      attendeesCount: 0,
      decisions: [],
      sharesRepresented: 0,
      votesRepresented: 0
    })

    try {
      const docData = {
        type: 'general_meeting_minutes',
        title: `${meetingData.type === 'ordinarie' ? 'Ordinarie' : 'Extra'} bolagsstämma ${meetingData.year}`,
        date: meetingData.date || new Date().toISOString().split('T')[0],
        content,
        status: 'draft',
        source: 'manual'
      }
      
      console.log('[createMeeting] Calling addDocument with:', docData)
      
      const result = await addDocument(docData)
      
      console.log('[createMeeting] addDocument result:', result)
      
      if (!result) {
        throw new Error('No result returned from addDocument')
      }

      toast.success(
        "Stämma skapad",
        `${meetingData.type === 'ordinarie' ? 'Ordinarie' : 'Extra'} bolagsstämma för ${meetingData.year} har planerats.`
      )
    } catch (error) {
      console.error('[createMeeting] Failed to create meeting:', error)
      toast.error("Fel", "Kunde inte skapa stämman. Försök igen.")
    }
  }

  return {
    meetings,
    stats,
    addDocument,
    bookDividend,
    createMeeting
  }
}
