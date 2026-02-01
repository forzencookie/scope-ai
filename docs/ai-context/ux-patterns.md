# UX Patterns & Component Library

## 1. Design Philosophy
*   **Clean & Professional:** Lots of whitespace, crisp borders, subtle shadows.
*   **Native Feel:** Should feel like part of the OS, not a website.
*   **Dark Mode First:** The branding leans heavily on dark/cosmic themes ("Scope").

## 2. Core Components (Shadcn/UI)
We use a customized version of Shadcn.
*   `Button`: Variants `default`, `secondary`, `ghost`, `destructive`.
*   `Card`: The primary container for content.
*   `Dialog`: For modals / critical confirmations.
*   `Sheet`: For side-drawers (e.g. editing a row).

## 3. The "Shell" Layout
*   **Sidebar:** Fixed left navigation.
*   **AI Overlay:** A persistent layer that can slide over ANY content.
*   **Main Content:** Centered, max-width constrained for readability.

## 4. Key UX Flows
*   **The "Walkthrough":** The primary way we present complex data. See `docs/walkthrough-designs.md`.
*   **Drill-down:** Clicking a Card usually opens a Sheet or redirects to a Detail View.
