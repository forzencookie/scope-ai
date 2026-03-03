# AI-Native Redesign Plan

> **DEPRECATED (2026-03-01):** This document is NO LONGER the active plan. Pages are NOT being removed. The sidebar stays. AI assists users on existing pages (AI-driven flows like navigateToAI + actionTrigger) but does NOT replace them. See `FUTURE_FEATURES.md` for the actual audit-driven plan.

## Vision (DEPRECATED)

~~Remove the sidebar navigation entirely. The app becomes AI-first — the chat interface is the primary way to interact, with overlays for visual tasks. The only URL is `/dashboard`.~~

## Current State

Sidebar with 6 categories, 20+ pages, each with its own route. AI chat is a secondary mode. Users switch between "sidebar mode" and "ai mode".

## New State

One page: the dashboard (events/activity view). Six category badges in the AI chat interface. Overlays replace pages.

---

## The 6 Category Badges

Colorful, clickable badges displayed in the AI chat area. Pressing a badge opens that category's overlay — a full-height panel (like momsdeklaration overlay) showing the category's content.

| Badge | Color | Contains |
|---|---|---|
| **Bokföring** | — | Transaktioner, Verifikationer, Fakturor, Kvitton, Inventarier |
| **Löner** | — | Lönekörning, Förmåner, Team, Delägaruttag |
| **Ägare** | — | Delägare, Aktiebok, Utdelning |
| **Rapporter** | — | Resultaträkning, Balansräkning, Moms, INK2, AGI, Årsredovisning/Årsbokslut, K10, Egenavgifter |
| **Händelser** | — | This IS the dashboard — no overlay needed, it's the home view |
| **Inställningar** | — | Företagsinställningar, Profil, Preferenser |

Badge colors TBD by founder.

---

## Dashboard = Händelser

The landing page. Shows current activity and what needs attention:

- Pending bookings awaiting confirmation
- Unbooked transactions count
- Overdue invoices
- Upcoming deadlines (moms, AGI, F-skatt inbetalning)
- Recent AI conversations / actions taken
- Roadmap progress (Min Plan)

This is the only "page" in the app. Everything else is an overlay triggered by badge click, AI action, or dashboard item click.

---

## How It Works

### User Flow A: Badge Navigation
1. User sees 6 badges in chat area
2. Clicks "Bokföring" → overlay slides in showing Bokföring content (tabs for Transaktioner, Verifikationer, etc.)
3. User browses, takes actions within the overlay
4. Closes overlay → back to dashboard/chat

### User Flow B: AI-Driven
1. User types "visa mina obokade transaktioner"
2. AI opens the Bokföring overlay on the Transaktioner tab, filtered to unbooked
3. Or: AI responds inline with a summary and offers to open the overlay

### User Flow C: Dashboard Action
1. Dashboard shows "12 obokade transaktioner" card
2. User clicks it → AI opens relevant overlay
3. Or user asks AI about it in chat

---

## What Changes

### Remove
- Sidebar navigation component
- All page routes except `/dashboard`
- "Sidebar mode" vs "AI mode" toggle
- Individual page URLs (`/dashboard/loner`, `/dashboard/bokforing`, etc.)

### Keep (becomes overlay content)
- All existing components (they render inside overlays instead of pages)
- All hooks, services, AI tools — business logic untouched
- The overlay pattern already proven by momsdeklaration

### Build New
- Category badge component (6 badges, colorful, clickable)
- Overlay shell that can host any category's content
- Smarter dashboard/events page (the new home)
- Category-level tab navigation within each overlay

---

## Migration Strategy

Phase approach to avoid a risky hard cutover:

### Phase 1: Dashboard as Home
- Make Händelser/events the default landing page
- Keep sidebar but make it collapsible/secondary
- Ensure dashboard surfaces key action items

### Phase 2: Badge System
- Add the 6 category badges to the AI chat area
- Wire each badge to open its category as an overlay
- Overlay content = existing page components, just re-parented

### Phase 3: Remove Sidebar
- Once all categories work as overlays, remove sidebar
- Remove all page routes except `/dashboard`
- Remove the sidebar/AI mode toggle

---

## Top Navbar (Safari-style)

Move the current top-right toolbar icons out of the main content header and into a persistent top navbar across the full width of the app. Looks like a Safari address bar.

**Layout:**
```
┌──────────────────────────────────────────────────────────┐
│  [≡] [<] [>]      [ 🔍 Sök...                ]    [↻] [💬] [+] │
└──────────────────────────────────────────────────────────┘
│                                                          │
│                   AI Chat Area                           │
│                   (pushed below navbar)                  │
│                                                          │
```

**Left side:**
- Sidebar toggle (≡)
- Back / Forward navigation arrows

**Center:**
- Global search bar ("Sök...") — searches across the whole app

**Right side (existing icons, relocated):**
- RefreshCw (↻) — page refresh
- MessageSquare (💬) — chat history
- Plus (+) — new conversation

This replaces the current `DashboardToolbar` icons that sit inside the main content area. The navbar is always visible, the AI chat sits below it.

---

## Notes

- Egenavgifter moves from Löner to Rapporter (see FUTURE_FEATURES.md)
- The app in beta is more focused on input/output — dashboard UI should be gentle, not overwhelming with info
- AI should be good at suggesting actions and surfacing capabilities for discoverability (replaces sidebar's role as feature directory)
