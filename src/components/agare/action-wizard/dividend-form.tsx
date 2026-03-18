"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Shareholder } from "@/hooks/use-compliance"
import type { DividendData } from "./constants"

interface DividendFormProps {
    shareholders: Shareholder[]
    onBack: () => void
    onSubmit: (data: DividendData) => void
}

export function DividendForm({ shareholders, onBack, onSubmit }: DividendFormProps) {
    const [dividendTotal, setDividendTotal] = useState("")

    const totalShares = shareholders.reduce((acc, s) => acc + s.sharesCount, 0)

    const handleSubmit = () => {
        onSubmit({
            dividendTotal
        })
    }

    return (
        <div className="space-y-4">
            <Card className="p-4">
                <div className="space-y-4">
                    <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-lg border border-indigo-100 dark:border-indigo-900">
                        <p className="text-sm text-indigo-700 dark:text-indigo-300">
                            Totalt antal aktier: <span className="font-bold">{totalShares.toLocaleString()}</span>
                        </p>
                    </div>
                    <div>
                        <Label htmlFor="dividendTotal">Total utdelning (SEK)</Label>
                        <Input
                            id="dividendTotal"
                            type="number"
                            placeholder="t.ex. 100000"
                            value={dividendTotal}
                            onChange={(e) => setDividendTotal(e.target.value)}
                            className="mt-1.5"
                        />
                        {dividendTotal && totalShares > 0 && (
                            <p className="text-xs text-muted-foreground mt-2 px-1">
                                = {(parseFloat(dividendTotal) / totalShares).toFixed(2)} SEK per aktie
                            </p>
                        )}
                    </div>
                    <div>
                        <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Fördelning per aktieägare</Label>
                        <div className="space-y-1.5 mt-2">
                            {shareholders.length === 0 ? (
                                <p className="text-sm text-muted-foreground italic">Inga aktieägare hittades.</p>
                            ) : (
                                shareholders.map(s => (
                                    <div key={s.id} className="flex justify-between items-center text-sm p-2.5 bg-muted/30 rounded-lg border border-transparent hover:border-muted-foreground/10 transition-colors">
                                        <div className="flex flex-col">
                                            <span className="font-medium">{s.name} <span className="text-muted-foreground font-normal ml-1">({s.ownershipPercentage}%)</span></span>
                                            <span className="text-[10px] text-muted-foreground uppercase">{s.sharesCount.toLocaleString()} aktier</span>
                                        </div>
                                        <span className="font-mono">
                                            {dividendTotal && !isNaN(parseFloat(dividendTotal))
                                                ? (parseFloat(dividendTotal) * s.ownershipPercentage / 100).toLocaleString('sv-SE', { style: 'currency', currency: 'SEK' })
                                                : '–'}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </Card>
            <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={onBack}>Tillbaka</Button>
                <Button onClick={handleSubmit}>Fortsätt till granskning</Button>
            </div>
        </div>
    )
}
