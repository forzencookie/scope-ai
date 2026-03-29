# Workflow: Settings

> App configuration rendered as an overlay in the main content area. Not a dialog.

## What It Is

Settings is where users manage their company info, personal profile, language preferences, and subscription billing. It renders as an overlay — same pattern as walkthrough and page overlays. Click the settings button → overlay takes over the main content area. Sidebar stays visible.

## Architecture

Settings overlay is a **pure router** — it holds zero form state. Each tab is self-contained: owns its data, owns its save logic. This is enforced because user profile and company data are separate domains with separate DB tables and separate API endpoints.

| Domain | DB Table | API | Save Path |
|--------|----------|-----|-----------|
| User profile (name, email, avatar) | `profiles` | `/api/user/profile` | Direct fetch/PATCH |
| Company info (name, type, org nr) | `companies` | `CompanyProvider.saveChanges()` → server action | Zod-validated server action |

## Sections

### Konto (User Profile)
- Name (editable), email (read-only — tied to auth account)
- Profile picture (upload photo)
- Self-contained: fetches from `/api/user/profile`, saves via PATCH to same endpoint
- No connection to company data whatsoever

### Företagsinformation (Company)
- Company name, org-nr, address, bankgiro, plusgiro
- Company logo (distinct from user profile picture — appears on invoices, payslips, formal documents)
- Company type (AB, EF, HB, etc.) via CompanyTypeSelector
- Fiscal year, accounting method, VAT frequency
- Tax flags (F-skatt, moms, fåmansföretag, anställda)
- Share structure (AB only: aktiekapital, antal aktier)
- Self-contained: reads from CompanyProvider, saves via `saveChanges()` → `CompanySettingsSchema` → Supabase
- Populated primarily during onboarding, editable here

### Integrationer
- All integrations show as "Kommer snart" for MVP
- BankID, Skatteverket, Bolagsverket, Bankkonto, Bankgirot, Swish

### Fakturering (Billing)
- Current subscription tier (Pro, Max, Enterprise)
- AI usage bar (percentage-based)
- Buy extra credits (token packages)
- Payment method management (Stripe portal)
- Billing history with invoices/receipts
- Admin users see simplified view (no billing)

### Utseende (Appearance)
- Theme toggle (light/dark/system)

### Säkerhet & sekretess (Security)
- Password management, session info

## Interaction Pattern

```
User clicks settings button (sidebar or nav)
  → Main content area transitions to settings overlay
  → Tab-based navigation between sections
  → Each tab fetches its own data and shows its own loading state
  → Each tab has its own save button and shows its own toast feedback
  → "Tillbaka" returns to previous view
```

Settings is an exception to the "no forms" rule — this is user configuration, not accounting data. Forms are appropriate here.

## What Connects Here

- Onboarding populates the Företagsinformation section initially
- Company logo feeds into invoice generator, payslip generator, formal documents
- Momsperiod setting affects deadline calculations and reporting tools
- Billing connects to Stripe payment integration
- Profile picture displays in sidebar
- If user skips onboarding, companyType defaults to `ef` (simplest entity type)
