import { User, Percent, Banknote, Wallet } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { AppStatusBadge } from "@/components/ui/status-badge"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { GridTableHeader, GridTableRow, GridTableRows } from "@/components/ui/grid-table"
import { SearchBar } from "@/components/ui/search-bar"
import { useBulkSelection } from "@/components/shared/bulk-action-toolbar"
import { formatCurrency, cn } from "@/lib/utils"
import { Partner } from "@/data/ownership"

interface PartnersGridProps {
    partners: Partner[] // Filtered partners
    showKommanditdelägare: boolean
    onSearchChange: (val: string) => void
    searchValue: string
}

export function PartnersGrid({ partners, showKommanditdelägare, onSearchChange, searchValue }: PartnersGridProps) {
    const selection = useBulkSelection(partners)

    const formatPersonalNumber = (pnr: string | undefined) => {
        if (!pnr) return "-"
        return pnr.length > 8 ? `${pnr.substring(0, 8)}-****` : pnr
    }

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Registrerade delägare</CardTitle>
              <CardDescription>
                {showKommanditdelägare
                  ? 'Komplementärer har obegränsat personligt ansvar, kommanditdelägare har begränsat ansvar.'
                  : 'Alla delägare har solidariskt och obegränsat personligt ansvar.'
                }
              </CardDescription>
            </div>
            <SearchBar
              placeholder="Sök delägare..."
              value={searchValue}
              onChange={onSearchChange}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div>
            <GridTableHeader
              columns={[
                { label: "", span: 1 }, // Checkbox
                { label: "Namn", icon: User, span: 3 },
                { label: "Personnummer", span: 2 },
                ...(showKommanditdelägare ? [{ label: "Typ", span: 2 }] : []),
                { label: "Ägarandel", icon: Percent, span: 1, align: 'right' },
                { label: "Insatskapital", icon: Banknote, span: showKommanditdelägare ? 1.5 : 2, align: 'right' },
                { label: "Kapitalsaldo", icon: Wallet, span: showKommanditdelägare ? 1.5 : 2, align: 'right' },
              ]}
            />
            <GridTableRows>
              {partners.map((partner) => (
                <GridTableRow key={partner.id}>
                  {/* Checkbox */}
                  <div className="col-span-1 flex items-center">
                    <Checkbox
                      checked={selection.isSelected(partner.id)}
                      onCheckedChange={() => selection.toggleItem(partner.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>

                  {/* Name */}
                  <div className="col-span-3 font-semibold">
                    {partner.name}
                  </div>

                  {/* PNR */}
                  <div className="col-span-2 font-mono text-sm text-muted-foreground">
                    {formatPersonalNumber(partner.personalNumber)}
                  </div>

                  {/* Type (Conditional) */}
                  {showKommanditdelägare && (
                    <div className="col-span-2">
                      <AppStatusBadge
                        status={partner.type === 'komplementär' ? 'Komplementär' : 'Kommanditdelägare'}
                      />
                    </div>
                  )}

                  {/* Ownership */}
                  <div className="col-span-1 text-right">
                    {partner.ownershipPercentage}%
                  </div>

                  {/* Capital */}
                  <div className={cn("text-right font-mono", showKommanditdelägare ? "col-span-[1.5]" : "col-span-2")}>
                    {formatCurrency(partner.capitalContribution)}
                  </div>

                  {/* Balance */}
                  <div className={cn("text-right font-mono", showKommanditdelägare ? "col-span-[1.5]" : "col-span-2")}>
                    <span className={
                        partner.currentCapitalBalance < partner.capitalContribution ? 'text-amber-600' : 'text-green-600 dark:text-green-500/70'
                    }>
                      {formatCurrency(partner.currentCapitalBalance)}
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
