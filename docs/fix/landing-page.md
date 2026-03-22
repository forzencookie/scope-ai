# Fix: Landing Page

> **Flow:** [`docs/flows/landing-page.md`](../flows/landing-page.md)
> **Thinking:** 🟢 Medium
> **Status:** ✅ Green — code fixes done, remaining items need founder input

## Vision vs Reality

The flow describes: public-facing pages that convert visitors to subscribers.

## Completed

- ✅ **Choose-plan dark theme** — `/choose-plan` rewritten with `#050505` background, glass-morphism cards (`bg-white/10 backdrop-blur-sm`), consistent with app dark theme
- ✅ **Inline forgot password** — No dedicated `/forgot-password` page. Inline flow on `/logga-in`: email input → Supabase `resetPasswordForEmail` → confirmation message → back to login
- ✅ **Navbar Swedish labels** — Mobile menu changed from "Sign up" / "Log in" to "Logga in" / "Skapa konto" with differentiated styling
- ✅ **Signup query param** — `/logga-in?signup=true` auto-opens signup mode (password field visible, signup toggle active)
- ✅ **Dead `/users` page deleted** — Old registration page with "Bokföra" branding, light theme, wrong routes (`/login`). Fully superseded by `/logga-in`
- ✅ **Flow doc updated** — Removed stale routes (`/priser`, `/funktioner`, `/register`, `/forgot-password`), documented Swedish URL convention, documented inline forgot password flow

## Remaining

### Needs founder input
- Landing page content/copy — is it finalized?
- Demo showcase — does it need updating to match current app design?
- `/om-oss` and `/kontakt` — do these pages exist and have content?

### Low priority
- Resend email integration — user will wire this up (Supabase `resetPasswordForEmail` is called, but email delivery via Resend needs configuration)
- Enterprise plan "Kontakta oss" button — currently no-op (TODO in code)

## Files

| File | Role |
|------|------|
| `src/app/choose-plan/page.tsx` | Plan selection — dark theme ✅ |
| `src/app/logga-in/page.tsx` | Login + signup + forgot password ✅ |
| `src/components/landing/layout/navbar.tsx` | Public navbar — Swedish labels ✅ |
| `src/app/page.tsx` | Landing page (hero, features, pricing) |

## Acceptance Criteria
- [x] Choose-plan matches dark theme
- [x] Forgot password works inline (no dedicated page)
- [x] Navbar uses Swedish labels
- [x] Dead registration route deleted
- [ ] All public routes render correctly
- [ ] Subscribe → checkout → onboarding flow works end-to-end
- [ ] Demo mode functional with fake data
