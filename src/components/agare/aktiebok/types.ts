export type StockTransactionType = 'Nyemission' | 'Köp' | 'Försäljning' | 'Gåva' | 'Arv' | 'Split'

export interface AktiebokStats {
    totalShares: number
    totalVotes: number
    shareholderCount: number
    totalValue: number
}

export interface ShareholderDisplay {
    id: string
    name: string
    personalNumber?: string
    type: 'person' | 'company'
    shares: number
    shareClass: 'A' | 'B'
    ownershipPercentage: number
    acquisitionDate: string
    votes: number
    votesPercentage: number
}

export interface TransactionDisplay {
    id: string
    date: string
    type: string
    fromShareholder?: string
    toShareholder: string
    shares: number
    shareClass: string
    pricePerShare: number
    totalPrice: number
}
