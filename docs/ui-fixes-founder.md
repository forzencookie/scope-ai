# UI Fixes - Founder Touchups

This document tracks specific UI tweaks and polish tasks that the founder will address later. These items are lower priority compared to core functionality and data flow.

## 1. Chat Input / Quick Actions (`/` Command) Menu
* **The Goal:** Make the `/` command menu look and feel exactly like the terminal-style command palette in the Gemini web interface.
* **Current State:** The menu pops up correctly, spans the full width of the input, and is compacted.
* **To be fixed by Founder:**
    * Fine-tune the typography, spacing, and hover states to perfectly match the Gemini aesthetic.
    * Potentially adjust the positioning so it "transforms" out of the input bar even more seamlessly.
    * Make the action chip that drops into the input field even more subtle/native-looking.
    * Revisit the font sizes (currently `text-[13px]` for labels and `text-[12px]` for descriptions).
* **Reference Files:**
    * `src/components/ai/chat-input.tsx`
    * `src/components/ai/quick-actions-menu.tsx`

## 2. Mobile Navigation
* **The Goal:** Add a proper mobile navbar. Currently, the mobile layout lacks a dedicated navigation bar to easily switch between pages/categories on small screens.
* **To be fixed by Founder:**
    * Design and implement a bottom tab bar or a hamburger menu for mobile devices.

## 3. Incognito Mode Button Visibility
* **The Goal:** The incognito mode toggle button should disappear or hide once a chat has started.
* **To be fixed by Founder:**
    * Update the logic so the ghost/paw print button is only visible on the empty chat/landing screen, and fades out or is removed once `messages.length > 0`.
    * **Reference Files:** `src/components/layout/main-content-area.tsx`
