# Workflow: Landing Page

> The public face of Scope AI. Converts visitors to subscribers.

## What It Is

The landing page is the first thing a visitor sees. It explains what Scope AI is, shows pricing, and drives subscription signups.

## Public Pages

| Route | Purpose |
|-------|---------|
| `/` | Landing page — hero, features, CTA |
| `/login` | Login |
| `/register` | Registration |
| `/forgot-password` | Password recovery |
| `/priser` | Pricing plans (Pro, Max, Enterprise) |
| `/funktioner` | Feature overview |
| `/om-oss` | About us |
| `/kontakt` | Contact |
| `/villkor` | Terms & conditions |
| `/integritetspolicy` | Privacy policy |
| `/choose-plan` | Plan selection → Stripe checkout |

## The Conversion Flow

```
Visitor lands on /
  → Sees hero: "AI-first Swedish accounting"
  → Scrolls features, sees demo
  → Clicks "Subscribe" or navigates to /priser
  → Selects a plan → /choose-plan
  → Custom Stripe checkout
  → Payment success → /onboarding
  → Onboarding complete → /dashboard
```

## Demo Mode

The landing page may include a demo showcase showing the app with fake data. This demonstrates the UI and Scooby's personality without giving access to real AI functionality. No free tokens in demo mode.

## What Connects Here

- Subscribe button triggers the payment integration flow
- After payment → onboarding flow
- After onboarding → dashboard with Scooby
