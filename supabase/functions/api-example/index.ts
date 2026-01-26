import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createUserClient } from '../_shared/supabase.ts'
import { handleCors, jsonResponse, errorResponse } from '../_shared/response.ts'

Deno.serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return errorResponse('Missing authorization header', 401)
    }

    // Create client with user context
    const supabase = createUserClient(authHeader)

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return errorResponse('Unauthorized', 401)
    }

    // Parse request body
    const { action } = await req.json()

    // Your business logic here
    let result
    switch (action) {
      case 'example':
        // Example: Query database
        const { data: queryData, error: queryError } = await supabase
          .from('your_table')
          .select('*')
        
        if (queryError) throw queryError
        result = queryData
        break
      
      default:
        return errorResponse('Invalid action', 400)
    }

    return jsonResponse({
      success: true,
      user: user.email,
      result,
    })

  } catch (error) {
    console.error('Function error:', error)
    return errorResponse(error.message, 500)
  }
})
