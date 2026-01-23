// Types for Board Meeting Logic

export interface AgendaItem {
  id: string
  number: number
  title: string
  description?: string
  decision?: string
  responsible?: string
}

export interface BoardMeeting {
  id: string
  meetingNumber: number
  date: string
  location: string
  status: 'planerad' | 'genomförd' | 'protokoll signerat'
  type: 'ordinarie' | 'extra' | 'konstituerande'
  
  // People
  chairperson: string
  secretary: string
  attendees: string[]
  absentees: string[]
  
  // Content
  agendaItems: AgendaItem[]
}
