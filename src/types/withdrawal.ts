// Types for withdrawals
import { AppStatus } from "@/components/ui/status-badge"
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

// BAS Accounts
export const PARTNER_ACCOUNTS: Record<string, { capital: string, withdrawal: string, deposit: string }> = {
  'p-1': { capital: '2010', withdrawal: '2013', deposit: '2018' },
  'p-2': { capital: '2020', withdrawal: '2023', deposit: '2028' },
}
