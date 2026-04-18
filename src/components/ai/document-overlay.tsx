"use client"

import dynamic from "next/dynamic"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"

export type DocumentType = "payslip" | "board-minutes" | "share-register" | "agm"

const PayslipPreview = dynamic(
    () => import("@/components/ai/documents/payslip-preview").then(m => ({ default: m.PayslipPreview })),
    { ssr: false }
)
const BoardMinutesPreview = dynamic(
    () => import("@/components/ai/documents/board-minutes-preview").then(m => ({ default: m.BoardMinutesPreview })),
    { ssr: false }
)
const ShareRegisterPreview = dynamic(
    () => import("@/components/ai/documents/share-register-preview").then(m => ({ default: m.ShareRegisterPreview })),
    { ssr: false }
)
const AgmPreparationPreview = dynamic(
    () => import("@/components/ai/documents/agm-preparation-preview").then(m => ({ default: m.AgmPreparationPreview })),
    { ssr: false }
)

const DOCUMENT_TITLES: Record<DocumentType, string> = {
    "payslip": "Lönespecifikation",
    "board-minutes": "Styrelseprotokoll",
    "share-register": "Aktiebok",
    "agm": "Bolagsstämma — förberedelse",
}

const noopActions = {}

function DocumentContent({ type }: { type: DocumentType }) {
    switch (type) {
        case "payslip":
            return (
                <PayslipPreview
                    company={{ name: "Scope AI AB", orgNumber: "559123-4567", address: "Kungsgatan 12, 111 35 Stockholm" }}
                    employee={{ name: "Anna Lindberg", personalNumber: "920315-1234", employeeId: "1003" }}
                    period="2026-03-01 – 2026-03-31"
                    grossSalary={42000}
                    lineItems={[
                        { label: "Månadslön", amount: 42000, type: "earning" },
                        { label: "Friskvårdsbidrag", amount: 500, type: "earning" },
                        { label: "Sjukavdrag (2 dgr)", amount: 2800, type: "deduction" },
                        { label: "Karensavdrag", amount: 1120, type: "deduction" },
                    ]}
                    taxRate={0.324}
                    taxAmount={12508}
                    netSalary={26072}
                    paymentDate="2026-03-25"
                    employerContributions={12122}
                    vacationInfo={{ paidDaysRemaining: 18, savedDays: 5, earnedDaysThisYear: 7 }}
                    ytd={{ grossYTD: 118580, taxYTD: 37524, netYTD: 81056 }}
                    actions={noopActions}
                />
            )
        case "board-minutes":
            return (
                <BoardMinutesPreview
                    data={{
                        companyName: "Scope AI AB",
                        orgNumber: "559123-4567",
                        meetingType: "Styrelsemöte",
                        meetingNumber: "3/2026",
                        date: "2026-03-28",
                        time: "14:00",
                        location: "Kungsgatan 12, Stockholm",
                        attendees: [
                            { name: "Erik Svensson", role: "Chairman", present: true },
                            { name: "Maria Johansson", role: "Member", present: true },
                            { name: "Johan Berg", role: "Member", present: true },
                            { name: "Anna Lindberg", role: "Secretary", present: true },
                            { name: "Karl Nilsson", role: "Deputy", present: false },
                        ],
                        agenda: [
                            "Mötets öppnande",
                            "Val av protokolljusterare",
                            "Godkännande av dagordning",
                            "Ekonomisk rapport Q1 2026",
                            "Beslut om utdelning",
                            "Övriga frågor",
                            "Mötets avslutande",
                        ],
                        decisions: [
                            { id: "1", paragraph: "\u00A71", title: "Mötets öppnande", description: "Ordföranden Erik Svensson förklarade mötet öppnat och hälsade alla välkomna.", decision: "Mötet förklarades öppnat.", type: "info" },
                            { id: "2", paragraph: "\u00A72", title: "Val av protokolljusterare", description: "Maria Johansson föreslogs att jämte ordföranden justera dagens protokoll.", decision: "Maria Johansson valdes att justera protokollet.", type: "election" },
                            { id: "3", paragraph: "\u00A74", title: "Ekonomisk rapport Q1 2026", description: "VD presenterade kvartalsrapporten. Omsättningen uppgick till 462 000 kr med ett rörelseresultat om 152 000 kr, vilket överstiger budget.", decision: "Styrelsen godkände den ekonomiska rapporten och lade den till handlingarna.", type: "decision" },
                            { id: "4", paragraph: "\u00A75", title: "Beslut om utdelning", description: "Styrelsen behandlade förslag om utdelning. Enligt balansräkningen finns fritt eget kapital om 820 000 kr. Styrelsen bedömer att utdelning kan ske utan att äventyra bolagets ställning.", decision: "Styrelsen beslutade att föreslå bolagsstämman en utdelning om 150 000 kr per aktie, totalt 150 000 000 öre.", type: "decision" },
                        ],
                        nextMeeting: "2026-05-15 kl. 14:00",
                        signatures: [
                            { role: "Ordförande", name: "Erik Svensson" },
                            { role: "Justerare", name: "Maria Johansson" },
                            { role: "Sekreterare", name: "Anna Lindberg" },
                        ],
                    }}
                    actions={noopActions}
                />
            )
        case "share-register":
            return (
                <ShareRegisterPreview
                    data={{
                        companyName: "Scope AI AB",
                        orgNumber: "559123-4567",
                        date: "2026-03-28",
                        totalShares: 1000,
                        totalCapital: 50000,
                        shareholders: [
                            {
                                id: "1",
                                name: "Erik Svensson",
                                personalOrOrgNumber: "850101-1234",
                                shareNumbers: { from: 1, to: 600 },
                                shareCount: 600,
                                shareClass: "Stamaktier A",
                                votingRights: 600,
                                acquisitionDate: "2024-01-15",
                            },
                            {
                                id: "2",
                                name: "Maria Johansson",
                                personalOrOrgNumber: "900515-5678",
                                shareNumbers: { from: 601, to: 850 },
                                shareCount: 250,
                                shareClass: "Stamaktier A",
                                votingRights: 250,
                                acquisitionDate: "2024-06-01",
                            },
                            {
                                id: "3",
                                name: "Tech Invest AB",
                                personalOrOrgNumber: "556789-0123",
                                shareNumbers: { from: 851, to: 1000 },
                                shareCount: 150,
                                shareClass: "Stamaktier B",
                                votingRights: 15,
                                acquisitionDate: "2025-03-10",
                            },
                        ],
                        restrictions: [
                            { type: "hembud", description: "Aktier som överlåts ska först erbjudas övriga aktieägare." },
                            { type: "samtycke", description: "Överlåtelse av aktier kräver styrelsens samtycke." },
                        ],
                    }}
                    actions={noopActions}
                />
            )
        case "agm":
            return (
                <AgmPreparationPreview
                    data={{
                        fiscalYear: 2025,
                        suggestedDate: "2026-06-15",
                        proposedDividend: 150000,
                        agenda: [
                            "Val av ordförande och sekreterare",
                            "Godkännande av dagordning",
                            "Framläggande av årsredovisning",
                            "Fastställande av resultat- och balansräkning",
                            "Resultatdisposition — utdelning 150 000 kr",
                            "Ansvarsfrihet för styrelsen",
                            "Val av styrelse och revisor",
                        ],
                        requiredDocuments: [
                            { name: "Årsredovisning 2025", status: "ready" },
                            { name: "Revisionsberättelse", status: "pending" },
                            { name: "Kallelse till aktieägarna", status: "missing" },
                            { name: "Fullmaktsformulär", status: "ready" },
                        ],
                    }}
                    actions={noopActions}
                />
            )
    }
}

interface DocumentOverlayProps {
    type: DocumentType | null
    onClose: () => void
}

export function DocumentOverlay({ type, onClose }: DocumentOverlayProps) {
    return (
        <Sheet open={type !== null} onOpenChange={(open) => { if (!open) onClose() }}>
            <SheetContent
                side="right"
                className="w-[90vw] max-w-4xl p-0 flex flex-col overflow-hidden"
            >
                <SheetHeader className="px-6 py-4 border-b border-border shrink-0">
                    <SheetTitle>{type ? DOCUMENT_TITLES[type] : ""}</SheetTitle>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto px-6 py-6">
                    {type && <DocumentContent type={type} />}
                </div>
            </SheetContent>
        </Sheet>
    )
}
