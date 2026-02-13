# Scope AI - App Feature Specification

**Date:** 2026-02-05
**Last updated:** 2026-02-12

---

## MISSION

Scope AI exists to make professional-grade accounting accessible to everyone — from first-time business owners who have never touched a ledger to seasoned accounting firms managing hundreds of clients.

**The problem:** Starting a business is hard enough. Accounting is intimidating, the rules are complex, and hiring a human accountant in the early days — when money is scarce — feels like a catch-22. Meanwhile, experienced accountants and large firms drown in repetitive manual work that could be automated.

**Our solution:** An AI-first accounting platform where users speak in plain everyday language. A new business owner can say "I just started an AB, I have no idea how to do my accounting" and our agent responds with a step-by-step plan — what to input, in what order, and why. The agent has full access to every vital part of the accounting system: it can book transactions, generate invoices, run payroll, produce tax declarations, and assemble legally compliant documents ready for government submission.

**Who we serve:**
1. **New business owners** — People who don't know accounting and can't yet afford a human accountant. Scope AI bridges the gap: the agent walks them through everything step by step so they can handle their own books with confidence, legally and correctly.
2. **Professional accountants** — Solo practitioners who want a modern tool that handles the tedious parts so they can focus on advisory work and client relationships.
3. **Accounting firms** — Large firms managing many clients who want to expedite workflows by letting AI handle the bulk of routine bookkeeping, reconciliation, and reporting.

**Safety & liability:** The liability for a company's accounting always rests with the company owner or their appointed firm. Our safety model reflects this: the AI does the work, but humans review and approve before anything is submitted. Every AI-generated output — journal entries, tax forms, annual reports — goes through a human confirmation step. The AI is a tireless co-worker, not an autonomous decision-maker.

**Data integrity:** Accounting rules in Sweden are everchanging. The BAS kontoplan gets new account classes, tax rates shift, benefit rules update. All reference data — account plans, tax tables, municipality rates, benefit types — must live in maintainable data sources (database tables or authoritative config files), never hardcoded inline. When Skatteverket updates a rule, we update one table and the entire app reflects the change. No code modifications, no deployments for data changes.

**Output quality:** Everything this app produces must be sound enough to submit to Skatteverket, Bolagsverket, or any Swedish authority. If a user generates a momsdeklaration, it must be correct. If they produce an årsredovisning, it must comply with ÅRL. The app doesn't guess — it calculates from verified data and established rules.

---

## FOUNDERS COMMENTS

*Notes from the founder on the vision and future of Scope AI.*

### GENERAL ARCHITECTURE
*   **Performance:** We must strictly minimize unnecessary API calls and data fetches. Every request slows down the user experience. The architecture should be lean and efficient, fetching only what is needed, when it is needed.
*   **Dynamic Data Sources:** Tables that display structured reference data (e.g., BAS kontoplan, tax rates, benefit types) must not be hardcoded inline. They should pull from a central, maintainable data source (database table or authoritative config) so that when the source is updated, all dependent views and components reflect the change automatically. For example, the BAS kontoplan evolves over time with new account classes — the app must be prepared for these changes without code modifications.

### AI MODE
*   **Agent Capability:** The core philosophy is "Everything you can do manually, the AI can do for you." If a user can click a button to book a transaction, create an invoice, or update a setting, the AI agent must be able to trigger that same action via conversation. The agent uses a planning mode to break complex requests into steps, guiding users who may have zero accounting knowledge through the entire process in plain language.
*   **Exceptions:** The only exception to this rule is **Payments** (e.g., executing a bank transfer or buying tokens), which must always remain a manual, user-confirmed action for security reasons.
*   **Human Review:** All AI-generated outputs (journal entries, declarations, reports) must pass through a human confirmation step before finalization. The AI proposes, the human approves. This is non-negotiable — it protects the user and respects the legal reality that the business owner bears ultimate responsibility.
*   **Scope:** This applies to all features discussed: booking transactions, creating invoices, running payroll, generating reports, and updating the share register. The AI is a fully capable "co-pilot" for the entire app.

### BOKFÖRING (Bookkeeping)
*   **Transaktioner:** The transaction inbox must function like a professional accountant's tool. Stat cards should explicitly show 'Antal betalningar', 'Pengar in' (positive), 'Pengar ut' (negative), and 'Allt i ordning' (booked vs. unbooked status). The table needs simple search and filtering based on transaction state (badges). The upload flow should be simplified to 'Manual' and 'OCR' since AI handles the analysis regardless of source (Z-report, mass import, etc.). Manual entry must be robust, capturing all legally required data for a transaction. Keep API calls to a minimum to ensure page performance.
*   **Fakturor:** Kanban views and stat cards should reflect the invoice lifecycle accurately. For creation/import, ensure all elements for a legally sound invoice are present. For supplier invoices (leverantörsfakturor), vital info extraction is key. Improve the UI so that the invoice preview is available in the standard view, not just the expanded mode.
*   **Kvitton:** The upload feature needs two distinct modes: Manual and OCR (currently it seems to favor OCR). This provides flexibility for the user.
*   **Inventarier:** Fix the UI consistency: add a table title and separator like other pages. Move the 'Bokför avskrivning' (depreciation) button to this section for better workflow.
*   **Verifikationer:** The ledger view needs a proper header. Use a clean flat table layout — a collapsible BAS-account structure was considered but rejected because the sheer number of accounts makes it inconvenient. The table should have clear columns (Nr, Datum, Konto, Beskrivning, Belopp) with search and filtering capabilities.

### LÖNER (Payroll)
*   **Lönekontroll:** 'Antal anställda' must dynamically update from the Team page. When creating a new payroll run for a person not yet in the system, the dialog should prompt to add them as a team member. 'Total brutto' and 'Skatt att betala' should be derived from actual salary data, potentially feeding into the 'Inkomstdeklaration' later. The payroll wizard must capture every detail required to generate a legally compliant payslip for external payment processing.
*   **Förmåner:** Benefit options should not be hardcoded; they should be driven by a backend table for easy updates. Stat cards: 'Totalt' tracks total money spent on benefits, 'Täckning' shows the ratio of employees using benefits vs. total staff, and 'Outnyttjad' tracks remaining potential value.
*   **Team:** Explore two UI directions: either a tiered hierarchy (CEO, Managers, Employees) with section headers OR simple cards with previews to avoid a hierarchy feel. Each member profile should be a comprehensive dossier showing their full history of salary payments, active benefits, and reported expenses.
*   **Delägaruttag:** This page must provide all the necessary information and documentation so that the owner can execute the transaction in their external bank account without any issues. Since this is a corporate action, it must automatically communicate with 'Verifikationer' to ensure the ledger is updated correctly.
*   **Egenavgifter:** Similar to owner withdrawals, this section should house all necessary information and potentially generate government-related documents. The goal is to allow users to pay themselves outside the app with confidence, while ensuring every action is recorded in 'Verifikationer'.

### RAPPORTER (Reports)
*   **Resultaträkning:** Should simply display the results. It is fundamentally just 'simple math' summarizing the ledger.
*   **Balansräkning:** Like P&L, this is a display of the current balance based on the data. Keep it straightforward.
*   **Momsdeklaration:** Should potentially integrate with 'Månadsavslut'. Crucially, it needs to support both manual entry and an AI-driven workflow. Clicking the AI button should trigger a command where the agent acts as a conversational assistant, fetching relevant data from transactions, payroll, and other areas to populate the form.
*   **Inkomstdeklaration:** Follows the same principle as Momsdeklaration: Manual mode or AI-assisted mode where the agent fetches data from across the system.
*   **K10:** Same manual vs. AI-assisted pattern.
*   **Årsredovisning & Bokslut:** Same manual vs. AI-assisted pattern.

### ÄGARE & STYRNING (Governance)
*   **Aktiebok:** This is primarily a documentation page. It must allow for the recording and downloading of all legally required information regarding the company's shares.
*   **Möten & Protokoll:** This page acts as a legal paper trail. It’s documentation for real-world events so that when the government or authorities ask for paperwork, the user can easily provide the minutes and decisions of the meetings.
*   **Firmatecknare:** Purely a documentation page for now. Its purpose is to record who has the legal authority to sign for the company. No external API connections are needed; it’s all about having the right paperwork ready for when it's required.
*   **Utdelning:** A calculating documentation page. It should generate dividend receipts/vouchers and track a 'Pending' status. Once the actual payment is executed (outside the app), the user marks it as paid and it is then booked in the ledger.
*   **Delägare & Medlemmar:** Similar to the Team page, owners should be represented by cards that provide a quick overview of their details and ownership stake. Its primary purpose is documentation and generating the necessary information/paperwork required for corporate governance.

### HÄNDELSER (Events)
*   **Månadsavslut (Replaces Arkiv & Tidslinje):** This feature is moved from Bookkeeping to Events and replaces 'Arkiv' and 'Tidslinje'. The UI should change to a row-per-month layout. Expanding a month row reveals the events/timeline for that period, incorporating the filtering system from the old 'Tidslinje'. The year switcher should be centered with simple left/right arrows. This effectively becomes the central event tracker, removing the need for separate Archive or Timeline pages. URL must be updated to reflect this move.
*   **Kalender:** When clicking any day, a dialog should open showing exactly what unfolded on that specific date. It should also allow users to add personal comments to a day.
*   **Bolagsåtgärder:** [Comment...]
*   **Roadmap:** The UI/UX needs an overhaul. It should visually resemble a proper roadmap (linear progression), rather than a collection of cards.

### FÖRETAGSSTATISTIK (Statistics)
*   **Översikt:** Currently good as is.
*   **Kostnadsanalys:** Currently good as is.

### INSTÄLLNINGAR (Settings)
*   **Företag:** This data is primarily populated during Onboarding. It should house the company logo, which is distinct from the user's profile picture and must appear on all professional documents like invoices and payslips.
*   **E-post:** [Comment...]
*   **Språk & Region:** Settings must persist across sessions.
*   **User Profile & Billing:** A dedicated space for the user's personal profile and subscription management. Users should be able to upload a profile picture (which displays in the sidebar) or choose from a set of emojis if they don't have a photo. Billing should show subscription status and allow for downloading payment receipts.

### PAYMENTS & SUBSCRIPTION
*   **Subscription Management:** The 'Subscribe' button on the landing page must trigger a real payment flow (Stripe Sandbox initially). This should lead to a **custom checkout page** (not the generic Stripe hosted page) for better branding. Upon successful payment, the user is immediately redirected to the Onboarding flow. Onboarding is mandatory by default, though a deliberate 'Skip' option may be available.
*   **Usage & Billing:** Buying additional tokens in the Settings should also utilize the same custom checkout page, dynamically updated with the token items. After a successful transaction, the user should be redirected back to the app with their new token balance reflected immediately. Subscription history and receipts must be available for download.

### ONBOARDING
*   **Guided Setup:** Onboarding should be autonomous and comprehensive, following a phased approach:
    1.  **Company Setup:** Basic info (Name, Org-nr) and SIE file import.
    2.  **Profile & Preferences:** User profile setup (upload photo or choose emoji) and app settings (Dark/Light mode).
    3.  **Guided App Tour:** After onboarding completes and the user enters the dashboard for the first time, they are greeted with an interactive spotlight-based walkthrough. One component at a time is highlighted — sidebar sections, AI chat, reports, key actions — with tooltips explaining what each area does and how it helps. Only the highlighted element is clickable; everything else is dimmed. Think Linear/Notion/Figma first-login experience. This replaces the previously considered "AI Interview" concept because it gives users immediate spatial understanding of the app rather than a chat-based data dump. Build after core features are production-solid.

---

## THE AI PERSONALITY — "SCOOBY"

*From founder interview, 2026-02-12. These insights define the desired AI behavior beyond what the spec sections above capture.*

### Relationship, Not Autocomplete

> "I don't want a static dumb robot that only does what I tell it. I want a smart robot that when I tell it to bring me water, it asks 'would you like some ice with that?' And when finished, it thinks about other stuff that might benefit me."

The bar is set by the best AI companies (Google, OpenAI, Anthropic) — Scooby must feel almost human within the accounting domain. The differentiator vs competitors (Fortnox, Visma): they offer autocomplete inside forms. Scope AI offers a **thinking companion** with full control of the entire app, under the user's command.

### Beginner vs Professional — Same AI, Different Role

- **Beginner:** Scooby is a handholder, a safety net. Teaches while it works.
- **Professional:** Scooby is a force multiplier — "If a professional could handle 10 clients, leveraging this app lets them juggle 20."

### Scooby's Memory

Scooby should know the user the way Claude knows a developer through compacted conversation history:
- Compacts/summarizes conversations over time
- Per-company "memory" space
- Remembers patterns, preferences, overall history
- Examples: "You always book office supplies to 6110", "Your EF momsdeklarerar quarterly", "You prefer to do your bokföring on Mondays"

---

## THE PLANNING SYSTEM

Two distinct concepts:

1. **To-do list / "Min Plan"** — daily/weekly check-in list. Scooby generates it from onboarding data (company type, momsperiod, start date). Browsable text documents. Lives as a **subtab inside Händelser**.

2. **Roadmap** — larger milestones over weeks/months/years. More strategic. Already exists in Händelser.

The user's first request to Scooby might be:
> "Hej Scooby, jag vet att mitt EF ska momsdeklarera varje kvartal. Snälla gör en plan åt mig — instruktioner för varje dag, vecka och månad."

Plans include: legal obligations, practical actions, and business tips.

---

## FOUNDER'S FEARS — Development Priorities

Listed verbatim because they should directly inform priorities:

1. **AI Hallucination** — "AI might act as an API endpoint, a chat on top of my app, rather than an AI that's part of the app." → Scooby must be deeply integrated, never fabricate.
2. **Data Cascade** — "One minor issue has a cluster effect of ruin on other documentation." → Validation at the point of entry is critical.
3. **Legal Compliance** — "The paperwork might not be sufficient — government says it's missing stuff." → Every generated document must be legally complete.
4. **The Beautiful Shell Problem** — "I am scared the app is just a beautiful UI shell that doesn't actually work." → The gap between "looks right" and "works right" is the existential risk.
5. **Cost** — "I would need to hire a real engineering team and an accountant — money I do not have." → AI dev assistant must serve as both engineer and domain expert.
6. **System Symbiosis** — "Features not communicating with each other correctly." → The app needs to be a connected system, not independent pages.

---

## LAUNCH STRATEGY

- **Day-1 target:** Demo + Pro users at individual scale (1–3 companies)
- **Enterprise deferred:** "Contact us" — can't guarantee heavy usage until proven at smaller scale
- **Download-first for government:** SRU files and iXBRL for authorities, PDFs for personal use. Direct API submission when budget allows.
- **Demo tier:** Non-functional showcase with fake data. No free AI tokens.
- **Pro tier:** Full functionality, real Scooby, monthly AI token allocation. Manual mode always available when tokens run out.

---