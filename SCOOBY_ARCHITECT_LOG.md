# Scooby’s Architect Log: The AI-Native Vision

This document tracks the alignment between our **Features (The Vision)** and our **Code (The Reality)**. It serves as the primary map for turning Scope AI into a fully deterministic, AI-first accounting platform.

---

## 1. This is Scope AI: The Vision
Scope AI is not a dashboard where you click buttons to do work. It is a conversation with **Scooby**, an AI assistant who does the work for you.
- **The Chat** is the only place where things happen (Mutations).
- **The UI** is a read-only mirror (The Dashboard) used to verify Scooby’s work.
- **The Guardrails** are deterministic Swedish accounting laws that the AI cannot "guess."

---

## 2. Feature & Code Audit (Folder by Folder)

### 📂 `src/app` & `src/components/ai` (The Interaction Layer)
**What it does:** This is the **AI Interface**. It’s where the user says "Bokför det här kvittot" (Book this receipt). It has the chat input and the Mascot that reacts to your company's health.
**How it works:** User chats → Scooby picks a **Tool** → Tool shows a **Card** → User clicks **Confirm**.
**The Code is Confused:** Many files in `src/app/dashboard` still act like old-school pages with manual "Add" buttons.
**🚩 Note to Founder:** Something is off. I found that the `app/api/chat` doesn't have a way to "Stage" work. If Scooby prepares a complex salary run, it just sits in the chat's memory. If the user refreshes, that work is lost. **We need a `staged_actions` table** so Scooby can save a draft that persists across sessions until you click "Confirm."

### 📂 `src/services` & `src/lib/bookkeeping` (The Financial Engine)
**What it does:** This is the **Deterministic Brain**. It handles the "Bokföring" (Accounting) and "Löner" (Payroll) features. It knows that debits must equal credits and that VAT is 25%.
**How it works:** When Scooby calls `create_verification`, this engine checks the rules of the Swedish Bookkeeping Act (BFL).
**The Code is Confused:** Some services (like `tax-declaration-service.ts`) are just empty shells or "stubs." They aren't actually doing the math yet; they are just returning mock data.
**🚩 Note to Founder:** Something is off. I found that `lib/bookkeeping` is not yet connected to the **Activity Log**. When a user manually changes a number on a card, we aren't "hashing" that change to prove it’s legal. We need to make the Bookkeeping Engine the **only** thing allowed to touch the database.

### 📂 `src/hooks` & `src/providers` (The Data Glue)
**What it does:** This is the **Real-time Sync** feature. It’s why the Sidebar shows "3 tasks to do" the moment Scooby finds an unbooked transaction.
**How it works:** Hooks like `useInvoices` or `useEvents` watch the database and tell the UI to update immediately.
**The Code is Confused:** These hooks are full of "indecisive code" (`?` and `null`). They are trying to handle "bad data" from old versions of the app. 
**🚩 Note to Founder:** Something is off. The `use-corporate.tsx` hook (Ägare feature) stores your planned meetings **only in the browser's memory**. If you close the tab, the meeting notice you just wrote with Scooby disappears. This feature is "forgetful." We need to move this into the `meetings` database table immediately.

### 📂 `src/lib/ai-tools` (Scooby’s Hands)
**What it does:** This is the **Toolbox** feature. It’s how Scooby actually *does* things like `add_shareholder` or `run_payroll`.
**How it works:** Scooby picks a tool, the tool calls a Service, and the Service talks to the DB.
**The Code is Confused:** Some tools are calling `fetch('/api/...')` instead of calling the Services directly. This is a "cheap shortcut" that makes the app slow and jittery.
**🚩 Note to Founder:** Something is off. I found that we have **60+ tools** but many are duplicates. For example, we have two different ways to "fetch shareholders." One for the AI and one for the Page. They need to be merged into one single "Source of Truth."

### 📂 `src/data` & `src/types` (The Legal Guardrails)
**What it does:** This is the **Source of Truth** for Swedish Law. It contains the BAS accounts and the Tax Rules.
**How it works:** It ensures that when you click a button to "Book to 1930," the app knows that 1930 is the "Bankkonto."
**The Code is Confused:** The `src/types/database.ts` is often out of sync with our actual features because we keep changing the vision faster than the schema.
**🚩 Note to Founder:** Something is off. I found that the `tax_tables` for payroll are missing. Although for a payroll app to be proper, it needs a direct link to Skatteverket’s yearly tables. We shouldn't let Scooby "guess" the tax rate for Stockholm vs. Malmö.

---

## 3. Why the features aren't talking nicely
The app is currently "Bipolar."
- **Side A (The Old Way):** Manual pages, forms, and local state.
- **Side B (The New Way):** Scooby, Tools, and Overlays.

Because these two sides are fighting, the data is often disconnected. You might add a shareholder via Scooby, but the "Ägare" page won't see it until you refresh, or vice versa.

---

## 4. The "Straightforward" Plan to Fix It

1.  **Delete the "Old Way":** Systematically go through `src/components/` and delete all manual `Dialog` and `Form` files.
2.  **Deterministic Mapping:** Update every **Service** to return "Certain Data." No more `number | null`. If the DB has null, the Service returns `0`.
3.  **The "Staging" Table:** Create a new database table for **Draft Actions**. This allows Scooby to "prepare" an entire month of bookkeeping for you to review in an overlay before any real money or legal records are touched.
4.  **Connect the Brain:** Refactor every **Hook** to use the **Services** instead of querying the database directly. This ensures that the AI and the User are always looking at the exact same data.

---

## 5. The "Final Touch" Strategy (Self-Documenting AI Codebase)

Once all legacy code is purged and the core wiring is complete, we will perform a final pass across the entire codebase to make it **Self-Documenting for AI**.

### 5.1 Contextual Headers
Every single file (`.ts`, `.tsx`) must start with a comment explaining its purpose in the **Scope AI Native Platform**. 
- **What feature it serves:** (e.g., "This file handles the Year-End Closing logic.")
- **How it fits the AI vision:** (e.g., "This is a read-only mirror for Scooby’s output. All mutations must go through the `/månad` tool.")

### 5.2 Greppable Failure Flags
If a file has known issues or doesn't perfectly meet our "Straightforward" standard, it will be flagged with a searchable tag. This allows the founder to query the terminal and see exactly what's broken.

**Standard Tags:**
- `// TODO(SCOOBY-VISION):` Code that still follows "Old Way" patterns (e.g., manual forms).
- `// FIXME(DATA-ISOLATION):` Queries that are missing explicit `company_id` or `user_id` checks.
- `// DEBT(DETERMINISM):` Code that uses `?` or `null` instead of returning Certain Data.

**Query Example:**
```bash
grep -r "TODO(SCOOBY-VISION)" src/
```

**Goal:** A codebase that any AI can read, understand, and fix without human guidance.

