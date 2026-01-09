import {
  Navbar,
  Hero,
  Stats,
  FeaturePitch,
  CoreFeatures,
  GlobalReach,
  Pricing,
  FAQ,
  Contact,
  Footer,
  AnimatedDitherArt,
} from "@/components/landing"

import { ThemeProvider } from "@/providers/theme-provider"

export default function ScopeLandingPage() {
  return (
    <ThemeProvider attribute="class" forcedTheme="light" enableSystem={false}>
      <main className="light min-h-screen bg-white font-sans text-stone-900 selection:bg-stone-200 selection:text-stone-900 scroll-smooth relative overflow-x-hidden">
        {/* Animated Dither Art Decorations */}
        <AnimatedDitherArt />

        {/* Content */}
        <div className="relative z-10">
          {/* Navbar */}
          <Navbar />

          {/* Hero - Centered text above, demo below */}
          <Hero />

          {/* Stats Card - Time savings metric */}
          <Stats />

          {/* Feature Pitch + Company-Specific Features Checklist */}
          <FeaturePitch />

          {/* Bento Grid Feature Demos */}
          <CoreFeatures />

          {/* Vision - World map with feature highlights */}
          <GlobalReach />

          {/* Pricing */}
          <Pricing />

          {/* FAQ - Minimal 2-column */}
          <FAQ />

          {/* Contact Form */}
          <Contact />

          {/* Footer */}
          <Footer />
        </div>
      </main>
    </ThemeProvider>
  )
}
