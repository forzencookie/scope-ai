# AI-First Philosophy

> This is the foundational principle behind every architectural decision in Scope AI.

## What We Are

Scope AI is an **environment wrapped around an AI API key**, tasked to do Swedish accounting.

No different from ChatGPT, Claude AI, Gemini, Cursor, or Claude Code — those are all environments wrapped around an AI API key, each tasked to do a specific thing. Ours does accounting. Swedish accounting, to be exact. We can expand later.

## The Two Brains Problem

Legacy accounting apps have one brain: hardcoded business logic. They calculate taxes, generate reports, validate compliance — all through deterministic code paths written by developers who understood the domain at the time.

An AI-first app has a second brain: the model. It reasons, calculates, explains, handles edge cases, and adapts to context. When both brains exist, you get conflict — duplicated logic, stale calculations, and code that fights the AI instead of feeding it.

**Our answer: one brain for reasoning, one brain for rules.**

## The Division

### AI Handles (Scooby's Domain)
- All **reasoning** — "should I do X or Y?"
- All **calculations** — tax optimization, salary vs dividend, egenavgifter estimation
- All **explanations** — teaching users what's happening and why
- All **edge cases** — unusual company structures, special tax situations
- All **decisions** — what to book, when to file, how to structure
- All **formatting of human-readable output** — reports, summaries, recommendations

### Code Handles (Deterministic Rules)
- **Double-entry bookkeeping validation** — debit must equal credit, always
- **Sequential verification numbering** — BFL requires gap-free A1, A2, A3...
- **BAS account mapping** — the chart of accounts is a lookup table, not reasoning
- **SRU/XBRL file generation** — binary format specs don't need AI
- **Tax rate lookups** — municipality tables from Skatteverket, not calculations
- **Legal thresholds** — ABL equity checks, distributable profit rules
- **Authentication & authorization** — who can access what

### Tools Provide (The Bridge)
- Clean **data access** — read from and write to the database
- **Deterministic formatting** — structured output the AI can present
- **Service orchestration** — calling the right service in the right order
- **Input validation** — Zod schemas at system boundaries

## The Practical Test

Before writing or keeping any logic in a component, hook, or utility, ask:

1. **Is this a legal/mathematical invariant?** (debit = credit, sequential numbering) → **Keep as code**
2. **Is this a lookup?** (tax rates, account numbers, municipality tables) → **Keep as data**
3. **Is this reasoning or calculation that could change with context?** (tax optimization, payroll strategy, dividend timing) → **Let the AI handle it**
4. **Is this a UI wizard/calculator that duplicates what the AI does?** → **Delete it**

## What This Means for the Codebase

- **Components** are thin: display data, capture input, call AI
- **Hooks** fetch data and manage UI state — they don't calculate business results
- **Services** handle CRUD and enforce invariants — they don't make decisions
- **Tools** give the AI clean access to services — they don't contain business logic
- **The AI** does everything else

## The Reasoning-Before-Output Pattern

This is what makes Scope AI fundamentally different from traditional accounting software.

**Traditional software** blindly fetches data and assembles it into reports. If a receipt is missing, a transaction is miscategorized, or an account balance looks unusual — the report is wrong and nobody notices until an auditor catches it months later.

**Scope AI** puts the AI between the data and the output. Before generating any report, declaration, or document, Scooby:

1. **Fetches the data** using tools (same data the old code would fetch)
2. **Reasons about completeness** — "Are all expected verifications present for this period?"
3. **Flags anomalies** — "Account 3001 has revenue entries but no corresponding 2611 output VAT"
4. **Compares context** — "This quarter's moms is 30% lower than last quarter — is that expected?"
5. **Either warns the user or generates the output** — with an explanation of what it found

This means every report Scooby generates has been through a **reasoning quality gate**. Blind fetch logic can't say "this looks wrong." The AI can.

### How This Affects the Architecture

**Overlay previews** (walkthrough overlays, report previews) are pure display. They render whatever structured data they receive. They stay as-is.

**Page hooks** that power instant displays (dashboard KPIs, balance sheet tables, trend charts) stay as code for immediate rendering. The AI adds narrative interpretation on top — "your operating expenses are up 12%, mostly driven by the February hire."

**Report generation hooks** (K10 calculation, AGI declarations, dividend planning, egenavgifter estimation) get replaced by AI tool calls. These aren't latency-sensitive — the user explicitly asks for them. The AI should reason about the data before assembling the output.

**AI tools** get upgraded prompts: every report-generating tool includes a step to verify data completeness and flag anomalies before producing output.

**The rule:** If it renders on page load → deterministic code. If it generates a downloadable/sendable document → AI reasons first.

## Why This Works

The AI is better at reasoning than any hardcoded logic tree. It handles edge cases we'd never code for. It explains its work. It adapts when Swedish tax law changes (with updated system prompts and tools) without rewriting calculation engines.

The code we keep is the code the AI can't do: enforce database constraints, generate binary file formats, validate accounting invariants. Everything else is the AI's job.
