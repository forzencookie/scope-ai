"use client"

import dynamic from "next/dynamic"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

/**
 * Test page: Document previews & audit cards
 *
 * Only documents that produce downloadable/printable output for
 * external parties. Form previews (VAT, AGI, K10, INK2) are NOT
 * here — they overlap with the walkthrough system and should
 * become walkthroughs instead.
 *
 * Same for FinancialReportPreview — covered by resultaträkning
 * and balansräkning walkthroughs.
 */

const PayslipPreview = dynamic(() => import("@/components/ai/documents/payslip-preview").then(m => ({ default: m.PayslipPreview })), { ssr: false })
const BoardMinutesPreview = dynamic(() => import("@/components/ai/documents/board-minutes-preview").then(m => ({ default: m.BoardMinutesPreview })), { ssr: false })
const ShareRegisterPreview = dynamic(() => import("@/components/ai/documents/share-register-preview").then(m => ({ default: m.ShareRegisterPreview })), { ssr: false })
const AgmPreparationPreview = dynamic(() => import("@/components/ai/documents/agm-preparation-preview").then(m => ({ default: m.AgmPreparationPreview })), { ssr: false })

// Card-registry wrappers — same documents but delivered via chat (include PDF download action)
const ShareRegisterCard = dynamic(() => import("@/components/ai/cards/ShareRegisterCard").then(m => ({ default: m.ShareRegisterCard })), { ssr: false })
const PayslipCard = dynamic(() => import("@/components/ai/cards/PayslipCard").then(m => ({ default: m.PayslipCard })), { ssr: false })
const BoardMinutesCard = dynamic(() => import("@/components/ai/cards/BoardMinutesCard").then(m => ({ default: m.BoardMinutesCard })), { ssr: false })

function Section({ label, description, children }: { label: string; description: string; children: React.ReactNode }) {
    return (
        <div className="space-y-3">
            <div>
                <h3 className="text-sm font-semibold">{label}</h3>
                <p className="text-xs text-muted-foreground">{description}</p>
            </div>
            <div className="max-w-2xl">{children}</div>
        </div>
    )
}

const noopActions = {}

export default function TestDocumentsPage() {
    return (
        <div className="min-h-screen bg-background pb-20">
            <div className="max-w-3xl mx-auto px-6 pt-6">
                <Link
                    href="/test-ui/walkthroughs"
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Walkthroughs & Overlays
                </Link>
            </div>

            <div className="max-w-3xl mx-auto px-6 py-8 space-y-12">
                {/* === DOCUMENT PREVIEWS === */}
                <div>
                    <h1 className="text-2xl font-bold tracking-tight mb-1">Dokumentförhandsvisningar</h1>
                    <p className="text-sm text-muted-foreground mb-8">
                        Formella dokument som Scooby genererar — lönebesked, styrelseprotokoll,
                        aktiebok. Vit bakgrund, redo för PDF/utskrift.
                    </p>

                    <div className="space-y-12">
                        <Section label="Lönebesked (PayslipPreview)" description="Svensk lönespecifikation — lönearter, skatt, netto, semester, ackumulerat">
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
                                vacationInfo={{
                                    paidDaysRemaining: 18,
                                    savedDays: 5,
                                    earnedDaysThisYear: 7,
                                }}
                                ytd={{
                                    grossYTD: 118580,
                                    taxYTD: 37524,
                                    netYTD: 81056,
                                }}
                                actions={noopActions}
                            />
                        </Section>

                        <Section label="Styrelseprotokoll (BoardMinutesPreview)" description="Formellt protokoll — närvarolista, dagordning, beslut, underskrifter">
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
                        </Section>

                        <Section label="Aktiebok (ShareRegisterPreview)" description="Utdrag ur aktieboken enligt ABL">
                            <ShareRegisterPreview
                                data={{
                                    companyName: "Scope AI AB",
                                    orgNumber: "559123-4567",
                                    date: "2026-03-28",
                                    totalShares: 1000,
                                    totalCapital: 50000,
                                    shareholders: [
                                        { id: "1", name: "Erik Svensson", personalOrOrgNumber: "850101-1234", shareCount: 600, shareClass: "Stamaktier A", votingRights: 600, acquisitionDate: "2024-01-15" },
                                        { id: "2", name: "Maria Johansson", personalOrOrgNumber: "900515-5678", shareCount: 250, shareClass: "Stamaktier A", votingRights: 250, acquisitionDate: "2024-06-01" },
                                        { id: "3", name: "Tech Invest AB", personalOrOrgNumber: "556789-0123", shareCount: 150, shareClass: "Stamaktier B", votingRights: 15, acquisitionDate: "2025-03-10" },
                                    ],
                                }}
                                actions={noopActions}
                            />
                        </Section>

                        <Section label="Bolagsstämma — förberedelse (AgmPreparationPreview)" description="Checklista inför ordinarie bolagsstämma med dokumentstatus och dagordning">
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
                        </Section>

                    </div>
                </div>

                {/* === DOKUMENTKORT (chat-levererade) === */}
                <div className="border-t pt-12">
                    <h1 className="text-2xl font-bold tracking-tight mb-1">Dokumentkort via chatten</h1>
                    <p className="text-sm text-muted-foreground mb-8">
                        Samma dokument, men levererade av Scooby i chat via kortregistret.
                        Inkluderar PDF-nedladdning. Dessa är vad användaren ser inline i konversationen.
                    </p>

                    <div className="space-y-12">
                        <Section label="Aktiebok (ShareRegisterCard)" description="Chat-version med PDF-nedladdning">
                            <ShareRegisterCard
                                data={{
                                    companyName: "Scope Consulting AB",
                                    orgNumber: "559123-4567",
                                    date: "2026-04-14",
                                    totalShares: 1000,
                                    totalCapital: 100000,
                                    shareholders: [
                                        { id: "sh1", name: "Anders Richnau", personalOrOrgNumber: "900101-1234", shareCount: 800, shareClass: "A", votingRights: 10, acquisitionDate: "2022-01-01" },
                                        { id: "sh2", name: "Invest Partner AB", personalOrOrgNumber: "559987-6543", shareCount: 200, shareClass: "B", votingRights: 1, acquisitionDate: "2023-06-15" },
                                    ],
                                }}
                            />
                        </Section>

                        <Section label="Lönebesked (PayslipCard)" description="Chat-version med PDF-nedladdning">
                            <PayslipCard
                                company={{ name: "Scope Consulting AB", orgNumber: "559123-4567", address: "Kungsgatan 12, 111 35 Stockholm" }}
                                employee={{ name: "Anna Lindberg", personalNumber: "900101-1234", role: "Frontend-utvecklare" }}
                                period="April 2026"
                                grossSalary={42000}
                                adjustments={[
                                    { label: "Kommunalskatt (30,62%)", amount: 12860, type: "deduction" },
                                    { label: "Friskvårdsbidrag", amount: 416, type: "addition" },
                                ]}
                                taxRate={30.62}
                                taxAmount={12860}
                                netSalary={29556}
                                paymentDate="2026-04-25"
                                employerContributions={13196}
                                benefits={[{ name: "Friskvårdsbidrag", value: 5000 }]}
                            />
                        </Section>

                        <Section label="Styrelseprotokoll (BoardMinutesCard)" description="Chat-version med PDF-nedladdning">
                            <BoardMinutesCard
                                data={{
                                    companyName: "Scope Consulting AB",
                                    meetingType: "Styrelsemöte",
                                    meetingNumber: "4/2026",
                                    date: "2026-04-14",
                                    time: "14:00",
                                    location: "Kungsgatan 12, Stockholm",
                                    attendees: [
                                        { name: "Anders Richnau", role: "Chairman", present: true },
                                        { name: "Lisa Nilsson", role: "Member", present: true },
                                        { name: "Johan Berg", role: "Member", present: false },
                                    ],
                                    agenda: [
                                        "Val av ordförande och sekreterare",
                                        "Godkännande av föregående protokoll",
                                        "Beslut om utdelning 2025",
                                        "Övriga frågor",
                                    ],
                                    decisions: [
                                        { id: "d1", paragraph: "§1", title: "Val av ordförande", description: "Valet av ordförande för mötet.", decision: "Anders Richnau valdes till ordförande.", type: "election" },
                                        { id: "d2", paragraph: "§3", title: "Utdelning 2025", description: "Styrelsen beslutade om utdelning för räkenskapsåret 2025.", decision: "Utdelning fastställd till 150 000 kr totalt. Betalas ut 2026-05-01.", type: "decision" },
                                    ],
                                    nextMeeting: "2026-07-15",
                                    signatures: [
                                        { role: "Ordförande", name: "Anders Richnau" },
                                        { role: "Justerare", name: "Lisa Nilsson" },
                                    ],
                                }}
                            />
                        </Section>
                    </div>
                </div>

            </div>
        </div>
    )
}
