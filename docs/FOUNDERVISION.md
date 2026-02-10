# Scope AI - App Feature Specification

**Date:** 2026-02-05
**Philosophy:** This app is ment to be the second generation of accounting software. By leveraging the power of ai the workflow is effectively speediated. The user is in control. The AI is a sidebar assistant available for tasks, advice, and automation *when requested*, The idea is that everything the user can do manually or has to do manually can be done by the ai if prompted to do so. 

---

## FOUNDERS COMMENTS

*Notes from the founder on the vision and future of Scope AI.*

### GENERAL ARCHITECTURE
*   **Performance:** We must strictly minimize unnecessary API calls and data fetches. Every request slows down the user experience. The architecture should be lean and efficient, fetching only what is needed, when it is needed.
*   **Dynamic Data Sources:** Tables that display structured reference data (e.g., BAS kontoplan, tax rates, benefit types) must not be hardcoded inline. They should pull from a central, maintainable data source (database table or authoritative config) so that when the source is updated, all dependent views and components reflect the change automatically. For example, the BAS kontoplan evolves over time with new account classes — the app must be prepared for these changes without code modifications.

### AI MODE
*   **Agent Capability:** The core philosophy is "Everything you can do manually, the AI can do for you." If a user can click a button to book a transaction, create an invoice, or update a setting, the AI agent must be able to trigger that same action via conversation.
*   **Exceptions:** The only exception to this rule is **Payments** (e.g., executing a bank transfer or buying tokens), which must always remain a manual, user-confirmed action for security reasons.
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
    3.  **AI Interview:** A final 'Chat with AI' phase where the agent interviews the user to gather extra context or data for a 'head start'. The AI then pre-populates the database so the app is fully ready when the user enters the dashboard.

---
please also fix the unesarry api calls and data featches that may ruin the quality of the code and the speed of the app. 