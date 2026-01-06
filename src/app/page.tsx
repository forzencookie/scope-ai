import {
  Navbar,
  Hero,
  SocialProof,
  BentoGrid,
  IntegrationMesh,
  Analytics,
  Testimonials,
  Pricing,
  Footer,
} from "@/components/landing"

export default function ScopeLandingPage() {
  return (
    <main className="min-h-screen bg-white font-sans text-stone-900 selection:bg-stone-200 selection:text-stone-900 scroll-smooth relative">
      {/* Global dither pattern backgrounds */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Full screen subtle dither pattern */}
        <div className="absolute inset-0 opacity-[0.03] bg-dither-pattern" />

        {/* Optional: subtle vignette to fade edges slightly if needed, or keep it uniform */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/50 via-transparent to-white/80" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Navbar */}
        <Navbar />

        {/* Hero - isolated card */}
        <Hero />

        {/* Social proof */}
        <SocialProof />

        {/* Features - isolated cards */}
        <BentoGrid />

        {/* Integrations */}
        <IntegrationMesh />

        {/* Analytics */}
        <Analytics />

        {/* Testimonials */}
        <Testimonials />

        {/* Pricing */}
        <Pricing />

        {/* Footer */}
        <Footer />
      </div>
    </main>
  )
}
