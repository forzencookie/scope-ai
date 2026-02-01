# Scope AI Context Library

This folder contains the **long-term memory** for AI agents (and human developers) working on Scope AI.
Before starting a complex task, an agent should check these files to understand the "Laws of the Physics" for this project.

## 📚 Core Documentation

### 1. Architecture & Tech
*   **[tech-stack.md](./tech-stack.md)** - The chosen technologies and *why* we use them.
*   **[project-structure.md](./project-structure.md)** - Where things live (Folders, Components, API).
*   **[feature-map.md](./feature-map.md)** - **START HERE:** Page-by-page feature connectivity.
*   **[coding-standards.md](./coding-standards.md)** - Style guide, naming conventions, and anti-patterns.

### 2. Business & Logic
*   **[business-domain.md](./business-domain.md)** - Accounting rules, tax laws (SE), and core entities (Aktiebok, Moms, Löner).
*   **[ai-behavior.md](../ai-conversation-scenarios.md)** - (Link) The Agent's personality, scenarios, and guardrails.

### 3. UI/UX System
*   **[ux-patterns.md](./ux-patterns.md)** - Reusable components, layouts, and design philosophy.
*   **[walkthrough-engine.md](../walkthrough-designs.md)** - (Link) The dynamic overlay system documentation.

## 🤖 How to use this library
**For AI Agents:**
1.  **Read `tech-stack.md`** first to know what tools you have.
2.  **Read `project-structure.md`** to know where to write code.
3.  **Read `business-domain.md`** context before touching logic (e.g., Vat, Payroll).

**For Humans:**
Update these files when you make **architectural decisions**. If you change how auth works, update `tech-stack.md`. Don't let this rot.
