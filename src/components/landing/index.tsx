// Landing page components - individual exports

// UI primitives
export { Section, StatusBadge, DitherPattern, GridBackground, SocialProof } from "./ui"
export type { BadgeStatus } from "./ui"

// Components
export { Navbar } from "./navbar"
export { Hero } from "./hero"
export { SocialProof as SocialProofSection } from "./ui" // Verify if SocialProof was used from UI or if it needs a separate file. It was in ui.tsx.
export { BentoGrid } from "./bento-grid"
export { IntegrationMesh } from "./integration-mesh"
export { Analytics } from "./analytics"
export { Testimonials } from "./testimonials"
export { Pricing } from "./pricing"
export { Footer } from "./footer"
