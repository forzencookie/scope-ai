import { GridTableHeader, GridTableRows, GridTableRow } from "@/components/ui/grid-table"
import {
    MoreHorizontal,
    User,
    Building2,
    Hash,
    Vote,
    Calendar,
    Percent
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
}

export function ShareholdersGrid({ shareholders }: ShareholdersGridProps) {
    return (
        <div>
            <GridTableHeader
                columns={[
                    { label: 'Aktieägare', icon: User, span: 3 },
                    { label: 'Typ', icon: Building2, span: 2 },
                    { label: 'Aktier', icon: Hash, span: 2, align: 'right' },
                    { label: 'Ägarandel', icon: Percent, span: 1, align: 'right' },
                    { label: 'Röster', icon: Vote, span: 2, align: 'right' },
                    { label: 'Anskaffning', icon: Calendar, span: 1, align: 'right' },
                    { label: '', span: 1 }, // Actions
                ]}
            />
            <GridTableRows>
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

                        {/* 2. Typ */}
                        <div className="col-span-2">
                            <span className={cn(
                                "inline-flex px-2 py-0.5 rounded-full text-xs font-medium border",
                                shareholder.type === 'person'
                                    ? "bg-violet-50 text-violet-600 border-violet-100 dark:bg-violet-950/30 dark:text-violet-400 dark:border-violet-900"
                                    : "bg-purple-50 text-purple-600 border-purple-100"
                            )}>
                                {shareholder.type === 'person' ? 'Privatperson' : 'Bolag'}
                            </span>
                        </div>

                        {/* 3. Aktier */}
                        <div className="col-span-2">
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

                        {/* 4. Ägarandel */}
                        <div className="col-span-1">
                            <div className="font-medium tabular-nums">{shareholder.ownershipPercentage}%</div>
                        </div>

                        {/* 5. Röster */}
                        <div className="col-span-2">
                            <div className="tabular-nums font-medium">{shareholder.votes.toLocaleString('sv-SE')}</div>
                            <div className="text-xs text-muted-foreground">{shareholder.votesPercentage}% av röster</div>
                        </div>

                        {/* 6. Anskaffning */}
                        <div className="col-span-1 text-muted-foreground text-xs">
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
    )
}
