"use client"

import { Sparkles, Loader2 } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { useTextMode } from "@/providers/text-mode-provider"
import { useCompany } from "@/providers/company-provider"
import { BAS_ACCOUNTS, BOOKING_CATEGORIES, type BookableEntity } from "./booking-types"
import { isInventarieThresholdExceeded, getPriceBaseAmount } from "@/lib/swedish-tax-rules"
import { Lock } from "lucide-react"

interface BookingStepBookingProps {
    entity: BookableEntity
    hasAiSuggestion: boolean
    aiSuggestionLoading?: boolean
    aiReasoning?: string
    aiConfidence?: number
    category: string
    setCategory: (category: string) => void
    debitAccount: string
    setDebitAccount: (account: string) => void
    creditAccount: string
    setCreditAccount: (account: string) => void
    description: string
    setDescription: (desc: string) => void
}

export function BookingStepBooking({
    entity,
    hasAiSuggestion,
    aiSuggestionLoading = false,
    aiReasoning,
    aiConfidence,
    category,
    setCategory,
    debitAccount,
    setDebitAccount,
    creditAccount,
    setCreditAccount,
    description,
    setDescription,
}: BookingStepBookingProps) {
    const { text } = useTextMode()
    const { company } = useCompany()
    const isCashMethod = company?.accountingMethod === 'cash'

    return (
        <div className="space-y-6">
            {/* AI loading state */}
            {aiSuggestionLoading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin text-violet-600" />
                    <span>Analyserar med AI...</span>
                </div>
            )}

            {/* AI Suggestion indicator */}
            {!aiSuggestionLoading && hasAiSuggestion && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Sparkles className="h-4 w-4 text-violet-600" />
                    <span>Förslag baserat på AI-analys</span>
                    {aiConfidence != null && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Badge variant="secondary" className="text-xs gap-1">
                                    <Sparkles className="h-3 w-3" />
                                    AI-förslag {aiConfidence}%
                                </Badge>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="max-w-xs">
                                {aiReasoning || 'AI-baserat konteringsförslag'}
                            </TooltipContent>
                        </Tooltip>
                    )}
                </div>
            )}

            {/* Editable booking fields */}
            <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
                <div className="space-y-2">
                    <Label>Kategori</Label>
                    <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger>
                            <SelectValue placeholder="Välj kategori..." />
                        </SelectTrigger>
                        <SelectContent>
                            {BOOKING_CATEGORIES.map(cat => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            {text.bookkeeping.debit}
                            {!aiSuggestionLoading && hasAiSuggestion && (
                                <Badge variant="outline" className="text-[10px] font-normal text-violet-600 border-violet-300">
                                    AI-förslag
                                </Badge>
                            )}
                        </Label>
                        {aiSuggestionLoading ? (
                            <div className="h-10 rounded-md border bg-muted animate-pulse flex items-center px-3">
                                <span className="text-sm text-muted-foreground">Analyserar...</span>
                            </div>
                        ) : (
                        <Select value={debitAccount} onValueChange={setDebitAccount}>
                            <SelectTrigger>
                                <SelectValue placeholder="Välj konto..." />
                            </SelectTrigger>
                            <SelectContent>
                                {BAS_ACCOUNTS.map(acc => (
                                    <SelectItem key={acc.value} value={acc.value}>
                                        {acc.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            {isCashMethod ? 'Betalas från' : text.bookkeeping.credit}
                            {isCashMethod && <Lock className="h-3 w-3 text-muted-foreground" />}
                        </Label>
                        {isCashMethod ? (
                            <div className="h-10 rounded-md border bg-muted/50 flex items-center px-3 text-sm text-muted-foreground">
                                Företagskonto (1930)
                            </div>
                        ) : (
                        <Select value={creditAccount} onValueChange={setCreditAccount}>
                            <SelectTrigger>
                                <SelectValue placeholder="Välj konto..." />
                            </SelectTrigger>
                            <SelectContent>
                                {BAS_ACCOUNTS.map(acc => (
                                    <SelectItem key={acc.value} value={acc.value}>
                                        {acc.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        )}
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Beskrivning (valfritt)</Label>
                    <Textarea
                        placeholder="Lägg till en beskrivning..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>

                {/* Asset Registration Logic */}
                {(() => {
                    const cleanAmount = parseFloat(entity.amount.replace(/[^0-9.-]/g, ''))
                    const isExpense = cleanAmount < 0
                    const isHighValue = isInventarieThresholdExceeded(Math.abs(cleanAmount), entity.date)
                    const isNotStock = !['Inköp varor', 'Material'].includes(category)
                    const isNotIncome = !['Intäkter'].includes(category)

                    if (isExpense && isHighValue && isNotStock && isNotIncome) {
                        return (
                            <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                                <Sparkles className="h-4 w-4 text-blue-600 mt-0.5" />
                                <div className="space-y-2">
                                    <div className="text-sm">
                                        <p className="font-medium text-blue-800 dark:text-blue-200">
                                            Registrera som inventarie?
                                        </p>
                                        <p className="text-blue-700 dark:text-blue-300 text-xs">
                                            Beloppet ({Math.abs(cleanAmount).toLocaleString('sv-SE')} kr) överstiger ett halvt prisbasbelopp. Det är oftast fördelaktigt att skriva av denna kostnad över tid (avskrivningar).
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="asset-reg"
                                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setDebitAccount("1210") // Maskiner och inventarier
                                                } else {
                                                    setDebitAccount("5410") // Förbrukningsinventarier
                                                }
                                            }}
                                        />
                                        <label htmlFor="asset-reg" className="text-sm font-medium text-blue-900 dark:text-blue-100 cursor-pointer">
                                            Ja, lägg till i anläggningsregistret
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )
                    }
                    return null
                })()}
            </div>
        </div>
    )
}
