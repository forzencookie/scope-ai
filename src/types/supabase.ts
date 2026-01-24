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
                    date: string | null
                    account: string | null
                    reference: string | null
                    category: string | null
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
                    amount: number | null
                    total_amount: number | null
                    vat_amount: number | null
                    issue_date: string | null
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
                    name: string
                    role: string | null
                    monthly_salary: number
                    tax_rate: number
                    start_date: string | null
                    status: string
                    email: string | null
                    salary: number | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: Partial<Database['public']['Tables']['employees']['Row']> & { name: string }
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
            profiles: {
                Row: {
                    id: string
                    email: string | null
                    full_name: string | null
                    avatar_url: string | null
                    stripe_customer_id: string | null
                    stripe_subscription_id: string | null
                    subscription_status: string | null
                    subscription_tier: string | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: Partial<Database['public']['Tables']['profiles']['Row']>
                Update: Partial<Database['public']['Tables']['profiles']['Row']>
            }
            shareholders: {
                Row: {
                    id: string
                    company_id: string | null
                    name: string | null
                    ownership_percentage: number | null
                    shares: number | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: Partial<Database['public']['Tables']['shareholders']['Row']>
                Update: Partial<Database['public']['Tables']['shareholders']['Row']>
            }
            corporate_documents: {
                Row: {
                    id: string
                    company_id: string | null
                    title: string | null
                    type: string | null
                    file_url: string | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: Partial<Database['public']['Tables']['corporate_documents']['Row']>
                Update: Partial<Database['public']['Tables']['corporate_documents']['Row']>
            }
            members: {
                Row: {
                    id: string
                    company_id: string | null
                    member_number: string | null
                    name: string | null
                    email: string | null
                    phone: string | null
                    join_date: string | null
                    status: string | null
                    membership_type: string | null
                    last_paid_year: number | null
                    roles: string[] | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: Partial<Database['public']['Tables']['members']['Row']>
                Update: Partial<Database['public']['Tables']['members']['Row']>
            }
            tax_reports: {
                Row: {
                    id: string
                    company_id: string | null
                    period_id: string | null
                    type: string | null
                    status: string | null
                    data: Record<string, unknown> | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: Partial<Database['public']['Tables']['tax_reports']['Row']>
                Update: Partial<Database['public']['Tables']['tax_reports']['Row']>
            }
            financial_periods: {
                Row: {
                    id: string
                    company_id: string | null
                    start_date: string | null
                    end_date: string | null
                    status: string | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: Partial<Database['public']['Tables']['financial_periods']['Row']>
                Update: Partial<Database['public']['Tables']['financial_periods']['Row']>
            }
            events: {
                Row: {
                    id: string
                    company_id: string | null
                    user_id: string | null
                    timestamp: string
                    source: string
                    category: string
                    action: string
                    title: string
                    actor_type: string
                    actor_id: string | null
                    actor_name: string | null
                    description: string | null
                    metadata: Record<string, unknown> | null
                    related_to: Record<string, unknown> | null
                    status: string | null
                    corporate_action_type: string | null
                    proof: Record<string, unknown> | null
                    hash: string | null
                    previous_hash: string | null
                    created_at: string | null
                }
                Insert: Partial<Database['public']['Tables']['events']['Row']>
                Update: Partial<Database['public']['Tables']['events']['Row']>
            }
            inventarier: {
                Row: {
                    id: string
                    company_id: string | null
                    user_id: string | null
                    namn: string
                    kategori: string | null
                    inkopsdatum: string | null
                    inkopspris: number | null
                    livslangd_ar: number | null
                    anteckningar: string | null
                    status: string | null
                    created_at: string | null
                }
                Insert: Partial<Database['public']['Tables']['inventarier']['Row']>
                Update: Partial<Database['public']['Tables']['inventarier']['Row']>
            }
            customer_invoices: {
                Row: {
                    id: string
                    company_id: string | null
                    user_id: string | null
                    invoice_number: string | null
                    customer_name: string | null
                    customer_email: string | null
                    amount: number | null
                    vat_amount: number | null
                    total_amount: number | null
                    issue_date: string | null
                    due_date: string | null
                    status: string | null
                    created_at: string | null
                }
                Insert: Partial<Database['public']['Tables']['customer_invoices']['Row']>
                Update: Partial<Database['public']['Tables']['customer_invoices']['Row']>
            }
            benefits: {
                Row: {
                    id: string
                    company_id: string | null
                    user_id: string | null
                    name: string | null
                    type: string | null
                    taxable_amount: number | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: Partial<Database['public']['Tables']['benefits']['Row']>
                Update: Partial<Database['public']['Tables']['benefits']['Row']>
            }
            employee_benefits: {
                Row: {
                    id: string
                    employee_id: string | null
                    benefit_id: string | null
                    value: number | null
                    created_at: string | null
                }
                Insert: Partial<Database['public']['Tables']['employee_benefits']['Row']>
                Update: Partial<Database['public']['Tables']['employee_benefits']['Row']>
            }
            assets: {
                Row: {
                    id: string
                    company_id: string | null
                    user_id: string | null
                    name: string | null
                    category: string | null
                    purchase_date: string | null
                    purchase_price: number | null
                    current_value: number | null
                    depreciation_rate: number | null
                    status: string | null
                    created_at: string | null
                }
                Insert: Partial<Database['public']['Tables']['assets']['Row']>
                Update: Partial<Database['public']['Tables']['assets']['Row']>
            }
            vat_declarations: {
                Row: {
                    id: string
                    company_id: string | null
                    user_id: string | null
                    period: string | null
                    sales_vat: number | null
                    purchase_vat: number | null
                    net_vat: number | null
                    status: string | null
                    created_at: string | null
                }
                Insert: Partial<Database['public']['Tables']['vat_declarations']['Row']>
                Update: Partial<Database['public']['Tables']['vat_declarations']['Row']>
            }
            income_declarations: {
                Row: {
                    id: string
                    company_id: string | null
                    user_id: string | null
                    year: number | null
                    type: string | null
                    status: string | null
                    data: Record<string, unknown> | null
                    created_at: string | null
                }
                Insert: Partial<Database['public']['Tables']['income_declarations']['Row']>
                Update: Partial<Database['public']['Tables']['income_declarations']['Row']>
            }
            annual_closings: {
                Row: {
                    id: string
                    company_id: string | null
                    user_id: string | null
                    year: number | null
                    status: string | null
                    data: Record<string, unknown> | null
                    created_at: string | null
                }
                Insert: Partial<Database['public']['Tables']['annual_closings']['Row']>
                Update: Partial<Database['public']['Tables']['annual_closings']['Row']>
            }
            annual_reports: {
                Row: {
                    id: string
                    company_id: string | null
                    user_id: string | null
                    year: number | null
                    status: string | null
                    data: Record<string, unknown> | null
                    created_at: string | null
                }
                Insert: Partial<Database['public']['Tables']['annual_reports']['Row']>
                Update: Partial<Database['public']['Tables']['annual_reports']['Row']>
            }
            agi_reports: {
                Row: {
                    id: string
                    company_id: string | null
                    user_id: string | null
                    period: string | null
                    status: string | null
                    data: Record<string, unknown> | null
                    created_at: string | null
                }
                Insert: Partial<Database['public']['Tables']['agi_reports']['Row']>
                Update: Partial<Database['public']['Tables']['agi_reports']['Row']>
            }
            ne_appendices: {
                Row: {
                    id: string
                    company_id: string | null
                    user_id: string | null
                    year: number | null
                    type: string | null
                    data: Record<string, unknown> | null
                    created_at: string | null
                }
                Insert: Partial<Database['public']['Tables']['ne_appendices']['Row']>
                Update: Partial<Database['public']['Tables']['ne_appendices']['Row']>
            }
            periodiseringsfonder: {
                Row: {
                    id: string
                    company_id: string | null
                    user_id: string | null
                    year: number | null
                    amount: number | null
                    reversal_year: number | null
                    status: string | null
                    created_at: string | null
                }
                Insert: Partial<Database['public']['Tables']['periodiseringsfonder']['Row']>
                Update: Partial<Database['public']['Tables']['periodiseringsfonder']['Row']>
            }
            share_holdings: {
                Row: {
                    id: string
                    company_id: string | null
                    user_id: string | null
                    security_name: string | null
                    quantity: number | null
                    purchase_price: number | null
                    current_price: number | null
                    created_at: string | null
                }
                Insert: Partial<Database['public']['Tables']['share_holdings']['Row']>
                Update: Partial<Database['public']['Tables']['share_holdings']['Row']>
            }
        }
        Views: Record<string, never>
        Functions: {
            get_inventarier_stats: {
                Args: Record<string, never>
                Returns: {
                    total_items: number
                    total_value: number
                    active_items: number
                }
            }
            get_benefit_summary: {
                Args: { target_year: number }
                Returns: Record<string, unknown>[]
            }
        }
        Enums: Record<string, never>
    }
}
