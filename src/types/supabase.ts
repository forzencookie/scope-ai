/**
 * Supabase Database Types
 * 
 * This file should be regenerated using `supabase gen types typescript`
 * when the database schema changes.
 * 
 * For now, this provides a minimal type definition to satisfy imports.
 */

export interface Database {
    public: {
        Tables: {
            // Core tables
            transactions: {
                Row: {
                    id: string
                    company_id: string | null
                    user_id: string | null
                    description: string | null
                    amount: number | null
                    occurred_at: string | null
                    status: string | null
                    source: string | null
                    metadata: Record<string, unknown> | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: Partial<Database['public']['Tables']['transactions']['Row']>
                Update: Partial<Database['public']['Tables']['transactions']['Row']>
            }
            receipts: {
                Row: {
                    id: string
                    company_id: string | null
                    user_id: string | null
                    vendor: string | null
                    amount: number | null
                    vat_amount: number | null
                    category: string | null
                    image_url: string | null
                    captured_at: string | null
                    processed: boolean | null
                    created_at: string | null
                }
                Insert: Partial<Database['public']['Tables']['receipts']['Row']>
                Update: Partial<Database['public']['Tables']['receipts']['Row']>
            }
            supplier_invoices: {
                Row: {
                    id: string
                    company_id: string | null
                    user_id: string | null
                    supplier_name: string | null
                    invoice_number: string | null
                    total_amount: number | null
                    vat_amount: number | null
                    due_date: string | null
                    status: string | null
                    ocr: string | null
                    bankgiro: string | null
                    created_at: string | null
                }
                Insert: Partial<Database['public']['Tables']['supplier_invoices']['Row']>
                Update: Partial<Database['public']['Tables']['supplier_invoices']['Row']>
            }
            verifications: {
                Row: {
                    id: string
                    company_id: string | null
                    user_id: string | null
                    date: string | null
                    description: string | null
                    rows: unknown[] | null
                    created_at: string | null
                }
                Insert: Partial<Database['public']['Tables']['verifications']['Row']>
                Update: Partial<Database['public']['Tables']['verifications']['Row']>
            }
            employees: {
                Row: {
                    id: string
                    company_id: string | null
                    user_id: string | null
                    name: string | null
                    email: string | null
                    salary: number | null
                    created_at: string | null
                }
                Insert: Partial<Database['public']['Tables']['employees']['Row']>
                Update: Partial<Database['public']['Tables']['employees']['Row']>
            }
            payslips: {
                Row: {
                    id: string
                    company_id: string | null
                    user_id: string | null
                    employee_id: string | null
                    period: string | null
                    gross_salary: number | null
                    net_salary: number | null
                    tax: number | null
                    created_at: string | null
                }
                Insert: Partial<Database['public']['Tables']['payslips']['Row']>
                Update: Partial<Database['public']['Tables']['payslips']['Row']>
            }
            conversations: {
                Row: {
                    id: string
                    user_id: string | null
                    title: string | null
                    updated_at: string | null
                    created_at: string | null
                }
                Insert: Partial<Database['public']['Tables']['conversations']['Row']>
                Update: Partial<Database['public']['Tables']['conversations']['Row']>
            }
            messages: {
                Row: {
                    id: string
                    conversation_id: string
                    role: string
                    content: string
                    metadata: Record<string, unknown> | null
                    created_at: string | null
                }
                Insert: Partial<Database['public']['Tables']['messages']['Row']> & { conversation_id: string; role: string; content: string }
                Update: Partial<Database['public']['Tables']['messages']['Row']>
            }
            inbox_items: {
                Row: {
                    id: string
                    company_id: string | null
                    user_id: string | null
                    sender: string | null
                    title: string | null
                    description: string | null
                    date: string | null
                    category: string | null
                    read: boolean | null
                    starred: boolean | null
                    created_at: string | null
                }
                Insert: Partial<Database['public']['Tables']['inbox_items']['Row']>
                Update: Partial<Database['public']['Tables']['inbox_items']['Row']>
            }
            company_members: {
                Row: {
                    id: string
                    user_id: string
                    company_id: string
                    role: string | null
                    created_at: string | null
                }
                Insert: Partial<Database['public']['Tables']['company_members']['Row']> & { user_id: string; company_id: string }
                Update: Partial<Database['public']['Tables']['company_members']['Row']>
            }
            roadmaps: {
                Row: {
                    id: string
                    user_id: string | null
                    title: string | null
                    status: string | null
                    created_at: string | null
                }
                Insert: Partial<Database['public']['Tables']['roadmaps']['Row']>
                Update: Partial<Database['public']['Tables']['roadmaps']['Row']>
            }
            roadmap_steps: {
                Row: {
                    id: string
                    roadmap_id: string
                    title: string | null
                    order_index: number | null
                    status: string | null
                    created_at: string | null
                }
                Insert: Partial<Database['public']['Tables']['roadmap_steps']['Row']> & { roadmap_id: string }
                Update: Partial<Database['public']['Tables']['roadmap_steps']['Row']>
            }
        }
        Views: Record<string, never>
        Functions: Record<string, never>
        Enums: Record<string, never>
    }
}
