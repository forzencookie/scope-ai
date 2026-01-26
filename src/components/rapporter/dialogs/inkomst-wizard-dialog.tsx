"use client"

import { AIWizardDialog } from "./ai-wizard-dialog"

interface InkomstWizardDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm?: () => void
}

export function InkomstWizardDialog({ open, onOpenChange, onConfirm }: InkomstWizardDialogProps) {
    return (
        <AIWizardDialog
            open={open}
            onOpenChange={onOpenChange}
            onConfirm={onConfirm}
            step1={{
                title: "Välj beskattningsår",
                periodLabel: "Inkomstår 2024",
                periodSubtitle: "INK2 - Aktiebolag",
                deadlineLabel: "Deadline",
                deadline: "1 jul 2025",
                icon: <span className="text-primary">📅</span>,
                summaryItems: [
                    { label: "Rörelseintäkter", value: "1 420 000 kr" },
                    { label: "Rörelsekostnader", value: "-1 041 000 kr" },
                    { label: "Bokfört resultat", value: "379 000 kr" },
                ],
            }}
            step2={{
                initialPrompt: "Finns det något speciellt som påverkar inkomstdeklarationen?",
                promptHint: "T.ex. skattemässiga justeringar, underskott att rulla, särskilda avdrag",
                responseHandler: (msg) => {
                    const lower = msg.toLowerCase()
                    if (lower.includes("avskrivning") || lower.includes("inventarier")) {
                        return "Förstått! Jag har justerat avskrivningar enligt bokföringen."
                    }
                    if (lower.includes("underskott") || lower.includes("förlust")) {
                        return "Noterat! Underskottet kommer att rullas framåt enligt reglerna."
                    }
                    return "Jag har noterat det. Finns det något mer som påverkar deklarationen?"
                },
            }}
            step3={{
                title: "INK2 - Inkomstår 2024",
                subtitle: "Aktiebolag",
                icon: <span>📄</span>,
                summaryRows: [
                    { label: "Rörelseresultat", value: "379 000 kr" },
                    { label: "Skattemässiga justeringar", value: "0 kr" },
                    { label: "Beräknad skatt (20,6%)", value: "78 074 kr" },
                ],
                resultLabel: "Skattemässigt resultat",
                resultValue: "379 000 kr",
            }}
        />
    )
}
