"use client"

import { Sparkles } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useTextMode } from "@/providers/text-mode-provider"
import { BAS_ACCOUNTS, BOOKING_CATEGORIES, type BookableEntity } from "./booking-types"

interface BookingStepBookingProps {
    entity: BookableEntity
    hasAiSuggestion: boolean
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

    return (
        <div className="space-y-6">
            {/* AI Suggestion indicator */}
            {hasAiSuggestion && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Sparkles className="h-4 w-4 text-violet-600" />
                    <span>Förslag baserat på AI-analys</span>
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
                        <Label>{text.bookkeeping.debit}</Label>
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
                    </div>

                    <div className="space-y-2">
                        <Label>{text.bookkeeping.credit}</Label>
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
                {(entity.amount && parseFloat(entity.amount.replace(/[^0-9.-]/g, '')) > 25000) && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                        <Sparkles className="h-4 w-4 text-blue-600 mt-0.5" />
                        <div className="space-y-2">
                            <div className="text-sm">
                                <p className="font-medium text-blue-800 dark:text-blue-200">
                                    Registrera som inventarie?
                                </p>
                                <p className="text-blue-700 dark:text-blue-300 text-xs">
                                    Beloppet överstiger ett halvt prisbasbelopp. Det kan vara fördelaktigt att skriva av denna kostnad över tid.
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
                )}
            </div>
        </div>
    )
}
