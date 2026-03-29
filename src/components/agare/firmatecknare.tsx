"use client"

import { PageHeader } from "@/components/shared"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useCompany } from "@/providers/company-provider"
import { useCompliance, type Shareholder } from "@/hooks/use-compliance"
import { useChatNavigation } from "@/hooks/use-chat-navigation"
import { PenTool, Shield, User, Loader2, Plus } from "lucide-react"

function SignatoryCard({ shareholder }: { shareholder: Shareholder }) {
    return (
        <div className="flex items-center gap-4 rounded-lg border p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <User className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{shareholder.name}</p>
                <p className="text-xs text-muted-foreground">
                    {shareholder.boardRole || "Firmatecknare"}
                </p>
            </div>
            <div className="text-right shrink-0">
                {shareholder.ownershipPercentage > 0 && (
                    <p className="text-sm font-medium tabular-nums">
                        {shareholder.ownershipPercentage.toFixed(1)}%
                    </p>
                )}
                {shareholder.isBoardMember && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                        <Shield className="h-3 w-3" />
                        Styrelseledamot
                    </span>
                )}
            </div>
        </div>
    )
}

export function Firmatecknare() {
    const { company, companyType } = useCompany()
    const { shareholders, isLoadingShareholders } = useCompliance()
    const { navigateToAI } = useChatNavigation()

    // Filter to signatories: board members or those with signing authority
    // For AB: board members (especially Ordförande, VD)
    // For HB/KB: all partners typically have signing rights
    const signatories = shareholders.filter(s => {
        if (companyType === 'hb' || companyType === 'kb') return true
        return s.isBoardMember || (s.boardRole && s.boardRole !== '')
    })

    const signingRule = companyType === 'ab'
        ? "Styrelsen tecknar firman. Enskild firmateckningsrätt kan beviljas av styrelsen."
        : companyType === 'hb' || companyType === 'kb'
            ? "Alla bolagsmän tecknar firman var för sig, om inte annat avtalats i bolagsavtalet."
            : "Styrelsen tecknar firman. Stadgarna kan ge enskilda ledamöter firmateckningsrätt."

    return (
        <div className="space-y-6 max-w-4xl">
            <PageHeader
                title="Firmatecknare"
                subtitle="Registrerade firmatecknare och behörigheter."
                actions={
                    <Button
                        size="sm"
                        onClick={() => navigateToAI({ prompt: "Hjälp mig att registrera en ny firmatecknare" })}
                    >
                        <Plus className="h-4 w-4 mr-1" />
                        Lägg till
                    </Button>
                }
            />

            {/* Signing rule info */}
            <Card className="bg-muted/30 border-muted">
                <CardContent className="flex items-start gap-3 pt-4">
                    <PenTool className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium">Firmateckningsrätt</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            {signingRule}
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Signatories list */}
            {isLoadingShareholders ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Laddar firmatecknare...
                </div>
            ) : signatories.length === 0 ? (
                <Card>
                    <CardContent className="py-8 text-center">
                        <p className="text-sm text-muted-foreground">
                            Inga firmatecknare registrerade ännu.
                            Be Scooby registrera aktieägare eller styrelseledamöter.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-2">
                    {signatories.map((s) => (
                        <SignatoryCard key={s.id} shareholder={s} />
                    ))}
                </div>
            )}
        </div>
    )
}
