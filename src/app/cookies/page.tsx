import { LegalPageLayout } from "@/components/landing/layout/legal-page-layout"

export default function CookiePolicyPage() {
    return (
        <LegalPageLayout title="Cookiepolicy" effectiveDate="20 Februari 2026">
            <p>
                Denna cookiepolicy beskriver hur <strong className="text-white">scope ai</strong> använder cookies och liknande tekniker på vår webbplats och i våra tjänster.
            </p>

            <section>
                <h2 className="text-xl md:text-2xl font-bold text-white mb-4 tracking-tight">1. Vad är cookies?</h2>
                <p>
                    Cookies är små textfiler som lagras på din enhet (dator, surfplatta eller mobiltelefon) när du besöker en webbplats. De används för att webbplatsen ska kunna känna igen din enhet och komma ihåg dina inställningar och preferenser.
                </p>
            </section>

            <section>
                <h2 className="text-xl md:text-2xl font-bold text-white mb-4 tracking-tight">2. Vilka cookies vi använder</h2>
                <p className="mb-4">Vi använder följande typer av cookies:</p>

                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold text-white/90 mb-2">2.1 Nödvändiga cookies</h3>
                        <p>
                            Dessa cookies krävs för att webbplatsen ska fungera korrekt. De möjliggör grundläggande funktioner som sidnavigering, inloggning och åtkomst till säkra områden. Webbplatsen kan inte fungera korrekt utan dessa cookies.
                        </p>
                        <ul className="mt-3 space-y-2">
                            <li className="flex items-start gap-3">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2.5 shrink-0" />
                                <span><strong className="text-white/90">Sessionscookies</strong> — för att hålla dig inloggad under ditt besök.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2.5 shrink-0" />
                                <span><strong className="text-white/90">Autentiseringscookies</strong> — för att verifiera din identitet vid inloggning.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2.5 shrink-0" />
                                <span><strong className="text-white/90">Säkerhetscookies</strong> — för att skydda mot obehöriga åtgärder.</span>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-white/90 mb-2">2.2 Funktionscookies</h3>
                        <p>
                            Dessa cookies ger förbättrad funktionalitet och personlig anpassning. De kan sättas av oss eller av tredjepartsleverantörer vars tjänster vi har integrerat på våra sidor.
                        </p>
                        <ul className="mt-3 space-y-2">
                            <li className="flex items-start gap-3">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2.5 shrink-0" />
                                <span><strong className="text-white/90">Språkinställningar</strong> — för att komma ihåg ditt föredragna språk.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2.5 shrink-0" />
                                <span><strong className="text-white/90">Användargränssnitt</strong> — för att minnas inställningar som kollapsbara menyer och filter.</span>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-white/90 mb-2">2.3 Analyscookies</h3>
                        <p>
                            Vi använder analyscookies för att förstå hur besökare interagerar med vår webbplats. All information samlas in på ett aggregerat och anonymiserat sätt.
                        </p>
                    </div>
                </div>
            </section>

            <section>
                <h2 className="text-xl md:text-2xl font-bold text-white mb-4 tracking-tight">3. Tredjepartscookies</h2>
                <p>
                    Vissa funktioner på vår webbplats kan komma att sätta cookies från tredje part, till exempel för autentiseringstjänster (Supabase), hosting eller betalningslösningar. Dessa tredjepartscookies regleras av respektive tredje parts integritetspolicy.
                </p>
            </section>

            <section>
                <h2 className="text-xl md:text-2xl font-bold text-white mb-4 tracking-tight">4. Hantera cookies</h2>
                <p className="mb-4">
                    Du kan själv styra och hantera cookies genom din webbläsares inställningar. Du kan välja att:
                </p>
                <ol className="space-y-2 list-decimal list-inside marker:text-white/50">
                    <li>Blockera alla cookies.</li>
                    <li>Ta bort befintliga cookies.</li>
                    <li>Tillåta cookies från specifika webbplatser.</li>
                    <li>Ställa in din webbläsare att meddela dig varje gång en cookie sätts.</li>
                </ol>
                <p className="mt-4 text-white/50 text-sm">
                    Observera att blockering av nödvändiga cookies kan påverka webbplatsens funktionalitet.
                </p>
            </section>

            <section>
                <h2 className="text-xl md:text-2xl font-bold text-white mb-4 tracking-tight">5. Ändringar i denna policy</h2>
                <p>
                    Vi kan komma att uppdatera denna cookiepolicy från tid till annan. Väsentliga ändringar meddelas på vår webbplats eller via e-post om du har ett registrerat konto.
                </p>
            </section>

            <section>
                <h2 className="text-xl md:text-2xl font-bold text-white mb-4 tracking-tight">6. Kontakt</h2>
                <p>
                    Har du frågor om vår användning av cookies? Kontakta oss på{" "}
                    <a href="mailto:support@scopeai.se" className="text-blue-400 hover:text-blue-300 transition-colors border-b border-blue-400/30 hover:border-blue-300/50 pb-px">
                        support@scopeai.se
                    </a>
                </p>
            </section>
        </LegalPageLayout>
    )
}
