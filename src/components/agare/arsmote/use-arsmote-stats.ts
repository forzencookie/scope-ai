import { useMemo } from "react"
import { type AnnualMeeting, Motion } from "@/types/meeting"
import { useCompliance } from "@/hooks/use-compliance"
import { useMembers } from "@/hooks/use-members"

export function useArsmoteStats() {
  const { documents: realDocuments, isLoadingDocuments, addDocument } = useCompliance()
  const { members } = useMembers()

  // Get voting-eligible members
  const votingMembers = useMemo(() => {
    return (members || []).filter(m => m.status === 'aktiv' && m.currentYearFeePaid)
  }, [members])

  // Map real documents to AnnualMeeting format
  const meetings = useMemo(() => {
    return (realDocuments || [])
      .filter(doc => doc.type === 'general_meeting_minutes')
      .map((doc) => {
        let content: Partial<AnnualMeeting> = {
          year: new Date(doc.date).getFullYear(),
          location: 'Ej angivet',
          chairperson: '',
          secretary: '',
          attendeesCount: 0,
          decisions: [],
          motions: [],
          type: 'ordinarie' as const
        }

        try {
          const parsed = JSON.parse(doc.content)
          content = { ...content, ...parsed }
        } catch (e) {
          // Fallback
        }

        return {
          id: doc.id,
          date: doc.date,
          status: (doc.status === 'signed' ? 'protokoll signerat' : (doc.status === 'archived' ? 'genomförd' : 'planerad')) as AnnualMeeting['status'],
          ...content
        } as AnnualMeeting
      })
  }, [realDocuments])

  // Calculate stats
  const stats = useMemo(() => {
    const now = new Date()
    const upcomingMeetings = meetings.filter(m => m.status === 'planerad' || m.status === 'kallad')
    const completedMeetings = meetings.filter(m => m.status === 'protokoll signerat')
    const nextMeeting = upcomingMeetings.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]

    const allMotions = meetings.flatMap(m => m.motions || [])
    const pendingMotions = allMotions.filter((m: Motion) => m.status === 'mottagen').length
    const totalMotions = nextMeeting?.motions?.length || 0

    const daysUntilNext = nextMeeting
      ? Math.ceil((new Date(nextMeeting.date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null

    // Preparation checklist progress
    const preparationItems = nextMeeting ? [
      { label: 'Datum bestämt', done: !!nextMeeting.date },
      { label: 'Lokal bokad', done: !!nextMeeting.location && nextMeeting.location !== 'Ej angivet' },
      { label: 'Kallelse skickad', done: nextMeeting.status === 'kallad' },
      { label: 'Motioner behandlade', done: pendingMotions === 0 && totalMotions > 0 },
      { label: 'Dagordning klar', done: true }, // Assume standard agenda
    ] : []

    const prepProgress = preparationItems.length > 0
      ? Math.round((preparationItems.filter(i => i.done).length / preparationItems.length) * 100)
      : 0

    return {
      upcomingCount: upcomingMeetings.length,
      completedCount: completedMeetings.length,
      nextMeeting,
      daysUntilNext,
      pendingMotions,
      totalMotions,
      votingMembersCount: votingMembers.length,
      preparationItems,
      prepProgress
    }
  }, [meetings, votingMembers])

  return {
    meetings,
    stats,
    isLoading: isLoadingDocuments,
    members: members || [],
    addDocument
  }
}
