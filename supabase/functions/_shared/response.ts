import { corsHeaders } from './supabase.ts'

/**
 * Creates a JSON response with CORS headers
 */
export function jsonResponse(data: unknown, status = 200) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    }
  )
}

/**
 * Creates an error response
 */
export function errorResponse(message: string, status = 400) {
  return jsonResponse({ error: message }, status)
}

/**
 * Handles CORS preflight requests
 */
export function handleCors(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  return null
}
