"use client"

import { Navbar, Footer } from "@/components/landing"
import { ThemeProvider } from "@/providers/theme-provider"

export default function TermsPage() {
    return (
        <ThemeProvider attribute="class" forcedTheme="light" enableSystem={false}>
            <main className="light min-h-screen bg-white font-sans text-stone-900 selection:bg-stone-200 selection:text-stone-900 scroll-smooth relative overflow-x-hidden">
                <div className="relative z-10">
                    <Navbar />

                    <div className="pt-32 pb-24 px-6 md:px-12 lg:px-24 max-w-[900px] mx-auto">
                        <h1 className="text-4xl font-bold tracking-tight mb-8">Allmänna Villkor</h1>

                        <div className="prose prose-stone max-w-none prose-lg">
                            <p className="lead">
                                Dessa allmänna villkor reglerar användningen av Scope AIs tjänster. Genom att använda tjänsten godkänner du dessa villkor.
                            </p>

                            <h3>1. Tjänsten</h3>
                            <p>
                                Scope AI tillhandahåller en molnbaserad bokföringstjänst som använder artificiell intelligens för att automatisera bokföringsprocesser. Tjänsten tillhandahålls &quot;i befintligt skick&quot;.
                            </p>

                            <h3>2. Användarkonto</h3>
                            <p>
                                För att använda vissa delar av tjänsten måste du skapa ett konto. Du är ansvarig för att hålla dina inloggningsuppgifter hemliga och för all aktivitet som sker på ditt konto.
                            </p>

                            <h3>3. Betalning och prenumeration</h3>
                            <p>
                                Vissa funktioner i tjänsten kan vara avgiftsbelagda. Betalningsvillkor framgår vid beställning. Vi förbehåller oss rätten att ändra priser med 30 dagars varsel.
                            </p>

                            <h3>4. Användarens ansvar</h3>
                            <p>
                                Du ansvarar för att det material du laddar upp inte bryter mot lag eller tredje parts rättigheter. Scope AI tar inget ansvar för korrektheten i den bokföring som genereras, det är alltid användarens ansvar att granska och godkänna bokföringen.
                            </p>

                            <h3>5. Ansvarsbegränsning</h3>
                            <p>
                                Scope AI ansvarar inte för indirekta skador, utebliven vinst eller dataförlust som kan uppstå vid användning av tjänsten.
                            </p>

                            <h3>6. Uppsägning</h3>
                            <p>
                                Du kan när som helst säga upp ditt konto. Vi förbehåller oss rätten att stänga av konton som bryter mot dessa villkor.
                            </p>

                            <h3>7. Ändringar av villkor</h3>
                            <p>
                                Vi kan komma att uppdatera dessa villkor. Väsentliga ändringar meddelas via e-post eller i tjänsten.
                            </p>
                        </div>
                    </div>

                    <Footer />
                </div>
            </main>
        </ThemeProvider>
    )
}
