import { LegalPageLayout } from "@/components/landing/layout/legal-page-layout"

export default function TermsPage() {
    return (
        <LegalPageLayout title="Allmänna Villkor" effectiveDate="20 Februari 2026">
            <p>
                Dessa allmänna villkor reglerar användningen av <strong className="text-white">scope ai</strong>:s tjänster. Genom att skapa ett konto eller använda tjänsten godkänner du dessa villkor i sin helhet.
            </p>

            {/* 1 */}
            <section>
                <h2 className="text-xl md:text-2xl font-bold text-white mb-4 tracking-tight">1. Tjänsten</h2>
                <p>
                    Scope AI tillhandahåller en molnbaserad bokföringstjänst som använder artificiell intelligens för att automatisera bokföringsprocesser. Tjänsten inkluderar, men är inte begränsad till:
                </p>
                <ul className="mt-3 space-y-2">
                    <li className="flex items-start gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2.5 shrink-0" />
                        Automatisk tolkning och kategorisering av kvitton och fakturor.
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2.5 shrink-0" />
                        AI-assisterad kontering och verifikationsskapande.
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2.5 shrink-0" />
                        Generering av rapporter, resultaträkning och balansräkning.
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2.5 shrink-0" />
                        Momsrapportering och stöd för inkomstdeklaration.
                    </li>
                </ul>
                <p className="mt-4 text-white/50 text-sm">
                    Tjänsten tillhandahålls &quot;i befintligt skick&quot; och är under aktiv utveckling (beta).
                </p>
            </section>

            {/* 2 */}
            <section>
                <h2 className="text-xl md:text-2xl font-bold text-white mb-4 tracking-tight">2. Användarkonto</h2>
                <p>
                    För att använda tjänsten måste du skapa ett konto med giltig e-postadress. Du ansvarar för att:
                </p>
                <ol className="mt-3 space-y-2 list-decimal list-inside marker:text-white/50">
                    <li>Hålla dina inloggningsuppgifter hemliga.</li>
                    <li>All aktivitet som sker på ditt konto.</li>
                    <li>Omedelbart meddela oss vid obehörig åtkomst.</li>
                </ol>
                <p className="mt-4">
                    Vi förbehåller oss rätten att stänga av konton som visar tecken på obehörigt nyttjande.
                </p>
            </section>

            {/* 3 */}
            <section>
                <h2 className="text-xl md:text-2xl font-bold text-white mb-4 tracking-tight">3. Betalning och prenumeration</h2>
                <p>
                    Tjänsten erbjuds i olika nivåer, inklusive en kostnadsfri plan och betalplaner med utökade funktioner.
                </p>
                <ul className="mt-3 space-y-2">
                    <li className="flex items-start gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2.5 shrink-0" />
                        Betalningsvillkor framgår vid beställning och på vår prissida.
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2.5 shrink-0" />
                        Prenumerationer förnyas automatiskt om de inte sägs upp innan nästa betalningsperiod.
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2.5 shrink-0" />
                        Vi förbehåller oss rätten att ändra priser med minst 30 dagars varsel.
                    </li>
                </ul>
            </section>

            {/* 4 */}
            <section>
                <h2 className="text-xl md:text-2xl font-bold text-white mb-4 tracking-tight">4. Användarens ansvar</h2>
                <p>
                    Du ansvarar för att:
                </p>
                <ul className="mt-3 space-y-2">
                    <li className="flex items-start gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2.5 shrink-0" />
                        Det material du laddar upp inte bryter mot lag eller tredje parts rättigheter.
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2.5 shrink-0" />
                        Granska och godkänna all bokföring som genereras av AI:n.
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2.5 shrink-0" />
                        Säkerställa att uppgifterna du matar in är korrekta och fullständiga.
                    </li>
                </ul>
                <div className="mt-4 rounded-xl bg-white/[0.03] border border-white/[0.06] p-5">
                    <p className="text-sm text-white/60">
                        <strong className="text-white/80">Viktigt:</strong> Scope AI tar inget ansvar för korrektheten i den bokföring som genereras. Det är alltid användarens ansvar att granska och godkänna bokföringen innan den lämnas in.
                    </p>
                </div>
            </section>

            {/* 5 */}
            <section>
                <h2 className="text-xl md:text-2xl font-bold text-white mb-4 tracking-tight">5. Immateriella rättigheter</h2>
                <p>
                    Allt innehåll, design, teknik och källkod som utgör tjänsten ägs av Scope AI eller dess licensgivare. Du beviljas en begränsad, icke-exklusiv och icke-överlåtbar rätt att använda tjänsten i enlighet med dessa villkor.
                </p>
                <p className="mt-3">
                    Data du laddar upp förblir din egendom. Vi gör inga anspråk på äganderätt till ditt material.
                </p>
            </section>

            {/* 6 */}
            <section>
                <h2 className="text-xl md:text-2xl font-bold text-white mb-4 tracking-tight">6. Ansvarsbegränsning</h2>
                <p>
                    Scope AI ansvarar inte för:
                </p>
                <ul className="mt-3 space-y-2">
                    <li className="flex items-start gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/30 mt-2.5 shrink-0" />
                        Indirekta skador, utebliven vinst eller dataförlust.
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/30 mt-2.5 shrink-0" />
                        Felaktig bokföring som uppstår på grund av bristfälligt underlag.
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/30 mt-2.5 shrink-0" />
                        Tillfälliga driftavbrott eller underhåll.
                    </li>
                </ul>
                <p className="mt-4">
                    Vår totala ersättningsskyldighet ska under alla omständigheter begränsas till det belopp som du har betalat för tjänsten under de senaste 12 månaderna.
                </p>
            </section>

            {/* 7 */}
            <section>
                <h2 className="text-xl md:text-2xl font-bold text-white mb-4 tracking-tight">7. Uppsägning</h2>
                <p>
                    Du kan när som helst säga upp ditt konto via inställningarna i appen eller genom att kontakta oss. Vid uppsägning:
                </p>
                <ol className="mt-3 space-y-2 list-decimal list-inside marker:text-white/50">
                    <li>Aktiv prenumeration löper ut vid periodens slut.</li>
                    <li>Du kan exportera din data innan kontot raderas.</li>
                    <li>Vi raderar dina personuppgifter i enlighet med vår integritetspolicy.</li>
                </ol>
            </section>

            {/* 8 */}
            <section>
                <h2 className="text-xl md:text-2xl font-bold text-white mb-4 tracking-tight">8. Ändringar av villkor</h2>
                <p>
                    Vi kan komma att uppdatera dessa villkor. Väsentliga ändringar meddelas via e-post eller i tjänsten med minst 30 dagars varsel. Fortsatt användning efter ändringarnas ikraftträdande innebär att du godkänner de nya villkoren.
                </p>
            </section>

            {/* 9 */}
            <section>
                <h2 className="text-xl md:text-2xl font-bold text-white mb-4 tracking-tight">9. Tillämplig lag</h2>
                <p>
                    Dessa villkor regleras av och tolkas i enlighet med svensk lag. Eventuella tvister ska i första hand lösas genom förhandling och i andra hand av svensk allmän domstol.
                </p>
            </section>

            {/* 10 */}
            <section>
                <h2 className="text-xl md:text-2xl font-bold text-white mb-4 tracking-tight">10. Kontakt</h2>
                <p>
                    Har du frågor om dessa villkor? Kontakta oss på{" "}
                    <a href="mailto:support@scopeai.se" className="text-blue-400 hover:text-blue-300 transition-colors border-b border-blue-400/30 hover:border-blue-300/50 pb-px">
                        support@scopeai.se
                    </a>
                </p>
            </section>
        </LegalPageLayout>
    )
}
