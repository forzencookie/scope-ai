import { LegalPageLayout } from "@/components/landing/layout/legal-page-layout"

export default function PrivacyPolicyPage() {
    return (
        <LegalPageLayout title="Integritetspolicy" effectiveDate="20 Februari 2026">
            <p>
                Välkommen till integritetspolicyn för <strong className="text-white">scope ai</strong>. Vi värdesätter och respekterar din integritet. Denna policy beskriver hur vi samlar in, använder och skyddar dina personuppgifter när du använder vår webbplats, tjänster och AI-drivna bokföringsplattform.
            </p>

            <p>
                Observera att våra tjänster inte är avsedda för personer under 18 år och vi samlar inte medvetet in data om minderåriga.
            </p>

            {/* Section 1 */}
            <section>
                <h2 className="text-xl md:text-2xl font-bold text-white mb-4 tracking-tight">1. Information vi samlar in</h2>
                <p className="mb-4">Vi samlar in information som du aktivt delar med oss för att leverera en träffsäker bokföringstjänst:</p>

                <div className="space-y-4">
                    <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5">
                        <h4 className="font-semibold text-white mb-1">Användardata</h4>
                        <p className="text-sm text-white/60">Namn, e-postadress, telefonnummer och inloggningsuppgifter för att hantera ditt konto.</p>
                    </div>
                    <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5">
                        <h4 className="font-semibold text-white mb-1">Företagsdata</h4>
                        <p className="text-sm text-white/60">Organisationsnummer, företagsnamn och adressuppgifter för fakturering och bokföring.</p>
                    </div>
                    <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5">
                        <h4 className="font-semibold text-white mb-1">Finansiell data</h4>
                        <p className="text-sm text-white/60">Kvitton, leverantörsfakturor, kontoutdrag och Z-rapporter som du laddar upp för tolkning.</p>
                    </div>
                    <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5">
                        <h4 className="font-semibold text-white mb-1">Användningsdata</h4>
                        <p className="text-sm text-white/60">Loggar över hur du interagerar med plattformen för att förbättra UX och säkerhet.</p>
                    </div>
                </div>
            </section>

            {/* Section 2 */}
            <section>
                <h2 className="text-xl md:text-2xl font-bold text-white mb-4 tracking-tight">2. Hur vi använder datan</h2>
                <p className="mb-4">
                    Datat används primärt för att leverera kärntjänsten: automatiserad bokföring. Vi tränar inte publika AI-modeller på din specifika data utan ditt medgivande.
                </p>
                <ul className="space-y-2">
                    <li className="flex items-start gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2.5 shrink-0" />
                        För att extrahera och kategorisera data från dina uppladdade dokument med AI.
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2.5 shrink-0" />
                        För att generera verifikationsförslag och rapporter.
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2.5 shrink-0" />
                        För att säkerställa driftsäkerhet, upptäcka fel och förhindra missbruk.
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2.5 shrink-0" />
                        För att kommunicera viktiga uppdateringar om tjänsten.
                    </li>
                </ul>
            </section>

            {/* Section 3 */}
            <section>
                <h2 className="text-xl md:text-2xl font-bold text-white mb-4 tracking-tight">3. Delning av information</h2>
                <p className="mb-4">
                    Din data är din tillgång. Vi säljer <strong className="text-white">aldrig</strong> personuppgifter till annonsörer eller tredje part. Delning sker endast när det är strikt nödvändigt för tjänstens funktion.
                </p>
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5">
                    <p className="text-sm text-white/60">
                        <strong className="text-white/80">Tjänsteleverantörer:</strong> Vi använder betrodda underbiträden för hosting, betalningslösningar och mailutskick. Alla dessa binds av strikta databehandlingsavtal (DPA).
                    </p>
                </div>
            </section>

            {/* Section 4 */}
            <section>
                <h2 className="text-xl md:text-2xl font-bold text-white mb-4 tracking-tight">4. Säkerhet &amp; lagring</h2>
                <p className="mb-4">
                    Säkerhet är inbyggt i vår plattform från grunden.
                </p>
                <ul className="space-y-2">
                    <li className="flex items-center gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                        All data krypteras i vila och vid överföring.
                    </li>
                    <li className="flex items-center gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                        Regelbundna säkerhetskopior (backups).
                    </li>
                    <li className="flex items-center gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                        Strikta åtkomstkontroller för personal.
                    </li>
                    <li className="flex items-center gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                        Servrar placerade inom EU/EES.
                    </li>
                </ul>
            </section>

            {/* Section 5 */}
            <section>
                <h2 className="text-xl md:text-2xl font-bold text-white mb-4 tracking-tight">5. Dina rättigheter (GDPR)</h2>
                <p className="mb-4">Du har full kontroll över din data enligt Dataskyddsförordningen:</p>
                <div className="space-y-3">
                    {[
                        { label: "Rätten till tillgång", desc: "Begär utdrag av all data vi har om dig." },
                        { label: "Rätten till radering", desc: "Begär att vi raderar all din personliga data ('Rätten att bli bortglömd')." },
                        { label: "Rätten till rättelse", desc: "Korrigera felaktig information." },
                        { label: "Dataportabilitet", desc: "Få ut din data i ett maskinläsbart format." },
                    ].map((right) => (
                        <div key={right.label} className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02]">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0" />
                            <div>
                                <strong className="text-white/90 text-sm">{right.label}</strong>
                                <p className="text-sm text-white/50 mt-0.5">{right.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Section 6 */}
            <section>
                <h2 className="text-xl md:text-2xl font-bold text-white mb-4 tracking-tight">6. Kontakt</h2>
                <p>
                    Om du har frågor om hur vi hanterar din data eller vill utöva dina rättigheter, kontakta oss på{" "}
                    <a href="mailto:support@scopeai.se" className="text-blue-400 hover:text-blue-300 transition-colors border-b border-blue-400/30 hover:border-blue-300/50 pb-px">
                        support@scopeai.se
                    </a>
                </p>
            </section>
        </LegalPageLayout>
    )
}
