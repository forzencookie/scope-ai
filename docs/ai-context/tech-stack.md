# Tech Stack & Architecture

## Core Stack
*   **Framework:** Next.js 14+ (App Router)
*   **Language:** TypeScript (Strict mode)
*   **Database:** Supabase (PostgreSQL)
*   **ORM/Query:** Typscript interfaces matching DB schema (No heavy ORM, direct Supabase client)
*   **Styling:** Tailwind CSS + Shadcn/UI
*   **State:** React Context + Hooks (minimal global state)
*   **AI:** OpenAI (GPT-4o) via Vercel AI SDK

## Key Architectural Decisions

### 1. "Server Actions" over "API Routes"
Prefer Server Actions for mutations (form submissions). Use API Routes (`/app/api/...`) primarily for external webhooks (Stripe/Resend) or AI streaming endpoints.

### 2. The "Smart Component, Dumb UI" Pattern
*   `components/ui/*`: Dumb, pure logic-less components (Buttons, Inputs).
*   `components/[feature]/*`: Smart components that hold state and call services.
*   `services/*`: Pure functions that talk to Supabase.

### 3. Database Strategy
*   **Row Level Security (RLS):** Enabled on ALL tables. Users can only see their own `company_id` data.
*   **Types:** Generated via `supabase gen types`. Do not manually type DB responses if possible.

### 4. AI Integration
*   The AI is not a chatbot; it is an **Overlay System**.
*   It generates structured JSON (Walkthroughs), not just text.
*   See `docs/walkthrough-designs.md` for the schema.
