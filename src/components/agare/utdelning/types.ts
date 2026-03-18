export interface DividendDecision {
    id: string
    year: number
    amount: number
    taxRate: string
    tax: number
    netAmount: number
    status: 'planned' | 'decided' | 'booked'
    meetingId: string
    meetingDate: string
    decisionId: string
}
