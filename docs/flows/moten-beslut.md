# Flow: Möten & Beslut (Meetings & Decisions)

> Read-only page displaying bolagsstämmor and styrelsemöten with their decisions, protokoll, and kallelser. All mutations through Scooby.

## Purpose

Swedish aktiebolag are legally required to hold an årsstämma (annual general meeting) within 6 months of the fiscal year end (ABL 7 kap. 10 §). Companies may also hold extra bolagsstämmor and styrelsemöten throughout the year. This page gives a complete overview of all meetings, what was decided, and which documents exist.

## Page Structure

### 1. Stat Cards (top row)

Three gradient stat cards:

| Card | Icon | Color | Value |
|------|------|-------|-------|
| Totalt möten | Users | Violet | Count of all meetings |
| Genomförda | CheckCircle2 | Emerald | Count of completed meetings |
| Protokoll saknas | Clock | Amber | Count of meetings without protokoll |

### 2. Category Filter

Pill-style filter buttons to narrow by meeting type:

- **Alla** — show all meetings
- **Bolagsstämma** — violet active state
- **Styrelsemöte** — sky active state

### 3. Meeting Cards (expandable list)

Each meeting renders as a collapsible card, sorted by date (newest first).

**Collapsed state:**
- **Month badge** (h-9 w-9 rounded-lg) — 3-letter Swedish month abbreviation (JUN, FEB, MAJ). Color indicates meeting type: violet for bolagsstämma, sky for styrelsemöte.
- **Title** — "{Meeting type} {Year}" (e.g. "Bolagsstämma 2025")
- **Status badge** — inline next to title
- **Date** — with Calendar icon, muted
- **Document badges** — "Kallelse" (blue when exists, muted when missing) and "Protokoll" (emerald when exists, muted when missing)
- **Decision count** — "3 beslut" pill, muted
- **Chevron** — expand/collapse indicator

**Expanded state:**
- No hover background on the header (hover only applies when collapsed)
- Separator line between header and content — inset from the month badge's right edge to the chevron's left edge (not full width)
- Same background color as collapsed (no grey differentiation)
- **Beslut section** — numbered list of decisions with violet numbered circles
- **Empty state** — dashed border message "Inga beslut ännu — fråga Scooby för att förbereda stämman."
- **Document buttons** — "Kallelse PDF" and "Protokoll PDF" download buttons, disabled when document doesn't exist

**Status badges:**

| Status | Color | Meaning |
|--------|-------|---------|
| Planerad | Blue | Meeting scheduled but not yet held |
| Genomförd | Emerald | Meeting completed |
| Försenad | Red (pulse) | Overdue — årsstämma not held within the legal deadline |

**No warning cards on the page.** The overdue status badge (red, pulsing) is sufficient. Active warnings and reminders are Scooby's responsibility — the page is a read-only reference.

### 4. Meeting Types

| Type | Swedish | Color | Description |
|------|---------|-------|-------------|
| Bolagsstämma | Bolagsstämma | Violet | Shareholder meeting. Årsstämma (ordinary) or extra bolagsstämma. |
| Styrelsemöte | Styrelsemöte | Sky | Board meeting. Typically numbered within a fiscal year. |

Multiple bolagsstämmor can occur in the same year — one mandatory årsstämma plus any extra bolagsstämmor as needed. The month badge distinguishes them.

## Data Source

### Database Tables

```
meetings
  - id, company_id
  - meeting_type (bolagsstamma | styrelsemote)
  - meeting_date
  - year (fiscal year)
  - status (planerad | genomford | overdue)
  - has_protokoll (boolean)
  - has_kallelse (boolean)
  - created_at, updated_at

meeting_decisions
  - id, meeting_id
  - order_number (sequential within meeting)
  - title
  - decision_type (arsredovisning | utdelning | styrelse | nyemission | budget | etc.)
  - metadata (JSON — details specific to the decision type)

meeting_documents
  - id, meeting_id
  - document_type (protokoll | kallelse)
  - file_url
  - generated_at
```

### Derived Values

- **Meeting counts** — filtered aggregations from `meetings` table
- **Protokoll saknas** — `COUNT WHERE has_protokoll = false`
- **Overdue detection** — if `meeting_type = bolagsstamma` and current date > fiscal year end + 6 months and status != genomford

## Document Overlays (Protokoll & Kallelse)

Clicking "Protokoll" or "Kallelse" on a meeting card opens a **page overlay** displaying the full formatted document. These are the legal receipts of what was decided and how the meeting was convened.

### Protokoll (Meeting Minutes)

Professional legal document layout:

1. **Header** — Company name, org.nr (centered), document title ("Protokoll fört vid bolagsstämma"), date
2. **Meeting details** — Key-value rows (dashed separators): Tid, Plats, Närvarande, Protokollförare
3. **Beslut** — Each decision as a numbered paragraph (§ 1, § 2, etc.) with title and explanatory text
4. **Underskrifter** — Signature lines for attendees (name below, pen icon placeholder)
5. **Footer** — "Stäng" and "Ladda ner PDF" buttons

### Kallelse (Meeting Notice)

1. **Header** — Company name, org.nr (centered), document title ("Kallelse till bolagsstämma"), date
2. **Invitation text** — Formal one-liner
3. **Meeting details** — Key-value rows: Datum, Tid, Plats
4. **Dagordning** — Numbered agenda items. Mandatory items for årsstämma appear first (öppnande, val av ordförande, röstlängd, val av justerare, godkännande av dagordning), then the specific decisions, ending with "Stämmans avslutande"
5. **Footer text** — Anmälan deadline, place, date, "Styrelsen"
6. **Buttons** — "Stäng" and "Ladda ner PDF"

### Document Generation Flow

1. **Creation** — User asks Scooby to prepare a meeting. Scooby generates the document and presents it as a **walkthrough overlay** in chat for review.
2. **Review** — User can ask Scooby to adjust wording, add/remove agenda items, change details.
3. **Approval** — User approves. Document is stored and linked to the meeting.
4. **Viewing** — From the meetings page, clicking the document button opens the page overlay showing the stored document.
5. **PDF** — "Ladda ner PDF" renders the document as a downloadable PDF.

### In Production

These overlays will be **page overlays** (takes over main content area, sidebar stays visible) rather than modal dialogs. The test page uses a modal for simplicity.

## Mutations (via Scooby)

The page is read-only. All meeting actions go through chat:

- **Förbered årsstämma** — Scooby generates kallelse, dagordning (agenda), and prepares the meeting based on what needs to be decided (årsredovisning, utdelning, styrelseval)
- **Protokollför stämma** — Scooby generates the stämmoprotokoll after the meeting is held, recording all decisions
- **Förbered styrelsemöte** — Scooby prepares the agenda and any supporting documents
- **Protokollför styrelsemöte** — Scooby generates styrelsemötesprotokoll
- **Registrera beslut** — Scooby records individual decisions and triggers downstream actions (e.g. utdelningsbeslut creates a dividend entry, styrelseval updates aktiebok roles)

### Decision Cascades

Some decisions trigger actions in other parts of the system:

| Decision Type | Downstream Effect |
|---------------|-------------------|
| Utdelning | Creates dividend entry on utdelning page, triggers K10 calculation |
| Styrelseval | Updates roles in aktiebok (styrelseordförande, styrelseledamot) |
| Nyemission | Updates share count and capital in aktiebok |
| Årsredovisning | Links to the annual report document |
| Firmatecknare | Updates signatory roles in aktiebok |

## Legal Requirements

- **ABL 7 kap. 10 §** — Årsstämma must be held within 6 months of fiscal year end
- **ABL 7 kap. 48 §** — Protokoll must be kept for all bolagsstämmor
- **ABL 8 kap. 24 §** — Protokoll must be kept for all styrelsemöten
- **Kallelse** — Must be sent to shareholders within the timeframe specified in bolagsordningen (typically 2-4 weeks before stämma)
- **Dagordning** — Mandatory items at årsstämma: årsredovisning, resultatdisposition, ansvarsfrihet, styrelsearvode, revisor (if applicable)

## Row Click Behavior

Clicking a meeting card expands it inline (not a page overlay) since the content is compact enough. The expanded view shows decisions and document download buttons.

For a future iteration, clicking a specific decision within the expanded card could open a **page overlay** with:
- Full decision text
- Linked entities (e.g. the dividend it created, the board members elected)
- "Fråga Scooby" button with decision context prefilled

## What Connects Here

- **Aktiebok** — styrelseval and firmatecknare decisions update shareholder roles
- **Utdelning** — utdelningsbeslut creates dividend entries
- **Rapporter/Årsredovisning** — fastställande links to the annual report
- **Scooby** — the primary way to create meetings, generate documents, and record decisions
