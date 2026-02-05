import { GridTableHeader, GridTableRows, GridTableRow } from "@/components/ui/grid-table"
import {
    MoreHorizontal,
    User,
    Building2,
    Hash,
    Vote,
    Calendar,
    Percent,
    Users
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn, formatDate } from "@/lib/utils"
import { ShareholderDisplay } from "../types"

interface ShareholdersGridProps {
    shareholders: ShareholderDisplay[]
    onAddShareholder?: () => void
}

export function ShareholdersGrid({ shareholders, onAddShareholder }: ShareholdersGridProps) {
    return (
        <div className="w-full overflow-x-auto pb-2">
            <div className="md:min-w-[800px]">
                <GridTableHeader
                    columns={[
                        { label: 'Aktieägare', icon: User, span: 3 },
                        { label: 'Typ', icon: Building2, span: 2, hiddenOnMobile: true },
                        { label: 'Aktier', icon: Hash, span: 2, align: 'right', hiddenOnMobile: true },
                        { label: 'Andel', icon: Percent, span: 2, align: 'right' },
                        { label: 'Röster', icon: Vote, span: 1, align: 'right', hiddenOnMobile: true },
                        { label: 'Datum', icon: Calendar, span: 1, align: 'right', hiddenOnMobile: true },
                        { label: '', span: 1 }, // Actions
                    ]}
            />
            <GridTableRows>
                {shareholders.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Inga aktieägare registrerade ännu</p>
                        {onAddShareholder && (
                            <Button
                                variant="outline"
                                className="mt-4"
                                onClick={onAddShareholder}
                            >
                                Lägg till aktieägare
                            </Button>
                        )}
                    </div>
                )}
                {shareholders.map((shareholder) => (
                    <GridTableRow key={shareholder.id}>
                        {/* 1. Ägare */}
                        <div className="col-span-3 flex items-center gap-3">
                            <div className="mt-0.5 text-muted-foreground">
                                {shareholder.type === 'person' ? (
                                    <User className="h-4 w-4" />
                                ) : (
                                    <Building2 className="h-4 w-4" />
                                )}
                            </div>
                            <div>
                                <div className="font-medium text-sm">{shareholder.name}</div>
                                <div className="text-xs text-muted-foreground">{shareholder.personalNumber}</div>
                            </div>
                        </div>

                        {/* 2. Typ - hidden on mobile */}
                        <div className="col-span-2 hidden md:block">
                            <span className={cn(
                                "inline-flex px-2 py-0.5 rounded-full text-xs font-medium border",
                                shareholder.type === 'person'
                                    ? "bg-violet-50 text-violet-600 border-violet-100 dark:bg-violet-950/30 dark:text-violet-400 dark:border-violet-900"
                                    : "bg-purple-50 text-purple-600 border-purple-100"
                            )}>
                                {shareholder.type === 'person' ? 'Privatperson' : 'Bolag'}
                            </span>
                        </div>

                        {/* 3. Aktier - hidden on mobile */}
                        <div className="col-span-2 hidden md:block">
                            <div className="tabular-nums font-medium">{shareholder.shares.toLocaleString('sv-SE')}</div>
                            <div className="flex items-center gap-1.5 mt-1">
                                <span className={cn(
                                    "text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-sm border",
                                    shareholder.shareClass === 'A'
                                        ? "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800"
                                        : "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800"
                                )}>
                                    {shareholder.shareClass}-aktier
                                </span>
                            </div>
                        </div>

                        {/* 4. Andel */}
                        <div className="col-span-2">
                            <div className="font-medium tabular-nums">{shareholder.ownershipPercentage}%</div>
                        </div>

                        {/* 5. Röster - hidden on mobile */}
                        <div className="col-span-1 hidden md:block">
                            <div className="tabular-nums font-medium">{shareholder.votes.toLocaleString('sv-SE')}</div>
                        </div>

                        {/* 6. Datum - hidden on mobile */}
                        <div className="col-span-1 text-muted-foreground text-xs hidden md:block">
                            {formatDate(shareholder.acquisitionDate)}
                        </div>

                        {/* 7. Actions */}
                        <div className="col-span-1 flex justify-end">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-transparent">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem>Visa detaljer</DropdownMenuItem>
                                    <DropdownMenuItem>Redigera</DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem>Registrera överlåtelse</DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-red-600">Ta bort</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </GridTableRow>
                ))}
            </GridTableRows>
            </div>
        </div>
    )
}
