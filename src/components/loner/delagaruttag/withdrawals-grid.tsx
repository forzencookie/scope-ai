import { formatCurrency, formatDate, cn } from "@/lib/utils"
import { MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  GridTableHeader,
  GridTableRow,
  GridTableRows
} from "@/components/ui/grid-table"
import { AppStatusBadge } from "@/components/ui/status-badge"
import { Withdrawal, TYPE_CONFIG } from "@/types/withdrawal"
import { Calendar } from "lucide-react"

interface WithdrawalsGridProps {
  withdrawals: Withdrawal[]
}

export function WithdrawalsGrid({ withdrawals }: WithdrawalsGridProps) {
  return (
    <div className="overflow-x-auto pb-4 -mx-2">
      <div className="min-w-[800px] px-2">
        <GridTableHeader
          minWidth="0"
          columns={[
            { label: "Datum", icon: Calendar, span: 2 },
            { label: "Delägare", span: 2 },
            { label: "Beskrivning", span: 3 },
            { label: "Typ", span: 2 },
            { label: "Belopp", span: 2 },
            { label: "", span: 1 },
          ]}
        />
        <GridTableRows>
          {withdrawals.map((withdrawal) => {
            const config = TYPE_CONFIG[withdrawal.type]

            return (
              <GridTableRow key={withdrawal.id} minWidth="0">
                <div className="col-span-2 font-medium">
                  {formatDate(withdrawal.date)}
                </div>
                <div className="col-span-2">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-medium text-primary">
                      {withdrawal.partnerName.substring(0, 2).toUpperCase()}
                    </div>
                    {withdrawal.partnerName}
                  </div>
                </div>
                <div className="col-span-3 text-sm text-muted-foreground truncate">
                  {withdrawal.description}
                </div>
                <div className="col-span-2">
                  <AppStatusBadge 
                     // eslint-disable-next-line @typescript-eslint/no-explicit-any
                     status={config.label as any} 
                     className={config.color}
                  />
                </div>
                <div className={cn(
                  "col-span-2 font-mono font-medium",
                  withdrawal.type === 'insättning' ? "text-green-600 dark:text-green-500" : "text-foreground"
                )}>
                  {withdrawal.type === 'insättning' ? '+' : '-'}{formatCurrency(withdrawal.amount)}
                </div>
                <div className="col-span-1 flex justify-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Redigera</DropdownMenuItem>
                      <DropdownMenuItem>Makulera</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </GridTableRow>
            )
          })}
        </GridTableRows>
      </div>
    </div>
  )
}
