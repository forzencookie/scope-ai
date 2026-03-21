# Feature Flows

> Each doc describes one core workflow of the app — what we're building toward.
> Read before working on that area. Update when code changes.
> Once production-ready, these become living archives of how things work.

## Foundation

| Flow | What It Covers |
|------|---------------|
| [AI-First Philosophy](ai-first-philosophy.md) | Why we exist, the two brains problem, what AI handles vs what code handles |

## Core Flows

| Flow | What It Covers |
|------|---------------|
| [AI Interface](ai-interface.md) | Chat, Scooby, sidebar tasks, two-layer cards, skills, scenarios, cascades |
| [Scooby Engine](scooby-engine.md) | Context engineering, token management, memory architecture, 6 load-bearing systems |
| [Information Pages](information-pages.md) | Read-only data displays, table structure, page list |
| [Tools](tools.md) | AI tool architecture, rule engine, service layer, tool categories |
| [Walkthrough Overlays](walkthrough-overlays.md) | Card click → full preview, auto-rendered reports, block primitives |
| [Page Overlays](page-overlays.md) | Table row click → detail view, replaces all dialogs |

## Supporting Flows

| Flow | What It Covers |
|------|---------------|
| [Settings](settings.md) | Company info, profile, language, billing — overlay in main content area |
| [Payments](payments.md) | Stripe subscription, token purchase, custom checkout |
| [Onboarding](onboarding.md) | Post-payment guided setup — company + profile |
| [Landing Page](landing-page.md) | Public pages, conversion flow, demo mode |

## Rules

1. **Read the relevant flow before working on a feature area.**
2. **If the flow doc doesn't exist for your area, create it.**
3. **If your code changes alter the flow, update the doc.**
4. **Flow docs describe the target state** — what we're building toward. Once achieved, they become living archives of how things work.
