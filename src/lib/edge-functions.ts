/**
 * Utility to call Supabase Edge Functions from your Next.js app
 */

import { supabase } from './supabase'

interface InvokeFunctionOptions {
  functionName: string
  body?: Record<string, unknown>
  headers?: Record<string, string>
}

/**
 * Invoke a Supabase Edge Function
 */
export async function invokeEdgeFunction<T = unknown>({
  functionName,
  body,
  headers = {},
}: InvokeFunctionOptions): Promise<{ data: T | null; error: Error | null }> {
  try {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body,
      headers,
    })

    if (error) {
      return { data: null, error }
    }

    return { data: data as T, error: null }
  } catch (error) {
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error('Unknown error') 
    }
  }
}

/**
 * Example usage in your components:
 * 
 * const { data, error } = await invokeEdgeFunction({
 *   functionName: 'hello-world',
 *   body: { name: 'John' }
 * })
 */
