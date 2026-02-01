# Project Structure Map

```text
src/
├── app/                 # Next.js App Router (Pages & Layouts)
│   ├── api/             # Backend endpoints (Webhooks, AI stream)
│   ├── (dashboard)/     # Authenticated routes (Dashboard, Settings)
│   └── (marketing)/     # Public landing pages
├── components/
│   ├── ui/              # Shadcn/UI primitives (Button, Card)
│   ├── ai/              # AI-specific components (Chat, Overlay)
│   ├── bokforing/       # Accounting feature components
│   ├── loner/           # Payroll feature components
│   ├── rapporter/       # Reports (Moms, Balance Sheet)
│   └── installningar/   # Settings tabs
├── lib/                 # Utilities & Config
│   ├── database/        # Supabase client setup
│   └── utils.ts         # CN helper etc.
├── services/            # Data access layer (Supabase calls)
├── types/               # TypeScript definitions
└── emails/              # React Email templates
```

## Feature Modules
We organize code by **Business Domain**, not by file type.
*   Everything related to Payroll is in `src/components/loner/`.
*   Everything related to VAT/Reports is in `src/components/rapporter/`.

Do not create a giant `components/Forms` folder. Put the `PayrollForm` inside `src/components/loner/`.
