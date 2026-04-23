// Types for withdrawals
import { AppStatus } from "@/components/ui"
import { GENERAL_STATUS_LABELS } from "@/lib/localization"
import { ArrowUpRight, ArrowDownRight, Wallet } from "lucide-react"

export interface Withdrawal {
  id: string
  partnerId: string
  partnerName: string
  date: string
  amount: number
  type: 'uttag' | 'insättning' | 'lön'
  description: string
  approved: boolean
}

// Configuration for visual display
export const TYPE_CONFIG: Record<Withdrawal['type'], { label: AppStatus; color: string; icon: typeof ArrowUpRight }> = {
  uttag: { 
     label: GENERAL_STATUS_LABELS.UTTAG, 
     color: 'text-red-600 bg-red-50 dark:text-red-500/70 dark:bg-red-950/50', 
     icon: ArrowUpRight 
  },
  insättning: { 
     label: GENERAL_STATUS_LABELS.INSATTNING, 
     color: 'text-green-600 bg-green-50 dark:text-green-500/70 dark:bg-green-950/50', 
     icon: ArrowDownRight 
  },
  lön: { 
     label: GENERAL_STATUS_LABELS.LON, 
     color: 'text-violet-600 bg-violet-50 dark:text-violet-400 dark:bg-violet-950/50', 
     icon: Wallet 
  },
}

// BAS Accounts for partners (HB/KB)
// BAS standard: 3-account range per partner starting at 2071
// Partner 1: 2071 (capital), 2072 (withdrawal), 2073 (deposit)
// Partner 2: 2074 (capital), 2075 (withdrawal), 2076 (deposit)
// etc.
export function getPartnerAccounts(partnerIndex: number, accountBase?: number): { capital: string, withdrawal: string, deposit: string } {
  const base = accountBase ?? (2071 + (partnerIndex * 3))
  return {
    capital: String(base),
    withdrawal: String(base + 1),
    deposit: String(base + 2),
  }
}

