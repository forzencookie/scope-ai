# Workflow: Settings

> App configuration rendered as an overlay in the main content area. Not a dialog.

## What It Is

Settings is where users manage their company info, personal profile, language preferences, and subscription billing. It renders as an overlay — same pattern as walkthrough and page overlays. Click the settings button → overlay takes over the main content area. Sidebar stays visible.

## Sections

### Företag (Company)
- Company name, org-nr, address
- Company logo (distinct from user profile picture — appears on invoices, payslips, formal documents)
- Company type (AB, EF, HB, etc.)
- Fiscal year settings
- Momsperiod (monthly, quarterly, annually)
- Populated primarily during onboarding, editable here

### Profil (User Profile)
- Name, email
- Profile picture (upload photo or choose emoji)
- Profile picture appears in the sidebar
- Personal preferences

### Språk & Region
- Language setting (Swedish default)
- Date/time format
- Must persist across sessions

### Billing (Subscription & Usage)
- Current subscription tier (Pro, Max, Enterprise)
- Token balance and usage
- "Köp tokens" button → triggers Stripe checkout (custom checkout page, not generic Stripe hosted page)
- Subscription history and downloadable receipts
- Subscription management (upgrade/downgrade/cancel)

## Interaction Pattern

```
User clicks settings button (sidebar or nav)
  → Main content area transitions to settings overlay
  → Tab-based navigation between sections
  → Edit fields directly (settings is one of the few places with forms)
  → Changes save immediately or on explicit save
  → "Tillbaka" returns to previous view
```

Settings is an exception to the "no forms" rule — this is user configuration, not accounting data. Forms are appropriate here.

## What Connects Here

- Onboarding populates the Företag section initially
- Company logo feeds into invoice generator, payslip generator, formal documents
- Momsperiod setting affects deadline calculations and reporting tools
- Billing connects to Stripe payment integration
- Profile picture displays in sidebar
