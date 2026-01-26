"use client"

import { AIWizardDialog } from "./ai-wizard-dialog"

interface ArsredovisningWizardDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm?: () => void
}

export function ArsredovisningWizardDialog({ open, onOpenChange, onConfirm }: ArsredovisningWizardDialogProps) {
    return (
        <AIWizardDialog
            open={open}
            onOpenChange={onOpenChange}
            onConfirm={onConfirm}
            step1={{
                title: "Välj räkenskapsår",
                periodLabel: "Räkenskapsår 2024",
                periodSubtitle: "2024-01-01 – 2024-12-31",
                deadlineLabel: "Deadline",
                deadline: "30 jun 2025",
                icon: <span className="text-primary">🏢</span>,
                summaryItems: [
                    { label: "Nettoomsättning", value: "1 420 000 kr" },
                    { label: "Årets resultat", value: "301 000 kr" },
                    { label: "Balansomslutning", value: "890 000 kr" },
                ],
            }}
            step2={{
                initialPrompt: "Finns det något speciellt som ska med i årsredovisningen?",
                promptHint: "T.ex. väsentliga händelser, personalförändringar, framtidsutsikter",
                responseHandler: (msg) => {
                    const lower = msg.toLowerCase()
                    if (lower.includes("händelse") || lower.includes("väsentlig")) {
                        return "Förstått! Jag lägger till detta under Väsentliga händelser i förvaltningsberättelsen."
                    }
                    if (lower.includes("personal") || lower.includes("anställd")) {
                        return "Noterat! Jag uppdaterar personalnoten med den informationen."
                    }
                    return "Jag har noterat det. Finns det något mer att ta med i förvaltningsberättelsen?"
                },
            }}
            step3={{
                title: "Årsredovisning 2024",
                subtitle: "K2-regelverk",
                icon: <span>🏢</span>,
                summaryRows: [
                    { label: "Nettoomsättning", value: "1 420 000 kr" },
                    { label: "Årets resultat", value: "301 000 kr", negative: true },
                    { label: "Balansomslutning", value: "890 000 kr" },
                ],
                resultLabel: "Årets resultat",
                resultValue: "301 000 kr",
                generatedParts: ["Förvaltningsberättelse", "Resultaträkning", "Balansräkning", "Noter"],
            }}
        />
    )
}
