# Supabase Edge Functions

This directory contains Supabase Edge Functions (Deno-based serverless functions).

## Structure
```
supabase/functions/
├── _shared/           # Shared utilities across functions
├── function-name/     # Individual edge function
│   └── index.ts
└── .env              # Local environment variables
```

## Commands

### Development
```bash
# Start functions locally
npx supabase functions serve

# Start specific function
npx supabase functions serve function-name
```

### Deployment
```bash
# Deploy all functions
npx supabase functions deploy

# Deploy specific function
npx supabase functions deploy function-name

# Deploy with environment secrets
npx supabase secrets set KEY=value
```

## Creating a New Function
```bash
npx supabase functions new function-name
```

## Testing Functions Locally
```bash
curl -i --location --request POST 'http://localhost:54321/functions/v1/function-name' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"key":"value"}'
```
