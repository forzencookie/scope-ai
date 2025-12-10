import {
  GridBackground,
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
    <main className="min-h-screen relative font-sans text-stone-900 selection:bg-stone-200 selection:text-stone-900 scroll-smooth">
      {/* Static backgrounds - server rendered */}
      <GridBackground />
      
      {/* Interactive components - client boundaries */}
      <Navbar />
      <Hero />
      <SocialProof />
      
      {/* Static content - server rendered */}
      <BentoGrid />
      
      {/* Interactive components - client boundaries */}
      <IntegrationMesh />
      <Analytics />
      <Testimonials />
      <Pricing />
      
      {/* Static footer - server rendered */}
      <Footer />
    </main>
  )
}
