"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Bot, Check, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { AiDeduction } from "./use-create-payslip-logic"

interface StepReviewProps {
    selectedEmp: { name: string, role: string, lastSalary: number }
    recommendedSalary: number
    customSalary: string
    setCustomSalary: (v: string) => void
    useAIRecommendation: boolean
    setUseAIRecommendation: (v: boolean) => void
    finalSalary: number
    tax: number
    netSalary: number
    aiDeductions: AiDeduction[]
    isCreating: boolean
    onConfirm: () => void
    onBack: () => void
}

export function StepReview({
    selectedEmp,
    recommendedSalary,
    customSalary,
    setCustomSalary,
    useAIRecommendation,
    setUseAIRecommendation,
    finalSalary,
    tax,
    netSalary,
    aiDeductions,
    isCreating,
    onConfirm,
    onBack
}: StepReviewProps) {
    return (
        <div className="space-y-6">
            <div className="bg-muted/30 p-4 rounded-lg space-y-4">
               <div className="flex items-start justify-between">
                    <div>
                        <h4 className="font-semibold text-sm">Grundlön</h4>
                        <p className="text-2xl font-bold">{selectedEmp.lastSalary.toLocaleString("sv-SE")} kr</p>
                    </div>
                </div>

                {aiDeductions.length > 0 && (
                    <div className="space-y-2 border-t pt-4">
                        <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Justeringar (AI)</Label>
                        {aiDeductions.map((d, i) => (
                            <div key={i} className="flex justify-between text-sm">
                                <span className="flex items-center gap-2">
                                    <Bot className="h-3 w-3 text-purple-600" />
                                    {d.label}
                                </span>
                                <span className={cn("font-medium", d.amount < 0 ? "text-green-600" : "text-red-600")}>
                                    {d.amount > 0 ? "-" : "+"}{Math.abs(d.amount).toLocaleString("sv-SE")} kr
                                </span>
                            </div>
                        ))}
                    </div>
                )}
                
                <div className="pt-4 border-t flex items-center justify-between">
                    <div className="space-y-1">
                        <Label className="text-sm font-medium">Rekommenderad Bruttolön</Label>
                        <p className="text-sm text-muted-foreground">Baserat på avtal och justeringar</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xl font-bold text-green-600">{recommendedSalary.toLocaleString("sv-SE")} kr</p>
                    </div>
                </div>
            </div>

            <div className="flex items-center space-x-2 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-900">
                <Switch 
                    id="ai-mode" 
                    checked={useAIRecommendation}
                    onCheckedChange={setUseAIRecommendation}
                />
                <Label htmlFor="ai-mode" className="flex-1 cursor-pointer">
                    Använd AI-rekommendation
                </Label>
            </div>

            {!useAIRecommendation && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                    <Label>Anpassad Bruttolön</Label>
                    <Input 
                        type="number" 
                        value={customSalary} 
                        onChange={e => setCustomSalary(e.target.value)}
                        placeholder="Ange belopp..."
                    />
                </div>
            )}

            <div className="grid grid-cols-3 gap-2 text-center pt-2">
                <div className="bg-muted/20 p-2 rounded">
                    <p className="text-xs text-muted-foreground">Brutto</p>
                    <p className="font-semibold">{finalSalary.toLocaleString("sv-SE")}</p>
                </div>
                <div className="bg-muted/20 p-2 rounded">
                    <p className="text-xs text-muted-foreground">Skatt (30%)</p>
                    <p className="font-semibold text-red-600">-{tax.toLocaleString("sv-SE")}</p>
                </div>
                <div className="bg-primary/5 p-2 rounded border border-primary/20">
                    <p className="text-xs text-muted-foreground">Utbetalning</p>
                    <p className="font-bold text-primary">{netSalary.toLocaleString("sv-SE")}</p>
                </div>
            </div>

            <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={onBack}>
                    Tillbaka
                </Button>
                <Button className="flex-1" onClick={onConfirm} disabled={isCreating}>
                    {isCreating ? "Skapar..." : (
                        <>
                            <Check className="mr-2 h-4 w-4" />
                            Signera & Skapa
                        </>
                    )}
                </Button>
            </div>
        </div>
    )
}
