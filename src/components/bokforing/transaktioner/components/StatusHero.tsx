import { AlertCircle, CheckCircle2, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TRANSACTION_STATUSES } from "@/types"

interface StatusHeroProps {
    pendingCount: number
    onViewPending: () => void
}

export function StatusHero({ pendingCount, onViewPending }: StatusHeroProps) {
    if (pendingCount > 0) {
        return (
            <div className="rounded-xl border-2 border-amber-200 dark:border-amber-900/50 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0">
                            <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-bold text-amber-700 dark:text-amber-300">{pendingCount}</span>
                                <span className="text-amber-600 dark:text-amber-400 font-medium">transaktioner att granska</span>
                            </div>
                            <p className="text-sm text-amber-600/80 dark:text-amber-400/70 mt-0.5">
                                Kräver kvitto eller bokföring innan periodbokslut
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        className="border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 shrink-0"
                        onClick={onViewPending}
                    >
                        Visa alla
                        <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="rounded-xl border-2 border-green-200 dark:border-green-900/50 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 p-5">
            <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                    <span className="text-lg font-semibold text-green-700 dark:text-green-300">Allt är i ordning!</span>
                    <p className="text-sm text-green-600/80 dark:text-green-400/70">Alla transaktioner är granskade och bokförda</p>
                </div>
            </div>
        </div>
    )
}
