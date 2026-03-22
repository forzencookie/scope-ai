# Workflow: Landing Page

> The public face of Scope AI. Converts visitors to subscribers.

## What It Is

The landing page is the first thing a visitor sees. It explains what Scope AI is, shows pricing, and drives subscription signups. All public routes use Swedish URLs.

## Public Pages

| Route | Purpose |
|-------|---------|
| `/` | Landing page — hero, features, pricing section, CTA |
| `/logga-in` | Login + signup (unified page, `?signup=true` for direct signup) |
| `/choose-plan` | Plan selection → Stripe checkout (dark theme) |
| `/om-oss` | About us |
| `/kontakt` | Contact |
| `/villkor` | Terms & conditions |
| `/integritetspolicy` | Privacy policy |
| `/cookies` | Cookie policy |

**Not separate pages (by design):**
- Pricing lives as a section on the landing page — no `/priser` route
- Features are shown on the landing page — no `/funktioner` route
- Forgot password is an inline flow on `/logga-in` — no `/forgot-password` route
- Registration is handled by `/logga-in?signup=true` — no `/register` route

## The Conversion Flow

```
Visitor lands on /
  → Sees hero: "AI-first Swedish accounting"
  → Scrolls features, sees pricing section
  → Clicks "Kom igång" or selects a plan
  → /logga-in (creates account or logs in)
  → /choose-plan (selects Pro/Max/Enterprise)
  → Custom Stripe checkout
  → Payment success → /onboarding
  → Onboarding complete → /dashboard
```

## Forgot Password Flow

Inline on `/logga-in` — no dedicated page:
1. User clicks "Glömt lösenord?" (visible after entering email)
2. Email input appears with send button
3. Supabase `resetPasswordForEmail` sends recovery link
4. Confirmation message shown inline
5. "Tillbaka till inloggning" returns to login form

## Demo Mode

The landing page may include a demo showcase showing the app with fake data. This demonstrates the UI and Scooby's personality without giving access to real AI functionality. No free tokens in demo mode.

## What Connects Here

- Plan selection triggers the payment integration flow
- After payment → onboarding flow
- After onboarding → dashboard with Scooby
