import { useMemo } from "react"
import { useCompliance } from "@/hooks/use-compliance"
import { BoardMeeting, AgendaItem } from "@/types/board-meeting"

export function useBoardMinutes() {
  const { documents: realDocuments, isLoadingDocuments, addDocument } = useCompliance()

  // Map real documents to BoardMeeting format
  const meetings = useMemo(() => {
    const realMeetings = (realDocuments || [])
      .filter(doc => doc.type === 'board_meeting_minutes')
      .map((doc, idx) => {
        let content = {
          meetingNumber: idx + 1, // Fallback if not in content
          location: 'Ej angivet',
          chairperson: 'Ej angivet',
          secretary: 'Ej angivet',
          attendees: [] as string[],
          agendaItems: [] as AgendaItem[],
          type: 'ordinarie' as const,
          absentees: [] as string[]
        }

        try {
          // Re-serialize content if it's JSON
          const parsed = JSON.parse(doc.content)
          if (parsed && typeof parsed === 'object') {
             content = { ...content, ...parsed }
             // Safety: Ensure arrays are arrays efficiently
             if (!Array.isArray(content.attendees)) content.attendees = [];
             if (!Array.isArray(content.agendaItems)) content.agendaItems = [];
             if (!Array.isArray(content.absentees)) content.absentees = [];
          }
        } catch (e) {
          console.warn("Failed to parse meeting content:", doc.id, e)
        }

        return {
          id: doc.id,
          date: doc.date,
          status: (doc.status === 'signed' ? 'protokoll signerat' : (doc.status === 'archived' ? 'genomförd' : 'planerad')) as BoardMeeting['status'],
          absentees: content.absentees || [],
          type: content.type,
          meetingNumber: content.meetingNumber,
          location: content.location,
          chairperson: content.chairperson,
          secretary: content.secretary,
          attendees: content.attendees,
          agendaItems: content.agendaItems
        } as BoardMeeting
      })

    return realMeetings
  }, [realDocuments])

  // Calculate stats from meetings data
  const stats = useMemo(() => {
    const signed = meetings.filter(m => m.status === 'protokoll signerat').length
    const completed = meetings.filter(m => m.status === 'genomförd').length
    const planned = meetings.filter(m => m.status === 'planerad').length
    const totalDecisions = meetings.reduce((sum, m) =>
      sum + m.agendaItems.filter(item => item.decision).length, 0
    )

    return { signed, completed, planned, totalDecisions }
  }, [meetings])

  // Determine Hero Meeting (Priority: Planned > Signed > Completed)
  const heroMeeting = useMemo(() => {
    const planned = meetings.filter(m => m.status === 'planerad').sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]
    if (planned) return { meeting: planned, label: 'Nästa möte' }

    const latest = meetings.filter(m => m.status !== 'planerad').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
    if (latest) return { meeting: latest, label: 'Senaste protokoll' }

    return null
  }, [meetings])

  return {
    meetings,
    stats,
    heroMeeting,
    isLoading: isLoadingDocuments,
    addDocument
  }
}
