# Workflow: Customer Management

> How users manage their customers and accounts receivable. While not a top-level nav item, it is an essential part of the invoicing and sales lifecycle.

## What It Is
Customer management is an **AI-driven context layer**. There is no traditional "Customer List" page where you manually type in addresses. Instead, Scooby manages the directory through interaction and external lookups.

## The Interaction Flow

### 1. Adding a Customer
*   **User:** "Skapa en faktura till Acme AB."
*   **Scooby:** Calls `search_external_company` (allabolag.se lookup) to get org.nr, legal address, and VAT status.
*   **Result:** Customer is auto-created in the background. Scooby presents a card with the details found.
*   **User:** "Det stämmer, men lägg till referens 'Erik'." → Scooby updates the customer record in memory.

### 2. The Customer Dossier (Overlay)
Whenever a customer name appears in the UI (on an invoice, a transaction, or in chat), clicking it opens the **Customer Dossier Overlay**:
- **Identity:** Legal name, org.nr, address.
- **Financial Health:** Total sales YTD, outstanding balance, average days to pay.
- **Activity:** List of recent invoices and payments.
- **Scooby Integration:** "Fråga Scooby om den här kunden" (e.g., "Har de betalat för mycket förra månaden?").

## Key Logic
- **No Manual Entry:** Always prefer fetching from `allabolag` or `Bolagsverket` sources to ensure legal accuracy.
- **Payment Matching:** Scooby uses the customer's known bank accounts or OCR references to match incoming bank transactions to open invoices.
- **Credit Logic:** If a customer has multiple overdue invoices, Scooby proactively warns the user when they try to create a new one: *"Varning: Acme AB har 3 förfallna fakturor. Vill du ändå skapa en ny?"*

## Technical Components
- **Service:** `customer-service.ts`
- **AI Tool:** `manage_customers`, `search_external_company`
- **UI:** `CustomerDossierOverlay.tsx`

## Scenarios

**Scenario 1: "Vem är min största kund?"**
1. Scooby queries `customer-service` for YTD sales per customer.
2. Returns a comparison table card.
3. User clicks the top customer → opens Dossier to see their latest unpaid invoice.

**Scenario 2: "Uppdatera adressen för Svea IT"**
1. User chats the change.
2. Scooby updates the DB record.
3. Confirms: "Adressen för Svea IT är nu uppdaterad inför nästa faktura."
