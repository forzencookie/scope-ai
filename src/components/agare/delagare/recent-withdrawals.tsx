import { useState } from "react"
import { TrendingUp, TrendingDown, Calendar, User, Banknote } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { FilterTabs } from "@/components/ui/filter-tabs"
import { GridTableHeader, GridTableRow, GridTableRows } from "@/components/ui/grid-table"
import { Checkbox } from "@/components/ui/checkbox"
import { AppStatusBadge } from "@/components/ui/status-badge"
import { useBulkSelection } from "@/components/shared/bulk-action-toolbar"
import { formatCurrency } from "@/lib/utils"
import { useOwnerWithdrawals } from "@/components/loner/delagaruttag/use-owner-withdrawals"

export function RecentWithdrawals() {
    const { withdrawals } = useOwnerWithdrawals()
    const [withdrawalFilter, setWithdrawalFilter] = useState<'all' | 'uttag' | 'insättning'>('all')

    const filteredWithdrawals = withdrawals.filter(withdrawal =>
        withdrawalFilter === 'all' || withdrawal.type === withdrawalFilter
    ).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10)

    const selection = useBulkSelection(filteredWithdrawals)

    return (
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Senaste uttag & insättningar</CardTitle>
              <CardDescription>
                Kapitalrörelser per delägare
              </CardDescription>
            </div>
            <FilterTabs
              options={[
                { value: 'all', label: 'Alla', count: withdrawals.length },
                { value: 'uttag', label: 'Uttag', icon: <TrendingDown className="h-3 w-3" />, count: withdrawals.filter(w => w.type === 'uttag').length },
                { value: 'insättning', label: 'Insättningar', icon: <TrendingUp className="h-3 w-3" />, count: withdrawals.filter(w => w.type === 'insättning').length },
              ]}
              value={withdrawalFilter}
              onChange={(v) => setWithdrawalFilter(v as 'all' | 'uttag' | 'insättning')}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div>
            <GridTableHeader
              columns={[
                { label: "", span: 1 }, // Checkbox
                { label: "Datum", icon: Calendar, span: 2 },
                { label: "Delägare", icon: User, span: 2 },
                { label: "Typ", span: 2 },
                { label: "Beskrivning", span: 3 },
                { label: "Belopp", icon: Banknote, span: 2, align: 'right' },
              ]}
            />
            <GridTableRows>
              {filteredWithdrawals.map((withdrawal) => (
                <GridTableRow key={withdrawal.id}>
                  {/* Checkbox */}
                  <div className="col-span-1 flex items-center">
                    <Checkbox
                      checked={selection.isSelected(withdrawal.id)}
                      onCheckedChange={() => selection.toggleItem(withdrawal.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>

                  <div className="col-span-2 text-sm text-muted-foreground">{withdrawal.date}</div>
                  <div className="col-span-2 font-medium">{withdrawal.partnerName}</div>
                  <div className="col-span-2">
                    <AppStatusBadge
                      status={withdrawal.type === 'uttag' ? 'Uttag' : 'Insättning'}
                    />
                  </div>
                  <div className="col-span-3 text-sm text-muted-foreground truncate">{withdrawal.description}</div>
                  <div className="col-span-2 text-right font-mono">
                    <span className={withdrawal.type === 'uttag' ? 'text-red-600 dark:text-red-500/70' : 'text-green-600 dark:text-green-500/70'}>
                      {withdrawal.type === 'uttag' ? '-' : '+'}{formatCurrency(withdrawal.amount)}
                    </span>
                  </div>
                </GridTableRow>
              ))}
            </GridTableRows>
          </div>
        </CardContent>
      </Card>
    )
}
