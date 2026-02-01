# Coding Standards

## 1. TypeScript Rules
*   **No `any`:** Avoid `any` at all costs. Use `unknown` or define a distinct type.
*   **Interfaces over Types:** Use `interface` for object definitions (better error messages).
*   **Explicitness:** Return types for functions are mandatory for exported functions.

## 2. Component Guidelines
*   **Filenames:** Kebab-case (`invoice-list.tsx`, not `InvoiceList.tsx`).
*   **Exports:** Use Named Exports (`export function InvoiceList`), not Default Exports.
*   **Props:** Define a `interface ComponentProps` right above the component.

## 3. CSS / Tailwind
*   **Utility First:** Use Tailwind utilities.
*   **Clsx/Cn:** Use the `cn()` helper for conditional classes.
*   **Mobile First:** Write `class="flex flex-col md:flex-row"` (Defaults to mobile, overrides for desktop).

## 4. Error Handling
*   **UI:** Use `useToast` for user-facing success/error messages.
*   **Logging:** Log errors to console in development, but ensure sensitive data (PII) is not logged.
