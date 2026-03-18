# Engineering Mandates: Digital CFO & AI-Native Architecture

## App Purpose: The Digital CFO (Scooby Engine)
The app is an **AI-first Swedish accounting platform** designed to transform business management into a pure conversation. An AI assistant called **Scooby** handles the entire accounting lifecycle—booking transactions, creating invoices, running payroll, and filing tax declarations—all through conversational mutations.

### The Core Paradigm:
- **Chat-Only Mutations:** The chat interface is the *only* surface for modifying data. 
- **Read-Only Information Pages:** Conventional pages exist exclusively for reviewing data. Clicking a table row or a chat card opens immersive **Overlays** (Walkthrough or Page Overlays) for detailed deep-dives.
- **Human-in-the-Loop:** All AI actions create **pending** records. Finalization requires explicit user confirmation via the "Confirm/Reject" pattern.
- **Deterministic Legal Engine:** While the interface is stochastic, the "plumbing" is deterministic. All accounting follows Swedish law (BAS validation, debit/credit balance, sequential numbering) and utilizes specific data sources for tax rates and legal thresholds.
- **Cascades:** Intelligent downstream automation ensures that one action (e.g., running payroll) automatically handles all related entries (e.g., vacation accrual, AGI staging).

This document serves as the foundational mandate for all AI engineering tasks in this workspace. These rules take precedence over general instructions.

## 1. The "Digital CFO" Trust Principle
**"Guessing is the enemy of trust."**
Anders (the user) relies on this app for legally binding financial decisions. Stochastic AI output must never flow directly into deterministic UI components without a strict validation and normalization layer.

### Core Directive: Zero Tolerance for Unsafe Types
- **Never** use `as any`, `as unknown`, or `as Type` to bridge AI data to the UI.
- If types do not match, you MUST NOT force them with a cast. 
- You MUST define a strict normalization schema using Zod in `src/lib/ai-schema.ts`.
- Components must receive **guaranteed** data. No `?` or `||` guessing logic in rendering loops.

## 2. No "Cheap" Code Fixes
- Avoid "surgical" fixes that prioritize immediate compilation over architectural rigor.
- If a fix feels like "duct tape," it is the wrong fix. Stop and research the best TypeScript pattern for the problem.
- If you are unsure about the highest-quality way to write a piece of code, stop and perform research or ask the user.

## 3. The "Stop & Ask" Protocol (Inquiry vs. Directive)
If you feel insecure or "in the dark" about how data should flow:
- **STOP.** Do not proceed with a guess.
- Ask the user: *"The AI data structure is stochastic; should I define a strict normalization schema for this component?"*
- Propose a strategy based on strict typing and normalization before writing code.

## 4. Entity & Security Scoping
- Every query and tool execution MUST be strictly scoped by `company_id` and `user_id`.
- Use `allowedCompanyTypes` in tool definitions to restrict execution based on the Swedish legal entity (AB, EF, etc.).

---
*Failure to follow these rules breaks the Digital CFO vision and destroys user trust. Prioritize architectural rigor over speed.*
