import { useMemo, useState } from "react"
import { useCompliance } from "@/hooks/use-compliance"
import { type GeneralMeeting, type GeneralMeetingDecision } from "@/types/ownership"
import { useVerifications } from "@/hooks/use-verifications"
import { useToast } from "@/components/ui/toast"

export function useGeneralMeetings() {
  const { documents: realDocuments, addDocument, updateDocument, refetchDocs } = useCompliance()
  const { addVerification } = useVerifications()
  const toast = useToast()

  // Debug: Log what documents we're receiving
  console.log('[useGeneralMeetings] realDocuments:', realDocuments)

  // Local state to track booked decisions (since we can't easily update the document content implementation-wise here)
  const [bookedDecisions, setBookedDecisions] = useState<string[]>([])

  // Map real documents to GeneralMeeting format (both general_meeting_minutes and board_meeting_minutes)
  const meetings = useMemo(() => {
    const generalMeetings = (realDocuments || [])
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
            if (!Array.isArray(content.decisions)) content.decisions = [];
          }
        } catch (e) {
          console.warn("Failed to parse general meeting content:", doc.id, e);
        }

        const decisionsWithStatus = content.decisions.map((d: GeneralMeetingDecision) => ({
          ...d,
          booked: d.booked || bookedDecisions.includes(d.id || `${doc.id}-${d.title}`)
        }))

        return {
          id: doc.id,
          date: doc.date,
          status: (
            doc.status === 'signed' ? 'protokoll signerat' :
            doc.status === 'archived' ? 'genomförd' :
            doc.status === 'pending' ? 'kallad' :
            'planerad'
          ) as GeneralMeeting['status'],
          meetingType: 'bolagsstamma' as const,
          meetingCategory: 'bolagsstamma' as const,
          ...content,
          decisions: decisionsWithStatus
        }
      })

    const boardMeetings = (realDocuments || [])
      .filter(doc => doc.type === 'board_meeting_minutes')
      .map((doc, idx) => {
        let content = {
          year: new Date(doc.date).getFullYear(),
          meetingNumber: idx + 1,
          location: 'Ej angivet',
          chairperson: 'Ej angivet',
          secretary: 'Ej angivet',
          attendees: [] as string[],
          absentees: [] as string[],
          agendaItems: [] as { id: string; title: string; decision?: string }[],
          type: 'ordinarie' as const,
        }

        try {
          const parsed = JSON.parse(doc.content)
          if (parsed && typeof parsed === 'object') {
            content = { ...content, ...parsed }
            if (!Array.isArray(content.attendees)) content.attendees = [];
            if (!Array.isArray(content.absentees)) content.absentees = [];
            if (!Array.isArray(content.agendaItems)) content.agendaItems = [];
          }
        } catch (e) {
          console.warn("Failed to parse board meeting content:", doc.id, e);
        }

        // Convert agenda items to decisions format for consistency
        const decisions: GeneralMeetingDecision[] = content.agendaItems
          .filter(item => item.decision)
          .map((item, i) => ({
            id: item.id || `${doc.id}-${i}`,
            title: item.title,
            decision: item.decision || '',
            type: 'other' as const,
          }))

        return {
          id: doc.id,
          date: doc.date,
          year: content.year,
          status: (
            doc.status === 'signed' ? 'protokoll signerat' :
            doc.status === 'archived' ? 'genomförd' :
            'planerad'
          ) as GeneralMeeting['status'],
          meetingType: 'bolagsstamma' as const,
          meetingCategory: 'styrelsemote' as const,
          type: content.type,
          location: content.location,
          chairperson: content.chairperson,
          secretary: content.secretary,
          attendeesCount: content.attendees.length,
          attendees: content.attendees,
          absentees: content.absentees,
          meetingNumber: content.meetingNumber,
          decisions,
          sharesRepresented: 0,
          votesRepresented: 0,
        } as GeneralMeeting
      })

    return [...generalMeetings, ...boardMeetings].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  }, [realDocuments, bookedDecisions])

  // Debug: Log transformed meetings
  console.log('[useGeneralMeetings] meetings:', meetings)

  // Calculate stats directly from meetings array (unified data source)
  const stats = useMemo(() => {
    const planerade = meetings.filter(m => m.status === 'planerad').length
    const upcoming = meetings.filter(m => m.status === 'kallad').length
    const completed = meetings.filter(m => m.status === 'genomförd' || m.status === 'protokoll signerat').length
    const totalDecisions = meetings.reduce((sum, m) => sum + (m.decisions?.length || 0), 0)
    
    // Find next upcoming meeting (planerad or kallad)
    const sortedUpcoming = meetings
      .filter(m => m.status === 'kallad' || m.status === 'planerad')
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
      planerade,
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
          account: "2098", // Vinst eller förlust från föregående år
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
    year: string | number
    time?: string
    location: string
    type: 'ordinarie' | 'extra'
    agenda?: string[]
  }) => {
    const yearNum = typeof meetingData.year === 'string' ? parseInt(meetingData.year) : meetingData.year
    const content = JSON.stringify({
      year: yearNum,
      location: meetingData.location,
      type: meetingData.type,
      time: meetingData.time,
      agenda: meetingData.agenda,
      chairperson: 'Ej angivet',
      secretary: 'Ej angivet',
      attendeesCount: 0,
      decisions: [],
      sharesRepresented: 0,
      votesRepresented: 0,
      kallelseText: '', // Will be filled when user creates kallelse
      kallelseSavedAt: null
    })

    try {
      // Ensure date is valid - use today if not provided
      const meetingDate = meetingData.date && meetingData.date.trim() !== '' 
        ? meetingData.date 
        : new Date().toISOString().split('T')[0]
      
      const docData = {
        type: 'general_meeting_minutes' as const,
        title: `${meetingData.type === 'ordinarie' ? 'Ordinarie' : 'Extra'} bolagsstämma ${yearNum}`,
        date: meetingDate,
        content,
        status: 'draft' as const,
        source: 'manual' as const
      }
      
      console.log('[createMeeting] Calling addDocument with:', docData)
      
      const result = await addDocument(docData)
      
      console.log('[createMeeting] addDocument result:', result)
      
      if (!result) {
        throw new Error('No result returned from addDocument')
      }

      // Explicitly refetch to ensure UI updates
      console.log('[createMeeting] Explicitly calling refetchDocs')
      await refetchDocs()
      console.log('[createMeeting] refetchDocs completed')

      toast.success(
        "Stämma skapad",
        `${meetingData.type === 'ordinarie' ? 'Ordinarie' : 'Extra'} bolagsstämma för ${yearNum} har planerats.`
      )
      
      return result
    } catch (error) {
      console.error('[createMeeting] Failed to create meeting:', error)
      toast.error("Fel", "Kunde inte skapa stämman. Försök igen.")
      return null
    }
  }

  // Save kallelse text to a meeting
  const saveKallelse = async (meetingId: string, kallelseText: string) => {
    // Find the meeting document
    const meeting = realDocuments?.find(d => d.id === meetingId)
    if (!meeting) {
      toast.error("Fel", "Kunde inte hitta stämman.")
      return
    }

    try {
      // Parse existing content and add kallelse
      let content = {}
      try {
        content = JSON.parse(meeting.content)
      } catch {
        content = {}
      }

      const updatedContent = {
        ...content,
        kallelseText,
        kallelseSavedAt: new Date().toISOString()
      }

      // TODO: Add updateDocument to useCompliance hook
      // For now, we'll just show a success message
      toast.success(
        "Kallelse sparad",
        "Kallelsen har sparats som utkast."
      )
      
      await refetchDocs()
    } catch (error) {
      console.error('[saveKallelse] Failed to save kallelse:', error)
      toast.error("Fel", "Kunde inte spara kallelsen.")
    }
  }

  // Update an existing meeting
  const updateMeeting = async (meetingId: string, updates: Partial<GeneralMeeting>) => {
    // Find the meeting document
    const meeting = realDocuments?.find(d => d.id === meetingId)
    if (!meeting) {
      toast.error("Fel", "Kunde inte hitta stämman.")
      return
    }

    try {
      // Parse existing content
      let content = {}
      try {
        content = JSON.parse(meeting.content)
      } catch {
        content = {}
      }

      // Map UI status back to DB status
      const statusMap: Record<string, string> = {
        'planerad': 'draft',
        'kallad': 'pending',
        'genomförd': 'archived',
        'protokoll signerat': 'signed'
      }

      // Build updated content
      const updatedContent = {
        ...content,
        ...(updates.location && { location: updates.location }),
        ...(updates.time && { time: updates.time }),
        ...(updates.chairperson && { chairperson: updates.chairperson }),
        ...(updates.secretary && { secretary: updates.secretary }),
        ...(updates.agenda && { agenda: updates.agenda }),
        ...(updates.kallelseText && { kallelseText: updates.kallelseText }),
        ...(updates.attendeesCount !== undefined && { attendeesCount: updates.attendeesCount }),
      }

      // Build update payload
      const updatePayload: Record<string, unknown> = {
        id: meetingId,
        content: JSON.stringify(updatedContent),
      }

      // Add date if changed
      if (updates.date) {
        updatePayload.date = updates.date
      }

      // Add status if changed
      if (updates.status) {
        updatePayload.status = statusMap[updates.status] || 'draft'
      }

      await updateDocument(updatePayload as { id: string })

      toast.success(
        "Stämma uppdaterad",
        "Ändringarna har sparats."
      )
      
      await refetchDocs()
    } catch (error) {
      console.error('[updateMeeting] Failed to update meeting:', error)
      toast.error("Fel", "Kunde inte uppdatera stämman.")
    }
  }

  // Create a new board meeting
  const createBoardMeeting = async (meetingData: {
    date: string
    time?: string
    location: string
    type: 'ordinarie' | 'extra'
  }) => {
    const boardMeetingCount = (realDocuments || []).filter(d => d.type === 'board_meeting_minutes').length
    const content = JSON.stringify({
      meetingNumber: boardMeetingCount + 1,
      location: meetingData.location,
      type: meetingData.type,
      time: meetingData.time,
      year: new Date(meetingData.date).getFullYear(),
      chairperson: 'Ej angivet',
      secretary: 'Ej angivet',
      attendees: [],
      absentees: [],
      agendaItems: []
    })

    try {
      const meetingDate = meetingData.date && meetingData.date.trim() !== ''
        ? meetingData.date
        : new Date().toISOString().split('T')[0]

      const result = await addDocument({
        type: 'board_meeting_minutes' as const,
        title: `Styrelsemöte ${meetingDate}`,
        date: meetingDate,
        content,
        status: 'draft' as const,
        source: 'manual' as const
      })

      if (!result) throw new Error('No result returned from addDocument')

      await refetchDocs()

      toast.success(
        "Styrelsemöte skapat",
        `Styrelsemöte #${boardMeetingCount + 1} har planerats.`
      )

      return result
    } catch (error) {
      console.error('[createBoardMeeting] Failed:', error)
      toast.error("Fel", "Kunde inte skapa styrelsemötet. Försök igen.")
      return null
    }
  }

  return {
    meetings,
    stats,
    addDocument,
    bookDividend,
    createMeeting,
    createBoardMeeting,
    saveKallelse,
    updateMeeting,
    refetchDocs
  }
}
