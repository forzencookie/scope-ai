import { useMemo, useCallback } from "react"
import { useCompliance } from "@/hooks/use-compliance"
import { type GeneralMeeting, type GeneralMeetingDecision } from "@/types/ownership"
import { useVerifications } from "@/hooks/use-verifications"
import { useToast } from "@/components/ui/toast"

export interface KallelseRecipient {
  name: string
  shares: number
  shareClass: string
  ownershipPercentage: number
}

/**
 * useGeneralMeetings - Logic for handling bolagsstämmor and board meetings.
 * 
 * This hook consumes strictly typed GeneralMeeting objects from the Service layer.
 * No manual JSON parsing of 'content' fields.
 */
export function useGeneralMeetings() {
  const { 
    documents: realDocuments, 
    addDocument, 
    updateDocument, 
    shareholders: realShareholders, 
    refetchDocs 
  } = useCompliance()
  
  const { addVerification } = useVerifications()
  const toast = useToast()

  // Map real documents to GeneralMeeting format
  // realDocuments is already typed as CompanyMeeting[] (which is GeneralMeeting[])
  const meetings = useMemo(() => {
    return (realDocuments || []).sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  }, [realDocuments])

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

  const bookDividend = async (meeting: GeneralMeeting, decision: GeneralMeetingDecision) => {
    if (!decision.amount) return

    await addVerification({
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

    // Update the decision status in the database
    const updatedDecisions = meeting.decisions.map(d => 
      d.id === decision.id ? { ...d, booked: true } : d
    )

    try {
      await updateDocument({
        id: meeting.id,
        decisions: updatedDecisions,
      })
      await refetchDocs()
      
      toast.success(
        "Utdelning bokförd",
        `Bokfört ${decision.amount?.toLocaleString('sv-SE')} kr som skuld till aktieägare.`
      )
    } catch (err) {
      console.error('[bookDividend] Failed:', err)
      toast.error("Bokföring misslyckades", "Kunde inte uppdatera stämmoprotokollet.")
    }
  }

  // Create a new meeting
  const createMeeting = async (meetingData: {
    date: string
    year: string | number
    time?: string
    location: string
    type: 'ordinarie' | 'extra'
    agenda?: string[]
  }) => {
    const yearNum = typeof meetingData.year === 'string' ? parseInt(meetingData.year) : meetingData.year
    
    try {
      const result = await addDocument({
        type: 'annual',
        title: `${meetingData.type === 'ordinarie' ? 'Ordinarie' : 'Extra'} bolagsstämma ${yearNum}`,
        date: meetingData.date,
        location: meetingData.location,
        status: 'draft',
      })
      
      await refetchDocs()

      toast.success(
        "Stämma skapad",
        `${meetingData.type === 'ordinarie' ? 'Ordinarie' : 'Extra'} bolagsstämma för ${yearNum} har planerats.`
      )
      
      return result
    } catch (error) {
      console.error('[createMeeting] Failed:', error)
      toast.error("Fel", "Kunde inte skapa stämman.")
      return null
    }
  }

  // Create a new board meeting
  const createBoardMeeting = async (meetingData: {
    date: string
    time?: string
    location: string
    type: 'ordinarie' | 'extra'
  }) => {
    try {
      const result = await addDocument({
        type: 'board',
        title: `Styrelsemöte ${meetingData.date}`,
        date: meetingData.date,
        location: meetingData.location,
        status: 'draft',
      })

      await refetchDocs()

      toast.success("Styrelsemöte skapat", "Styrelsemötet har planerats.")
      return result
    } catch (error) {
      console.error('[createBoardMeeting] Failed:', error)
      toast.error("Fel", "Kunde inte skapa styrelsemötet.")
      return null
    }
  }

  // Update an existing meeting
  const updateMeeting = async (meetingId: string, updates: Partial<GeneralMeeting>) => {
    try {
      await updateDocument({
        id: meetingId,
        ...updates
      })

      toast.success("Stämma uppdaterad", "Ändringarna har sparats.")
      await refetchDocs()
    } catch (error) {
      console.error('[updateMeeting] Failed:', error)
      toast.error("Fel", "Kunde inte uppdatera stämman.")
    }
  }

  // Save kallelse text
  const saveKallelse = async (meetingId: string, kallelseText: string) => {
    try {
      await updateDocument({
        id: meetingId,
        kallelseText,
        status: 'kallad'
      })

      toast.success("Kallelse sparad", "Kallelsen har skickats till alla aktieägare.")
      await refetchDocs()
    } catch (error) {
      console.error('[saveKallelse] Failed:', error)
      toast.error("Fel", "Kunde inte spara kallelsen.")
    }
  }

  /**
   * Get kallelse recipients from shareholders
   */
  const getKallelseRecipients = useCallback((): KallelseRecipient[] => {
    if (!realShareholders || realShareholders.length === 0) return []

    const totalShares = realShareholders.reduce((sum: number, s) => sum + s.sharesCount, 0) || 1

    return realShareholders.map(s => ({
      name: s.name,
      shares: s.sharesCount,
      shareClass: s.shareClass || 'B',
      ownershipPercentage: Math.round((s.sharesCount / totalShares) * 100),
    }))
  }, [realShareholders])

  return {
    meetings,
    stats,
    addDocument,
    bookDividend,
    createMeeting,
    createBoardMeeting,
    saveKallelse,
    updateMeeting,
    refetchDocs,
    getKallelseRecipients,
  }
}
