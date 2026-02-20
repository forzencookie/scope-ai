import { LegalPageLayout } from "@/components/landing/layout/legal-page-layout"

export default function InformationPage() {
    return (
        <LegalPageLayout title="Om scope ai" brandLabel="scope ai">
            <p>
                <strong className="text-white">scope ai</strong> är en AI-driven bokföringsplattform byggd för framtidens företagare. Vi automatiserar det administrativa arbetet så att du kan fokusera på det du gör bäst — att driva och utveckla ditt företag.
            </p>

            {/* Mission */}
            <section>
                <h2 className="text-xl md:text-2xl font-bold text-white mb-4 tracking-tight">Vårt uppdrag</h2>
                <p>
                    Vi har som mål att förenkla företagande genom en autonom AI-plattform som underlättar och planerar din bokföring. Bokföring har länge varit synonymt med manuellt arbete, pappershögar och repetitiva uppgifter. Vi vill ändra på det.
                </p>
                <p className="mt-4">
                    Vår vision är att skapa en global standard för automatiserad bokföring där varje idé får chansen att växa utan administrativa hinder.
                </p>
            </section>

            {/* What we do */}
            <section>
                <h2 className="text-xl md:text-2xl font-bold text-white mb-4 tracking-tight">Vad vi gör</h2>
                <p className="mb-4">
                    Scope AI kombinerar avancerad artificiell intelligens med modern redovisningspraxis för att erbjuda en helhetslösning:
                </p>

                <div className="space-y-4">
                    <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5">
                        <h4 className="font-semibold text-white mb-1">🧠 AI-assistans</h4>
                        <p className="text-sm text-white/60">En intelligent assistent som hjälper dig med bokföring, kontering och rapportering — dygnet runt. Ställ frågor, få svar, och låt AI:n göra det tunga jobbet.</p>
                    </div>

                    <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5">
                        <h4 className="font-semibold text-white mb-1">📄 Automatisk kvittohantering</h4>
                        <p className="text-sm text-white/60">Ladda upp kvitton så tolkar, kategoriserar och bokför vår AI dem automatiskt. Ingen mer manuell inmatning.</p>
                    </div>

                    <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5">
                        <h4 className="font-semibold text-white mb-1">📊 Rapportering</h4>
                        <p className="text-sm text-white/60">Resultaträkning, balansräkning, momsrapporter och mer — genereras automatiskt utifrån din bokföringsdata.</p>
                    </div>

                    <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5">
                        <h4 className="font-semibold text-white mb-1">🏢 Bolagsstiftelse</h4>
                        <p className="text-sm text-white/60">Starta ditt bolag direkt via plattformen. Vi guidar dig genom processen och hjälper dig med allt från aktiebok till registrering.</p>
                    </div>

                    <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5">
                        <h4 className="font-semibold text-white mb-1">💰 Lönehantering</h4>
                        <p className="text-sm text-white/60">Hantera löner, arbetsgivaravgifter och skatteavdrag för dig och dina anställda — allt integrerat i bokföringen.</p>
                    </div>
                </div>
            </section>

            {/* For who */}
            <section>
                <h2 className="text-xl md:text-2xl font-bold text-white mb-4 tracking-tight">Vem är det för?</h2>
                <p className="mb-4">
                    Scope AI är designat för:
                </p>
                <ul className="space-y-2">
                    <li className="flex items-start gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2.5 shrink-0" />
                        <span><strong className="text-white/90">Soloföretagare</strong> som vill undvika dyra byråer och göra bokföringen själva — snabbt och korrekt.</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2.5 shrink-0" />
                        <span><strong className="text-white/90">Startups</strong> som behöver en skalbar bokföringslösning som växer med dem.</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2.5 shrink-0" />
                        <span><strong className="text-white/90">Småföretag</strong> som vill minska administrativ tid och fokusera på verksamheten.</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2.5 shrink-0" />
                        <span><strong className="text-white/90">Nystartade företag</strong> som behöver guidas genom bolagsbildning och första bokföringen.</span>
                    </li>
                </ul>
            </section>

            {/* Tech */}
            <section>
                <h2 className="text-xl md:text-2xl font-bold text-white mb-4 tracking-tight">Teknologin bakom</h2>
                <p>
                    Vi använder de senaste framstegen inom maskininlärning och NLP (Natural Language Processing) för att ge dig en plattform som inte bara följer reglerna — utan förstår dem.
                </p>
                <ul className="mt-4 space-y-2">
                    <li className="flex items-center gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                        Avancerad OCR för kvittoigenkänning.
                    </li>
                    <li className="flex items-center gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                        LLM-baserad kontering och kategorisering.
                    </li>
                    <li className="flex items-center gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                        Regelmotor för svensk skattelagstiftning (BAS-konto, moms, SRU-koder).
                    </li>
                    <li className="flex items-center gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                        End-to-end kryptering och GDPR-kompatibel datahantering.
                    </li>
                </ul>
            </section>

            {/* Status */}
            <section>
                <h2 className="text-xl md:text-2xl font-bold text-white mb-4 tracking-tight">Beta-status</h2>
                <p>
                    Scope AI befinner sig för närvarande i beta. Det innebär att vi aktivt utvecklar och förbättrar plattformen. Vi välkomnar all feedback — den hjälper oss att bygga den bästa möjliga produkten.
                </p>
                <p className="mt-4">
                    Under beta-perioden är den grundläggande tjänsten kostnadsfri att använda.
                </p>
            </section>

            {/* Contact */}
            <section>
                <h2 className="text-xl md:text-2xl font-bold text-white mb-4 tracking-tight">Kontakt</h2>
                <p>
                    Vill du veta mer, samarbeta med oss eller bara säga hej? Hör av dig via{" "}
                    <a href="mailto:info@scopeai.se" className="text-blue-400 hover:text-blue-300 transition-colors border-b border-blue-400/30 hover:border-blue-300/50 pb-px">
                        info@scopeai.se
                    </a>
                </p>
            </section>
        </LegalPageLayout>
    )
}
