# Workflow: Onboarding

> Guided setup after first subscription payment. Mandatory before entering the app.

## What It Is

Onboarding collects the minimum information needed to set up the user's company and preferences. It runs once after the first successful Stripe payment. The user cannot skip to the dashboard — onboarding must complete first.

## Steps

### Step 1: Company Setup
- Company name
- Organisationsnummer (org-nr)
- Company type (AB, EF, HB, etc.)
- SIE file import (optional — imports existing accounting data)

### Step 2: Profile & Preferences
- User profile setup
- Upload profile photo or choose emoji
- App preferences (dark/light mode)

## After Onboarding

User lands on the dashboard. Scooby greets them with context based on what was set up:
- If SIE was imported: "Jag har importerat dina data. Du har X transaktioner att gå igenom."
- If no SIE: "Välkommen! Berätta om ditt företag så hjälper jag dig komma igång."

## Design Principles

- Keep it short — two steps, not five
- Only collect what's legally required (company info) and what improves UX (profile)
- SIE import is the most valuable step — it brings in existing accounting data
- No feature tours, no interactive walkthroughs — Scooby handles orientation through conversation

## What Connects Here

- Stripe payment success redirects to onboarding
- Company data populates Settings → Företag
- Profile data populates Settings → Profil
- SIE import feeds into the bookkeeping engine and transaction data
- After completion → dashboard with Scooby greeting
