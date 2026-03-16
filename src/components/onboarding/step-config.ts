import {
  Building2,
  FileText,
  Users,
  Landmark,
  UploadCloud,
  UserCircle,
} from "lucide-react"
import { ScopeAILogo } from "@/components/ui/icons/scope-ai-logo"
import type { OnboardingStep } from "./types"

// ============================================================================
// Onboarding Step Configuration
// Warm Swedish messaging with step-specific content
// ============================================================================

export const onboardingSteps: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Välkommen till scope ai",
    description: "Vi hjälper dig komma igång smidigt med din bokföring. Det tar bara några minuter — sen är du fri att fokusera på det du brinner för.",
    icon: ScopeAILogo,
    color: "text-stone-900",
    bgColor: "",
  },
  {
    id: "onboarding-mode",
    title: "Nystartat eller befintligt företag?",
    description: "Välj hur du vill komma igång. Befintliga företag kan importera bokföring via SIE-fil.",
    icon: Building2,
    color: "text-violet-600",
    bgColor: "bg-violet-500/10",
    hasOnboardingMode: true,
  },
  {
    id: "company-type",
    title: "Vilken företagsform har du?",
    description: "Vi anpassar funktioner, rapporter och deklarationer baserat på din företagsform.",
    icon: Landmark,
    color: "text-indigo-600",
    bgColor: "bg-indigo-500/10",
    hasCompanyTypeSelector: true,
  },
  {
    id: "company",
    title: "Ditt företag",
    description: "Vi hämtar uppgifterna direkt från Bolagsverket så du slipper skriva något själv.",
    icon: Building2,
    color: "text-violet-600",
    bgColor: "bg-violet-500/10",
    action: {
      label: "Hämta från Bolagsverket",
      href: "https://www.bolagsverket.se/foretag/hitta",
      external: true,
    },
    fields: [
      { label: "Organisationsnummer", placeholder: "XXXXXX-XXXX", value: "559123-4567" },
      { label: "Företagsnamn", placeholder: "AB Exempel", value: "Scope AI AB" },
    ],
  },
  {
    id: "share-structure",
    title: "Aktiekapital och aktier",
    description: "Ange ditt aktiekapital och antal aktier. Detta används för aktiebok och K10.",
    icon: Landmark,
    color: "text-emerald-600",
    bgColor: "bg-emerald-500/10",
    companyTypes: ["ab"],
    hasShareStructure: true,
  },
  {
    id: "shareholders",
    title: "Aktieägare",
    description: "Lägg till företagets aktieägare. Du kan alltid ändra detta senare i aktieboken.",
    icon: Users,
    color: "text-blue-600",
    bgColor: "bg-blue-500/10",
    companyTypes: ["ab"],
    hasShareholders: true,
  },
  {
    id: "partners",
    title: "Delägare",
    description: "Lägg till bolagets delägare och deras kapitalinsats.",
    icon: Users,
    color: "text-blue-600",
    bgColor: "bg-blue-500/10",
    companyTypes: ["hb", "kb"],
    hasPartners: true,
  },
  {
    id: "profile",
    title: "Din profil",
    description: "Välj en profilbild och hur du vill att appen ska se ut. Du kan ändra detta när som helst i inställningarna.",
    icon: UserCircle,
    color: "text-pink-600",
    bgColor: "bg-pink-500/10",
    optional: true,
  },
  {
    id: "import-history",
    title: "Importera historik",
    description: "Har du bokföring från ett annat system? Ladda upp en SIE-fil så importerar vi allt åt dig.",
    icon: UploadCloud,
    color: "text-blue-600",
    bgColor: "bg-blue-500/10",
    optional: true,
    existingOnly: true,
    hasSIEImport: true,
  },
  {
    id: "documents",
    title: "Ladda upp underlag",
    description: "Har du kvitton och fakturor? Släpp dem här så tar AI:n hand om resten.",
    icon: FileText,
    color: "text-amber-600",
    bgColor: "bg-amber-500/10",
    options: [
      { label: "Ladda upp filer", description: "Dra och släpp PDF, bilder eller Excel-filer" },
      { label: "Koppla e-post", description: "Automatiskt importera bifogade fakturor" },
      { label: "Jag gör det senare", description: "Ingen stress — du kan lägga till underlag när som helst" },
    ],
  },
  {
    id: "team",
    title: "Bjud in ditt team",
    description: "Samarbeta med kollegor eller ge din revisor läsåtkomst. Tillsammans blir det enklare!",
    icon: Users,
    color: "text-purple-600",
    bgColor: "bg-purple-500/10",
    optional: true,
    roles: [
      { role: "Admin", description: "Full åtkomst till allt" },
      { role: "Bokförare", description: "Kan hantera transaktioner" },
      { role: "Revisor", description: "Endast läsåtkomst" },
    ],
  },
]
