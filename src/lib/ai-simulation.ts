/**
 * AI Simulation Service
 *
 * Provides realistic-looking AI responses for demo users without
 * making actual API calls. Used when subscription tier is "demo" or "free".
 */

// ============================================================================
// Types
// ============================================================================

export interface SimulatedResponse {
  content: string
  delay: number // Simulated "thinking" time in ms
}

// ============================================================================
// Simulated Chat Responses
// ============================================================================

const DEMO_CHAT_RESPONSES: Record<string, SimulatedResponse> = {
  // Accounting questions
  moms: {
    content: `**Moms (VAT) i Sverige**

I demo-läget kan jag ge generell information om moms:

📋 **Momssatser i Sverige:**
- **25%** - Standard (de flesta varor/tjänster)
- **12%** - Livsmedel, hotell, restaurang
- **6%** - Böcker, tidningar, kollektivtrafik
- **0%** - Export, vissa finansiella tjänster

📅 **Momsredovisning:**
- Momsdeklaration lämnas månadsvis, kvartalsvis eller årsvis
- Beroende på omsättning

💡 *Uppgradera till Pro för personliga beräkningar baserade på din bokföring!*`,
    delay: 1500,
  },
  faktura: {
    content: `**Skapa faktura**

I demo-läget visar jag hur det fungerar:

📝 **En faktura ska innehålla:**
- Ditt företagsnamn och org.nummer
- Kundens uppgifter
- Fakturanummer (löpande)
- Fakturadatum och förfallodatum
- Beskrivning av varor/tjänster
- Belopp exkl. och inkl. moms
- Momsbelopp och momssats

🔄 *I Pro-versionen skapar AI:n fakturor automatiskt åt dig!*`,
    delay: 1200,
  },
  bokföring: {
    content: `**Grundläggande bokföring**

Bokföring handlar om att registrera alla affärshändelser:

📚 **Grundprinciper:**
- Debet = vänster sida (tillgångar, kostnader)
- Kredit = höger sida (skulder, intäkter)
- Debet ska alltid vara lika med kredit

📊 **Vanliga konton:**
- 1930 - Företagskonto
- 2440 - Leverantörsskulder
- 3000 - Försäljning
- 4000 - Inköp

💡 *Uppgradera för att få automatisk kontering med AI!*`,
    delay: 1400,
  },
  skatt: {
    content: `**Företagsskatter i Sverige**

Här är en översikt:

💰 **Bolagsskatt:** 20,6% av vinsten

📋 **Arbetsgivaravgifter:** 31,42% på löner

🧾 **F-skatt:** Preliminär inkomstskatt för företagare

📅 **Viktiga datum:**
- Momsdeklaration: Olika beroende på period
- Årsredovisning: 7 månader efter räkenskapsårets slut
- Inkomstdeklaration: 1 juli (digitalt) eller 2 maj (papper)

*Uppgradera för skräddarsydda skatteberäkningar!*`,
    delay: 1300,
  },
}

// Default response for unmatched queries
const DEFAULT_RESPONSE: SimulatedResponse = {
  content: `👋 **Hej! Detta är demo-läget.**

Jag kan hjälpa dig förstå hur AI-assistenten fungerar. Prova att fråga om:

- **Moms** - Momssatser och redovisning
- **Faktura** - Hur man skapar fakturor
- **Bokföring** - Grundläggande bokföringsregler
- **Skatt** - Företagsskatter i Sverige

🚀 **I Pro-versionen kan AI:n:**
- Svara på alla dina bokföringsfrågor
- Analysera dina transaktioner
- Ge personliga rekommendationer
- Skapa dokument automatiskt

[Uppgradera till Pro →](/priser)`,
  delay: 800,
}

// ============================================================================
// Response Generator
// ============================================================================

/**
 * Get a simulated AI response based on the user's message
 */
export function getSimulatedChatResponse(message: string): SimulatedResponse {
  const lowerMessage = message.toLowerCase()

  // Check for keyword matches
  for (const [keyword, response] of Object.entries(DEMO_CHAT_RESPONSES)) {
    if (lowerMessage.includes(keyword)) {
      return response
    }
  }

  // Return default if no match
  return DEFAULT_RESPONSE
}

/**
 * Simulate streaming by yielding characters with delays
 */
export async function* simulateStreamingResponse(
  response: SimulatedResponse
): AsyncGenerator<string> {
  const { content, delay } = response

  // Initial "thinking" delay
  await sleep(delay)

  // Stream characters with varying speed
  const words = content.split(" ")
  for (let i = 0; i < words.length; i++) {
    yield words[i] + (i < words.length - 1 ? " " : "")
    // Vary the delay for natural feel
    await sleep(20 + Math.random() * 30)
  }
}

// ============================================================================
// Simulated AI Suggestions
// ============================================================================

export interface SimulatedSuggestion {
  id: string
  type: "categorization" | "reminder" | "optimization" | "error"
  title: string
  description: string
  action?: string
  actionUrl?: string
}

const DEMO_SUGGESTIONS: SimulatedSuggestion[] = [
  {
    id: "demo-1",
    type: "categorization",
    title: "Okategoriserad transaktion",
    description: "Det finns 3 transaktioner som behöver kategoriseras",
    action: "Visa transaktioner",
    actionUrl: "/dashboard/bokforing?tab=transaktioner",
  },
  {
    id: "demo-2",
    type: "reminder",
    title: "Momsdeklaration snart",
    description: "Glöm inte att lämna in momsdeklarationen före den 12:e",
    action: "Se rapport",
    actionUrl: "/dashboard/rapporter?tab=momsdeklaration",
  },
  {
    id: "demo-3",
    type: "optimization",
    title: "Spara på företagsskatten",
    description: "Du kan göra avsättningar till periodiseringsfond",
    action: "Läs mer",
    actionUrl: "/dashboard/rapporter",
  },
]

/**
 * Get demo AI suggestions
 */
export function getSimulatedSuggestions(): SimulatedSuggestion[] {
  return DEMO_SUGGESTIONS
}

// ============================================================================
// Simulated Government Submission
// ============================================================================

export interface SimulatedSubmissionResult {
  success: boolean
  referenceNumber: string
  message: string
  submittedAt: Date
}

/**
 * Simulate a government submission (Skatteverket/Bolagsverket)
 */
export async function simulateGovSubmission(
  type: "moms" | "arbetsgivardeklaration" | "arsredovisning"
): Promise<SimulatedSubmissionResult> {
  // Simulate processing time
  await sleep(2000 + Math.random() * 1000)

  const typeNames = {
    moms: "Momsdeklaration",
    arbetsgivardeklaration: "Arbetsgivardeklaration",
    arsredovisning: "Årsredovisning",
  }

  return {
    success: true,
    referenceNumber: `DEMO-${Date.now().toString(36).toUpperCase()}`,
    message: `⚠️ **Demo-läge**\n\nDetta är en simulerad inlämning av ${typeNames[type]}. I Pro-versionen skickas uppgifterna direkt till Skatteverket.`,
    submittedAt: new Date(),
  }
}

// ============================================================================
// Helpers
// ============================================================================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ============================================================================
// Demo Welcome Message
// ============================================================================

export const DEMO_WELCOME_MESSAGE = `🎉 **Välkommen till Scope AI Demo!**

Du utforskar nu vår bokföringsplattform med simulerade data och AI-funktioner.

**I demo-läget kan du:**
✅ Utforska hela gränssnittet
✅ Se hur AI-chatten fungerar
✅ Testa rapporter och analyser
✅ Exportera exempeldata

**För att låsa upp alla funktioner:**
🚀 Riktiga AI-svar och analyser
🏦 Bankintegration
📋 Direkt inlämning till Skatteverket
👥 Teamfunktioner

[Uppgradera till Pro →](/priser)

Fråga mig vad som helst för att se hur AI-assistenten fungerar!`
