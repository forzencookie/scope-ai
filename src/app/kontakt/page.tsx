import { LegalPageLayout } from "@/components/landing/layout/legal-page-layout"

export default function ContactPage() {
    return (
        <LegalPageLayout title="Kontakta oss" brandLabel="scope ai">
            <p>
                Har du frågor, funderingar eller förslag? Vi på <strong className="text-white">scope ai</strong> hjälper dig gärna. Nedan hittar du de bästa sätten att nå oss.
            </p>

            {/* General contact */}
            <section>
                <h2 className="text-xl md:text-2xl font-bold text-white mb-4 tracking-tight">Allmänna frågor</h2>
                <p className="mb-4">
                    För generella frågor om vår tjänst, funktioner eller priser — skicka ett mejl till oss så återkommer vi inom 24 timmar.
                </p>
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-6">
                    <p className="text-sm text-white/50 mb-1">E-post</p>
                    <a href="mailto:info@scopeai.se" className="text-blue-400 hover:text-blue-300 transition-colors text-lg font-medium">
                        info@scopeai.se
                    </a>
                </div>
            </section>

            {/* Support */}
            <section>
                <h2 className="text-xl md:text-2xl font-bold text-white mb-4 tracking-tight">Support</h2>
                <p className="mb-4">
                    Behöver du hjälp med ditt konto, bokföring eller tekniska problem? Vårt supportteam finns tillgängligt för dig.
                </p>
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-6">
                    <p className="text-sm text-white/50 mb-1">Support e-post</p>
                    <a href="mailto:support@scopeai.se" className="text-blue-400 hover:text-blue-300 transition-colors text-lg font-medium">
                        support@scopeai.se
                    </a>
                </div>
                <p className="mt-4 text-white/50 text-sm">
                    Vi strävar efter att besvara alla supportärenden inom 24 timmar på vardagar.
                </p>
            </section>

            {/* Partnership */}
            <section>
                <h2 className="text-xl md:text-2xl font-bold text-white mb-4 tracking-tight">Samarbete &amp; partnerskap</h2>
                <p>
                    Är du intresserad av att samarbeta med oss, integrera ert system med vår plattform eller utforska partnerskapsmöjligheter? Vi hör gärna från dig.
                </p>
                <div className="mt-4 rounded-xl bg-white/[0.03] border border-white/[0.06] p-6">
                    <p className="text-sm text-white/50 mb-1">Partnerskap</p>
                    <a href="mailto:partner@scopeai.se" className="text-blue-400 hover:text-blue-300 transition-colors text-lg font-medium">
                        partner@scopeai.se
                    </a>
                </div>
            </section>

            {/* GDPR / Data */}
            <section>
                <h2 className="text-xl md:text-2xl font-bold text-white mb-4 tracking-tight">Dataskyddsförfrågningar</h2>
                <p>
                    Om du vill utöva dina rättigheter enligt GDPR — såsom rätten till radering, tillgång till dina data eller dataportabilitet — vänligen kontakta oss via:
                </p>
                <div className="mt-4 rounded-xl bg-white/[0.03] border border-white/[0.06] p-6">
                    <p className="text-sm text-white/50 mb-1">Dataskyddsombud</p>
                    <a href="mailto:dpo@scopeai.se" className="text-blue-400 hover:text-blue-300 transition-colors text-lg font-medium">
                        dpo@scopeai.se
                    </a>
                </div>
            </section>

            {/* Social */}
            <section>
                <h2 className="text-xl md:text-2xl font-bold text-white mb-4 tracking-tight">Sociala medier</h2>
                <p>
                    Följ oss på sociala medier för de senaste nyheterna, uppdateringarna och tips kring bokföring och AI.
                </p>
                <ul className="mt-4 space-y-3">
                    <li className="flex items-center gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                        <a href="#" className="text-white/70 hover:text-white transition-colors">Facebook</a>
                    </li>
                </ul>
            </section>

            {/* Company info */}
            <section>
                <h2 className="text-xl md:text-2xl font-bold text-white mb-4 tracking-tight">Företagsinformation</h2>
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-6 space-y-3">
                    <div>
                        <p className="text-sm text-white/50">Företagsnamn</p>
                        <p className="text-white font-medium">Scope AI</p>
                    </div>
                    <div className="h-px bg-white/[0.06]" />
                    <div>
                        <p className="text-sm text-white/50">Land</p>
                        <p className="text-white/80">Sverige</p>
                    </div>
                </div>
            </section>
        </LegalPageLayout>
    )
}
