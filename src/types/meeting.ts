export interface Motion {
  id: string
  title: string
  submittedBy: string
  submittedDate: string
  description: string
  boardResponse?: string
  status: 'mottagen' | 'behandlad' | 'godkänd' | 'avslagen'
}

export interface Decision {
  id: string
  title: string
  decision: string
  votingResult?: {
    for: number
    against: number
    abstained: number
  }
}

export interface AnnualMeeting {
  id: string
  year: number
  date: string
  location: string
  status: 'planerad' | 'kallad' | 'genomförd' | 'protokoll signerat'
  type: 'ordinarie' | 'extra'
  
  // Details
  chairperson?: string
  secretary?: string
  
  // Content
  attendeesCount?: number
  votingMembersCount?: number
  motions?: Motion[]
  decisions?: Decision[]
}
