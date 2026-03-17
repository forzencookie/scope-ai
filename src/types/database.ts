export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      account_balances: {
        Row: {
          account_name: string
          account_number: string
          balance: number | null
          company_id: string
          created_at: string | null
          id: string
          period: string | null
          updated_at: string | null
          user_id: string
          year: number | null
        }
        Insert: {
          account_name: string
          account_number: string
          balance?: number | null
          company_id: string
          created_at?: string | null
          id?: string
          period?: string | null
          updated_at?: string | null
          user_id: string
          year?: number | null
        }
        Update: {
          account_name?: string
          account_number?: string
          balance?: number | null
          company_id?: string
          created_at?: string | null
          id?: string
          period?: string | null
          updated_at?: string | null
          user_id?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "account_balances_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_log: {
        Row: {
          action: string
          changes: Json | null
          company_id: string | null
          created_at: string
          entity_id: string | null
          entity_name: string | null
          entity_type: string
          id: string
          metadata: Json | null
          user_email: string | null
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          action: string
          changes?: Json | null
          company_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_name?: string | null
          entity_type: string
          id?: string
          metadata?: Json | null
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          action?: string
          changes?: Json | null
          company_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string
          id?: string
          metadata?: Json | null
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_metrics: {
        Row: {
          classification_time_ms: number | null
          company_id: string | null
          conversation_id: string | null
          created_at: string | null
          error: string | null
          error_agent: string | null
          execution_time_ms: number | null
          handoffs: string[] | null
          has_confirmation: boolean | null
          has_display: boolean | null
          has_navigation: boolean | null
          id: string
          intent: string | null
          intent_confidence: number | null
          is_multi_agent: boolean | null
          model_id: string | null
          response_length: number | null
          response_success: boolean | null
          selected_agent: string | null
          tokens_estimate: number | null
          tools_called: string[] | null
          tools_failed: number | null
          tools_succeeded: number | null
          total_time_ms: number | null
          user_id: string | null
        }
        Insert: {
          classification_time_ms?: number | null
          company_id?: string | null
          conversation_id?: string | null
          created_at?: string | null
          error?: string | null
          error_agent?: string | null
          execution_time_ms?: number | null
          handoffs?: string[] | null
          has_confirmation?: boolean | null
          has_display?: boolean | null
          has_navigation?: boolean | null
          id?: string
          intent?: string | null
          intent_confidence?: number | null
          is_multi_agent?: boolean | null
          model_id?: string | null
          response_length?: number | null
          response_success?: boolean | null
          selected_agent?: string | null
          tokens_estimate?: number | null
          tools_called?: string[] | null
          tools_failed?: number | null
          tools_succeeded?: number | null
          total_time_ms?: number | null
          user_id?: string | null
        }
        Update: {
          classification_time_ms?: number | null
          company_id?: string | null
          conversation_id?: string | null
          created_at?: string | null
          error?: string | null
          error_agent?: string | null
          execution_time_ms?: number | null
          handoffs?: string[] | null
          has_confirmation?: boolean | null
          has_display?: boolean | null
          has_navigation?: boolean | null
          id?: string
          intent?: string | null
          intent_confidence?: number | null
          is_multi_agent?: boolean | null
          model_id?: string | null
          response_length?: number | null
          response_success?: boolean | null
          selected_agent?: string | null
          tokens_estimate?: number | null
          tools_called?: string[] | null
          tools_failed?: number | null
          tools_succeeded?: number | null
          total_time_ms?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_metrics_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      agi_reports: {
        Row: {
          company_id: string | null
          created_at: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      ai_audit_log: {
        Row: {
          created_at: string | null
          error_message: string | null
          execution_time_ms: number | null
          id: string
          parameters: Json | null
          result: Json | null
          status: string | null
          tool_name: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          parameters?: Json | null
          result?: Json | null
          status?: string | null
          tool_name?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          parameters?: Json | null
          result?: Json | null
          status?: string | null
          tool_name?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_usage: {
        Row: {
          created_at: string | null
          id: string
          model_id: string | null
          period_end: string | null
          period_start: string | null
          provider: string | null
          requests_count: number | null
          tokens_used: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          model_id?: string | null
          period_end?: string | null
          period_start?: string | null
          provider?: string | null
          requests_count?: number | null
          tokens_used?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          model_id?: string | null
          period_end?: string | null
          period_start?: string | null
          provider?: string | null
          requests_count?: number | null
          tokens_used?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      annual_closings: {
        Row: {
          company_id: string | null
          created_at: string | null
          id: string
          status: string | null
          updated_at: string | null
          user_id: string | null
          year: number | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          year?: number | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "annual_closings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      annual_reports: {
        Row: {
          company_id: string | null
          created_at: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      benefits: {
        Row: {
          company_id: string | null
          created_at: string | null
          id: string
          name: string | null
          taxable_amount: number | null
          type: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          name?: string | null
          taxable_amount?: number | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          name?: string | null
          taxable_amount?: number | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "benefits_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          accounting_method: string | null
          address: string | null
          city: string | null
          company_type: string | null
          contact_person: string | null
          created_at: string | null
          email: string | null
          fiscal_year_end: string | null
          has_employees: boolean | null
          has_f_skatt: boolean | null
          has_moms_registration: boolean | null
          id: string
          is_closely_held: boolean | null
          logo_url: string | null
          name: string
          openai_thread_id: string | null
          org_number: string | null
          phone: string | null
          registration_date: string | null
          settings: Json | null
          share_capital: number | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_ends_at: string | null
          subscription_status: string | null
          subscription_tier: string | null
          total_shares: number | null
          updated_at: string | null
          user_id: string | null
          vat_frequency: string | null
          vat_number: string | null
          zip_code: string | null
        }
        Insert: {
          accounting_method?: string | null
          address?: string | null
          city?: string | null
          company_type?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          fiscal_year_end?: string | null
          has_employees?: boolean | null
          has_f_skatt?: boolean | null
          has_moms_registration?: boolean | null
          id?: string
          is_closely_held?: boolean | null
          logo_url?: string | null
          name: string
          openai_thread_id?: string | null
          org_number?: string | null
          phone?: string | null
          registration_date?: string | null
          settings?: Json | null
          share_capital?: number | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_ends_at?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          total_shares?: number | null
          updated_at?: string | null
          user_id?: string | null
          vat_frequency?: string | null
          vat_number?: string | null
          zip_code?: string | null
        }
        Update: {
          accounting_method?: string | null
          address?: string | null
          city?: string | null
          company_type?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          fiscal_year_end?: string | null
          has_employees?: boolean | null
          has_f_skatt?: boolean | null
          has_moms_registration?: boolean | null
          id?: string
          is_closely_held?: boolean | null
          logo_url?: string | null
          name?: string
          openai_thread_id?: string | null
          org_number?: string | null
          phone?: string | null
          registration_date?: string | null
          settings?: Json | null
          share_capital?: number | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_ends_at?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          total_shares?: number | null
          updated_at?: string | null
          user_id?: string | null
          vat_frequency?: string | null
          vat_number?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      company_members: {
        Row: {
          company_id: string | null
          created_at: string | null
          id: string
          role: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          role?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          role?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string | null
          id: string
          metadata: Json | null
          openai_thread_id: string | null
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          openai_thread_id?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          openai_thread_id?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      customer_invoices: {
        Row: {
          company_id: string | null
          created_at: string | null
          customer_address: string | null
          customer_email: string | null
          customer_name: string | null
          customer_org_number: string | null
          due_date: string | null
          id: string
          invoice_date: string | null
          invoice_number: string | null
          items: Json | null
          last_reminder_at: string | null
          ocr_reference: string | null
          paid_amount: number | null
          paid_at: string | null
          payment_reference: string | null
          reminder_count: number | null
          status: string | null
          subtotal: number | null
          total_amount: number | null
          updated_at: string | null
          user_id: string | null
          vat_amount: number | null
          vat_rate: number | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          customer_address?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_org_number?: string | null
          due_date?: string | null
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          items?: Json | null
          last_reminder_at?: string | null
          ocr_reference?: string | null
          paid_amount?: number | null
          paid_at?: string | null
          payment_reference?: string | null
          reminder_count?: number | null
          status?: string | null
          subtotal?: number | null
          total_amount?: number | null
          updated_at?: string | null
          user_id?: string | null
          vat_amount?: number | null
          vat_rate?: number | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          customer_address?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_org_number?: string | null
          due_date?: string | null
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          items?: Json | null
          last_reminder_at?: string | null
          ocr_reference?: string | null
          paid_amount?: number | null
          paid_at?: string | null
          payment_reference?: string | null
          reminder_count?: number | null
          status?: string | null
          subtotal?: number | null
          total_amount?: number | null
          updated_at?: string | null
          user_id?: string | null
          vat_amount?: number | null
          vat_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      dividends: {
        Row: {
          amount: number
          company_id: string | null
          created_at: string
          date: string
          id: string
          net_payout: number
          recipient_name: string | null
          status: string
          user_id: string
          verification_id: string | null
          withholding_tax: number
          year: number
        }
        Insert: {
          amount: number
          company_id?: string | null
          created_at?: string
          date: string
          id?: string
          net_payout: number
          recipient_name?: string | null
          status?: string
          user_id: string
          verification_id?: string | null
          withholding_tax: number
          year: number
        }
        Update: {
          amount?: number
          company_id?: string | null
          created_at?: string
          date?: string
          id?: string
          net_payout?: number
          recipient_name?: string | null
          status?: string
          user_id?: string
          verification_id?: string | null
          withholding_tax?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "dividends_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dividends_verification_id_fkey"
            columns: ["verification_id"]
            isOneToOne: false
            referencedRelation: "verifications"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          address: string | null
          company_id: string | null
          created_at: string | null
          email: string | null
          employment_type: string | null
          end_date: string | null
          hourly_rate: number | null
          id: string
          kommun: string | null
          monthly_salary: number | null
          name: string
          personal_number: string | null
          phone: string | null
          role: string | null
          start_date: string | null
          status: string | null
          tax_column: number | null
          tax_rate: number | null
          tax_table_number: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          company_id?: string | null
          created_at?: string | null
          email?: string | null
          employment_type?: string | null
          end_date?: string | null
          hourly_rate?: number | null
          id?: string
          kommun?: string | null
          monthly_salary?: number | null
          name: string
          personal_number?: string | null
          phone?: string | null
          role?: string | null
          start_date?: string | null
          status?: string | null
          tax_column?: number | null
          tax_rate?: number | null
          tax_table_number?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          company_id?: string | null
          created_at?: string | null
          email?: string | null
          employment_type?: string | null
          end_date?: string | null
          hourly_rate?: number | null
          id?: string
          kommun?: string | null
          monthly_salary?: number | null
          name?: string
          personal_number?: string | null
          phone?: string | null
          role?: string | null
          start_date?: string | null
          status?: string | null
          tax_column?: number | null
          tax_rate?: number | null
          tax_table_number?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          action: string | null
          actor_id: string | null
          actor_name: string | null
          actor_type: string | null
          category: Database["public"]["Enums"]["event_category"] | null
          company_id: string | null
          corporate_action_type: string | null
          created_at: string | null
          description: string | null
          hash: string | null
          id: string
          metadata: Json | null
          previous_hash: string | null
          proof: Json | null
          related_to: Json | null
          source: Database["public"]["Enums"]["event_source"] | null
          status: Database["public"]["Enums"]["event_status"] | null
          timestamp: string | null
          title: string | null
          user_id: string | null
        }
        Insert: {
          action?: string | null
          actor_id?: string | null
          actor_name?: string | null
          actor_type?: string | null
          category?: Database["public"]["Enums"]["event_category"] | null
          company_id?: string | null
          corporate_action_type?: string | null
          created_at?: string | null
          description?: string | null
          hash?: string | null
          id?: string
          metadata?: Json | null
          previous_hash?: string | null
          proof?: Json | null
          related_to?: Json | null
          source?: Database["public"]["Enums"]["event_source"] | null
          status?: Database["public"]["Enums"]["event_status"] | null
          timestamp?: string | null
          title?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string | null
          actor_id?: string | null
          actor_name?: string | null
          actor_type?: string | null
          category?: Database["public"]["Enums"]["event_category"] | null
          company_id?: string | null
          corporate_action_type?: string | null
          created_at?: string | null
          description?: string | null
          hash?: string | null
          id?: string
          metadata?: Json | null
          previous_hash?: string | null
          proof?: Json | null
          related_to?: Json | null
          source?: Database["public"]["Enums"]["event_source"] | null
          status?: Database["public"]["Enums"]["event_status"] | null
          timestamp?: string | null
          title?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_periods: {
        Row: {
          company_id: string | null
          created_at: string | null
          end_date: string | null
          id: string
          locked_at: string | null
          locked_by: string | null
          name: string | null
          reconciliation_checks: Json | null
          start_date: string | null
          status: string | null
          type: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          end_date?: string | null
          id: string
          locked_at?: string | null
          locked_by?: string | null
          name?: string | null
          reconciliation_checks?: Json | null
          start_date?: string | null
          status?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          locked_at?: string | null
          locked_by?: string | null
          name?: string | null
          reconciliation_checks?: Json | null
          start_date?: string | null
          status?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_periods_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      formaner_catalog: {
        Row: {
          bas_account: string | null
          category: string
          created_at: string | null
          description: string | null
          formansvarde_calculation: string | null
          id: string
          is_active: boolean
          max_amount: number | null
          name: string
          rules: Json | null
          tax_free: boolean
          updated_at: string | null
        }
        Insert: {
          bas_account?: string | null
          category: string
          created_at?: string | null
          description?: string | null
          formansvarde_calculation?: string | null
          id: string
          is_active?: boolean
          max_amount?: number | null
          name: string
          rules?: Json | null
          tax_free?: boolean
          updated_at?: string | null
        }
        Update: {
          bas_account?: string | null
          category?: string
          created_at?: string | null
          description?: string | null
          formansvarde_calculation?: string | null
          id?: string
          is_active?: boolean
          max_amount?: number | null
          name?: string
          rules?: Json | null
          tax_free?: boolean
          updated_at?: string | null
        }
        Relationships: []
      }
      income_declarations: {
        Row: {
          company_id: string | null
          created_at: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      integrations: {
        Row: {
          company_id: string | null
          connected: boolean | null
          connected_at: string | null
          created_at: string | null
          credentials: Json | null
          id: string
          integration_id: string | null
          last_sync_at: string | null
          metadata: Json | null
          name: string | null
          provider: string | null
          service: string | null
          settings: Json | null
          status: string | null
          sync_error: string | null
          type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company_id?: string | null
          connected?: boolean | null
          connected_at?: string | null
          created_at?: string | null
          credentials?: Json | null
          id?: string
          integration_id?: string | null
          last_sync_at?: string | null
          metadata?: Json | null
          name?: string | null
          provider?: string | null
          service?: string | null
          settings?: Json | null
          status?: string | null
          sync_error?: string | null
          type?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company_id?: string | null
          connected?: boolean | null
          connected_at?: string | null
          created_at?: string | null
          credentials?: Json | null
          id?: string
          integration_id?: string | null
          last_sync_at?: string | null
          metadata?: Json | null
          name?: string | null
          provider?: string | null
          service?: string | null
          settings?: Json | null
          status?: string | null
          sync_error?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      inventarier: {
        Row: {
          anteckningar: string | null
          avskrivningsmetod: string | null
          beskrivning: string | null
          company_id: string | null
          created_at: string | null
          fakturanummer: string | null
          forsaljningsdatum: string | null
          forsaljningspris: number | null
          id: string
          inkopsdatum: string | null
          inkopspris: number | null
          kategori: string | null
          leverantor: string | null
          livslangd_ar: number | null
          namn: string | null
          placering: string | null
          restvarde: number | null
          serienummer: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          anteckningar?: string | null
          avskrivningsmetod?: string | null
          beskrivning?: string | null
          company_id?: string | null
          created_at?: string | null
          fakturanummer?: string | null
          forsaljningsdatum?: string | null
          forsaljningspris?: number | null
          id?: string
          inkopsdatum?: string | null
          inkopspris?: number | null
          kategori?: string | null
          leverantor?: string | null
          livslangd_ar?: number | null
          namn?: string | null
          placering?: string | null
          restvarde?: number | null
          serienummer?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          anteckningar?: string | null
          avskrivningsmetod?: string | null
          beskrivning?: string | null
          company_id?: string | null
          created_at?: string | null
          fakturanummer?: string | null
          forsaljningsdatum?: string | null
          forsaljningspris?: number | null
          id?: string
          inkopsdatum?: string | null
          inkopspris?: number | null
          kategori?: string | null
          leverantor?: string | null
          livslangd_ar?: number | null
          namn?: string | null
          placering?: string | null
          restvarde?: number | null
          serienummer?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventarier_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          agenda_items: Json | null
          attendees: Json | null
          company_id: string | null
          created_at: string
          date: string
          decisions: Json | null
          id: string
          location: string | null
          signatures: Json | null
          status: string
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          agenda_items?: Json | null
          attendees?: Json | null
          company_id?: string | null
          created_at?: string
          date: string
          decisions?: Json | null
          id?: string
          location?: string | null
          signatures?: Json | null
          status?: string
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          agenda_items?: Json | null
          attendees?: Json | null
          company_id?: string | null
          created_at?: string
          date?: string
          decisions?: Json | null
          id?: string
          location?: string | null
          signatures?: Json | null
          status?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meetings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          company_id: string | null
          created_at: string | null
          email: string | null
          id: string
          join_date: string
          last_paid_year: number | null
          member_number: string | null
          membership_type: string | null
          metadata: Json | null
          name: string
          phone: string | null
          roles: string[] | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          join_date: string
          last_paid_year?: number | null
          member_number?: string | null
          membership_type?: string | null
          metadata?: Json | null
          name: string
          phone?: string | null
          roles?: string[] | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          join_date?: string
          last_paid_year?: number | null
          member_number?: string | null
          membership_type?: string | null
          metadata?: Json | null
          name?: string
          phone?: string | null
          roles?: string[] | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string | null
          conversation_id: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          role: string
          tool_calls: Json | null
          tool_results: Json | null
          user_id: string | null
        }
        Insert: {
          content?: string | null
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role: string
          tool_calls?: Json | null
          tool_results?: Json | null
          user_id?: string | null
        }
        Update: {
          content?: string | null
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role?: string
          tool_calls?: Json | null
          tool_results?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      ne_appendices: {
        Row: {
          company_id: string | null
          created_at: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      partners: {
        Row: {
          board_role: string | null
          capital_contribution: number | null
          company_id: string | null
          created_at: string | null
          current_capital_balance: number | null
          email: string | null
          id: string
          is_demo_data: boolean | null
          is_limited_liability: boolean | null
          join_date: string | null
          metadata: Json | null
          name: string
          ownership_percentage: number | null
          personal_number: string | null
          phone: string | null
          profit_share_percentage: number | null
          type: string
          user_id: string | null
        }
        Insert: {
          board_role?: string | null
          capital_contribution?: number | null
          company_id?: string | null
          created_at?: string | null
          current_capital_balance?: number | null
          email?: string | null
          id?: string
          is_demo_data?: boolean | null
          is_limited_liability?: boolean | null
          join_date?: string | null
          metadata?: Json | null
          name: string
          ownership_percentage?: number | null
          personal_number?: string | null
          phone?: string | null
          profit_share_percentage?: number | null
          type: string
          user_id?: string | null
        }
        Update: {
          board_role?: string | null
          capital_contribution?: number | null
          company_id?: string | null
          created_at?: string | null
          current_capital_balance?: number | null
          email?: string | null
          id?: string
          is_demo_data?: boolean | null
          is_limited_liability?: boolean | null
          join_date?: string | null
          metadata?: Json | null
          name?: string
          ownership_percentage?: number | null
          personal_number?: string | null
          phone?: string | null
          profit_share_percentage?: number | null
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      payslips: {
        Row: {
          benefits: Json | null
          bonuses: number | null
          company_id: string | null
          created_at: string | null
          deductions: number | null
          employee_id: string | null
          employer_contributions: number | null
          gross_salary: number | null
          id: string
          net_salary: number | null
          payment_date: string | null
          period: string | null
          status: string | null
          tax_deduction: number | null
          updated_at: string | null
          user_id: string | null
          vacation_pay: number | null
        }
        Insert: {
          benefits?: Json | null
          bonuses?: number | null
          company_id?: string | null
          created_at?: string | null
          deductions?: number | null
          employee_id?: string | null
          employer_contributions?: number | null
          gross_salary?: number | null
          id?: string
          net_salary?: number | null
          payment_date?: string | null
          period?: string | null
          status?: string | null
          tax_deduction?: number | null
          updated_at?: string | null
          user_id?: string | null
          vacation_pay?: number | null
        }
        Update: {
          benefits?: Json | null
          bonuses?: number | null
          company_id?: string | null
          created_at?: string | null
          deductions?: number | null
          employee_id?: string | null
          employer_contributions?: number | null
          gross_salary?: number | null
          id?: string
          net_salary?: number | null
          payment_date?: string | null
          period?: string | null
          status?: string | null
          tax_deduction?: number | null
          updated_at?: string | null
          user_id?: string | null
          vacation_pay?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "payslips_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payslips_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_bookings: {
        Row: {
          account_credit: string | null
          account_debit: string | null
          amount: number | null
          company_id: string | null
          created_at: string | null
          description: string | null
          id: string
          item_id: string | null
          item_type: string | null
          metadata: Json | null
          source_id: string | null
          source_type: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          account_credit?: string | null
          account_debit?: string | null
          amount?: number | null
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          item_id?: string | null
          item_type?: string | null
          metadata?: Json | null
          source_id?: string | null
          source_type?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          account_credit?: string | null
          account_debit?: string | null
          amount?: number | null
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          item_id?: string | null
          item_type?: string | null
          metadata?: Json | null
          source_id?: string | null
          source_type?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pending_bookings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      periodiseringsfonder: {
        Row: {
          amount: number
          company_id: string | null
          created_at: string | null
          dissolved_amount: number | null
          expires_at: string | null
          id: string
          notes: string | null
          remaining_amount: number | null
          status: string | null
          updated_at: string | null
          user_id: string | null
          utilized_amount: number | null
          year: number
        }
        Insert: {
          amount: number
          company_id?: string | null
          created_at?: string | null
          dissolved_amount?: number | null
          expires_at?: string | null
          id?: string
          notes?: string | null
          remaining_amount?: number | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          utilized_amount?: number | null
          year: number
        }
        Update: {
          amount?: number
          company_id?: string | null
          created_at?: string | null
          dissolved_amount?: number | null
          expires_at?: string | null
          id?: string
          notes?: string | null
          remaining_amount?: number | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          utilized_amount?: number | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "periodiseringsfonder_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_emoji: string | null
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          role: string | null
          subscription_tier: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_emoji?: string | null
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          role?: string | null
          subscription_tier?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_emoji?: string | null
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          role?: string | null
          subscription_tier?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          count: number | null
          created_at: string | null
          identifier: string
          reset_time: string | null
          updated_at: string | null
        }
        Insert: {
          count?: number | null
          created_at?: string | null
          identifier: string
          reset_time?: string | null
          updated_at?: string | null
        }
        Update: {
          count?: number | null
          created_at?: string | null
          identifier?: string
          reset_time?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      rate_limits_sliding: {
        Row: {
          created_at: string | null
          identifier: string
          last_access: string | null
          updated_at: string | null
          window_data: Json | null
        }
        Insert: {
          created_at?: string | null
          identifier: string
          last_access?: string | null
          updated_at?: string | null
          window_data?: Json | null
        }
        Update: {
          created_at?: string | null
          identifier?: string
          last_access?: string | null
          updated_at?: string | null
          window_data?: Json | null
        }
        Relationships: []
      }
      receipts: {
        Row: {
          amount: number | null
          captured_at: string | null
          category: string | null
          company_id: string | null
          created_at: string | null
          created_by: string | null
          date: string | null
          file_url: string | null
          id: string
          image_url: string | null
          metadata: Json | null
          source: string | null
          status: string | null
          supplier: string | null
          total_amount: number | null
          updated_at: string | null
          user_id: string | null
          vat_amount: number | null
        }
        Insert: {
          amount?: number | null
          captured_at?: string | null
          category?: string | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          date?: string | null
          file_url?: string | null
          id?: string
          image_url?: string | null
          metadata?: Json | null
          source?: string | null
          status?: string | null
          supplier?: string | null
          total_amount?: number | null
          updated_at?: string | null
          user_id?: string | null
          vat_amount?: number | null
        }
        Update: {
          amount?: number | null
          captured_at?: string | null
          category?: string | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          date?: string | null
          file_url?: string | null
          id?: string
          image_url?: string | null
          metadata?: Json | null
          source?: string | null
          status?: string | null
          supplier?: string | null
          total_amount?: number | null
          updated_at?: string | null
          user_id?: string | null
          vat_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "receipts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      roadmap_steps: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          order_index: number | null
          roadmap_id: string
          status: string | null
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          order_index?: number | null
          roadmap_id: string
          status?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          order_index?: number | null
          roadmap_id?: string
          status?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "roadmap_steps_roadmap_id_fkey"
            columns: ["roadmap_id"]
            isOneToOne: false
            referencedRelation: "roadmaps"
            referencedColumns: ["id"]
          },
        ]
      }
      roadmaps: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          status: string | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          status?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          status?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          company_id: string | null
          created_at: string | null
          id: string
          key: string
          scope: string | null
          updated_at: string | null
          user_id: string | null
          value: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          key: string
          scope?: string | null
          updated_at?: string | null
          user_id?: string | null
          value?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          key?: string
          scope?: string | null
          updated_at?: string | null
          user_id?: string | null
          value?: string | null
        }
        Relationships: []
      }
      share_transactions: {
        Row: {
          company_id: string | null
          created_at: string | null
          document_reference: string | null
          document_url: string | null
          from_name: string | null
          from_shareholder_id: string | null
          id: string
          notes: string | null
          price_per_share: number | null
          registration_date: string | null
          share_class: string | null
          share_count: number | null
          shares: number | null
          to_name: string | null
          to_shareholder_id: string | null
          total_amount: number | null
          total_price: number | null
          transaction_date: string | null
          transaction_type: string | null
          updated_at: string | null
          user_id: string
          verification_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          document_reference?: string | null
          document_url?: string | null
          from_name?: string | null
          from_shareholder_id?: string | null
          id?: string
          notes?: string | null
          price_per_share?: number | null
          registration_date?: string | null
          share_class?: string | null
          share_count?: number | null
          shares?: number | null
          to_name?: string | null
          to_shareholder_id?: string | null
          total_amount?: number | null
          total_price?: number | null
          transaction_date?: string | null
          transaction_type?: string | null
          updated_at?: string | null
          user_id: string
          verification_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          document_reference?: string | null
          document_url?: string | null
          from_name?: string | null
          from_shareholder_id?: string | null
          id?: string
          notes?: string | null
          price_per_share?: number | null
          registration_date?: string | null
          share_class?: string | null
          share_count?: number | null
          shares?: number | null
          to_name?: string | null
          to_shareholder_id?: string | null
          total_amount?: number | null
          total_price?: number | null
          transaction_date?: string | null
          transaction_type?: string | null
          updated_at?: string | null
          user_id?: string
          verification_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "share_transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      shareholders: {
        Row: {
          acquisition_date: string | null
          acquisition_price: number | null
          address: string | null
          board_role: string | null
          company_id: string
          created_at: string | null
          email: string | null
          id: string
          is_board_member: boolean | null
          is_demo_data: boolean | null
          metadata: Json | null
          name: string
          ownership_percentage: number | null
          personal_number: string | null
          phone: string | null
          share_class: string | null
          share_number_from: number | null
          share_number_to: number | null
          share_percentage: number | null
          shares: number | null
          ssn_org_nr: string | null
          status: string | null
          updated_at: string | null
          user_id: string
          voting_percentage: number | null
          voting_rights: number | null
        }
        Insert: {
          acquisition_date?: string | null
          acquisition_price?: number | null
          address?: string | null
          board_role?: string | null
          company_id: string
          created_at?: string | null
          email?: string | null
          id?: string
          is_board_member?: boolean | null
          is_demo_data?: boolean | null
          metadata?: Json | null
          name: string
          ownership_percentage?: number | null
          personal_number?: string | null
          phone?: string | null
          share_class?: string | null
          share_number_from?: number | null
          share_number_to?: number | null
          share_percentage?: number | null
          shares?: number | null
          ssn_org_nr?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
          voting_percentage?: number | null
          voting_rights?: number | null
        }
        Update: {
          acquisition_date?: string | null
          acquisition_price?: number | null
          address?: string | null
          board_role?: string | null
          company_id?: string
          created_at?: string | null
          email?: string | null
          id?: string
          is_board_member?: boolean | null
          is_demo_data?: boolean | null
          metadata?: Json | null
          name?: string
          ownership_percentage?: number | null
          personal_number?: string | null
          phone?: string | null
          share_class?: string | null
          share_number_from?: number | null
          share_number_to?: number | null
          share_percentage?: number | null
          shares?: number | null
          ssn_org_nr?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
          voting_percentage?: number | null
          voting_rights?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "shareholders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      shareholdings: {
        Row: {
          bas_account: string | null
          company_id: string | null
          company_name: string | null
          created_at: string | null
          current_value: number | null
          dividend_received: number | null
          holding_type: string | null
          id: string
          notes: string | null
          org_number: string | null
          purchase_date: string | null
          purchase_price: number | null
          shares_count: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          bas_account?: string | null
          company_id?: string | null
          company_name?: string | null
          created_at?: string | null
          current_value?: number | null
          dividend_received?: number | null
          holding_type?: string | null
          id?: string
          notes?: string | null
          org_number?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          shares_count?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          bas_account?: string | null
          company_id?: string | null
          company_name?: string | null
          created_at?: string | null
          current_value?: number | null
          dividend_received?: number | null
          holding_type?: string | null
          id?: string
          notes?: string | null
          org_number?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          shares_count?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shareholdings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      skv_tax_tables: {
        Row: {
          column_number: number
          id: string
          income_from: number
          income_to: number
          table_number: number
          tax_deduction: number
          year: number
        }
        Insert: {
          column_number?: number
          id?: string
          income_from: number
          income_to: number
          table_number: number
          tax_deduction: number
          year: number
        }
        Update: {
          column_number?: number
          id?: string
          income_from?: number
          income_to?: number
          table_number?: number
          tax_deduction?: number
          year?: number
        }
        Relationships: []
      }
      supplier_invoices: {
        Row: {
          amount: number | null
          category: string | null
          company_id: string | null
          created_at: string | null
          document_url: string | null
          due_date: string | null
          id: string
          invoice_number: string | null
          issue_date: string | null
          ocr: string | null
          status: string | null
          supplier_name: string | null
          total_amount: number | null
          updated_at: string | null
          user_id: string | null
          vat_amount: number | null
        }
        Insert: {
          amount?: number | null
          category?: string | null
          company_id?: string | null
          created_at?: string | null
          document_url?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          issue_date?: string | null
          ocr?: string | null
          status?: string | null
          supplier_name?: string | null
          total_amount?: number | null
          updated_at?: string | null
          user_id?: string | null
          vat_amount?: number | null
        }
        Update: {
          amount?: number | null
          category?: string | null
          company_id?: string | null
          created_at?: string | null
          document_url?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          issue_date?: string | null
          ocr?: string | null
          status?: string | null
          supplier_name?: string | null
          total_amount?: number | null
          updated_at?: string | null
          user_id?: string | null
          vat_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      system_parameters: {
        Row: {
          created_at: string | null
          description: string | null
          key: string
          updated_at: string | null
          value: Json
          year: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          key: string
          updated_at?: string | null
          value: Json
          year: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          key?: string
          updated_at?: string | null
          value?: Json
          year?: number
        }
        Relationships: []
      }
      tax_calendar: {
        Row: {
          company_id: string | null
          completed_at: string | null
          created_at: string | null
          deadline_type: string | null
          description: string | null
          due_date: string | null
          id: string
          is_recurring: boolean | null
          period: string | null
          recurrence_pattern: string | null
          reminder_date: string | null
          status: string | null
          title: string | null
          updated_at: string | null
          user_id: string | null
          year: number | null
        }
        Insert: {
          company_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          deadline_type?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_recurring?: boolean | null
          period?: string | null
          recurrence_pattern?: string | null
          reminder_date?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
          year?: number | null
        }
        Update: {
          company_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          deadline_type?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_recurring?: boolean | null
          period?: string | null
          recurrence_pattern?: string | null
          reminder_date?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tax_calendar_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_reports: {
        Row: {
          company_id: string | null
          created_at: string | null
          data: Json | null
          due_date: string | null
          end_date: string | null
          id: string
          input_vat: number | null
          net_vat: number | null
          output_vat: number | null
          period: string | null
          period_id: string | null
          report_type: string | null
          start_date: string | null
          status: string | null
          submitted_at: string | null
          updated_at: string | null
          user_id: string | null
          year: number | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          data?: Json | null
          due_date?: string | null
          end_date?: string | null
          id?: string
          input_vat?: number | null
          net_vat?: number | null
          output_vat?: number | null
          period?: string | null
          period_id?: string | null
          report_type?: string | null
          start_date?: string | null
          status?: string | null
          submitted_at?: string | null
          updated_at?: string | null
          user_id?: string | null
          year?: number | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          data?: Json | null
          due_date?: string | null
          end_date?: string | null
          id?: string
          input_vat?: number | null
          net_vat?: number | null
          output_vat?: number | null
          period?: string | null
          period_id?: string | null
          report_type?: string | null
          start_date?: string | null
          status?: string | null
          submitted_at?: string | null
          updated_at?: string | null
          user_id?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tax_reports_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tax_reports_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "financial_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          account: string | null
          ai_account: string | null
          ai_category: string | null
          ai_confidence: number | null
          ai_reasoning: string | null
          amount: string
          amount_value: number
          attachments: string[] | null
          category: string | null
          category_id: string | null
          company_id: string | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          date: string
          description: string | null
          external_id: string | null
          external_reference: string | null
          icon_color: string | null
          icon_name: string | null
          id: string
          is_demo_data: boolean | null
          merchant: string | null
          metadata: Json | null
          name: string
          receipt_id: string | null
          source: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
          vat_amount: number | null
          voucher_id: string | null
        }
        Insert: {
          account?: string | null
          ai_account?: string | null
          ai_category?: string | null
          ai_confidence?: number | null
          ai_reasoning?: string | null
          amount: string
          amount_value: number
          attachments?: string[] | null
          category?: string | null
          category_id?: string | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          date: string
          description?: string | null
          external_id?: string | null
          external_reference?: string | null
          icon_color?: string | null
          icon_name?: string | null
          id?: string
          is_demo_data?: boolean | null
          merchant?: string | null
          metadata?: Json | null
          name: string
          receipt_id?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          vat_amount?: number | null
          voucher_id?: string | null
        }
        Update: {
          account?: string | null
          ai_account?: string | null
          ai_category?: string | null
          ai_confidence?: number | null
          ai_reasoning?: string | null
          amount?: string
          amount_value?: number
          attachments?: string[] | null
          category?: string | null
          category_id?: string | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          date?: string
          description?: string | null
          external_id?: string | null
          external_reference?: string | null
          icon_color?: string | null
          icon_name?: string | null
          id?: string
          is_demo_data?: boolean | null
          merchant?: string | null
          metadata?: Json | null
          name?: string
          receipt_id?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          vat_amount?: number | null
          voucher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_credits: {
        Row: {
          created_at: string | null
          credits_purchased: number | null
          credits_remaining: number | null
          currency: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          last_refill_at: string | null
          lifetime_credits_purchased: number | null
          price_paid_cents: number | null
          purchased_at: string | null
          stripe_payment_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          credits_purchased?: number | null
          credits_remaining?: number | null
          currency?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          last_refill_at?: string | null
          lifetime_credits_purchased?: number | null
          price_paid_cents?: number | null
          purchased_at?: string | null
          stripe_payment_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          credits_purchased?: number | null
          credits_remaining?: number | null
          currency?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          last_refill_at?: string | null
          lifetime_credits_purchased?: number | null
          price_paid_cents?: number | null
          purchased_at?: string | null
          stripe_payment_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_memory: {
        Row: {
          category: string
          company_id: string
          confidence: number | null
          content: string
          created_at: string | null
          id: string
          importance: string | null
          is_superseded: boolean | null
          metadata: Json | null
          source: string | null
          source_message_id: string | null
          superseded_by: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          category: string
          company_id: string
          confidence?: number | null
          content: string
          created_at?: string | null
          id?: string
          importance?: string | null
          is_superseded?: boolean | null
          metadata?: Json | null
          source?: string | null
          source_message_id?: string | null
          superseded_by?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string
          company_id?: string
          confidence?: number | null
          content?: string
          created_at?: string | null
          id?: string
          importance?: string | null
          is_superseded?: boolean | null
          metadata?: Json | null
          source?: string | null
          source_message_id?: string | null
          superseded_by?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          company_id: string | null
          created_at: string | null
          currency: string | null
          date_format: string | null
          id: string
          language: string | null
          notification_email: boolean | null
          notification_push: boolean | null
          preferences: Json | null
          theme: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          currency?: string | null
          date_format?: string | null
          id?: string
          language?: string | null
          notification_email?: boolean | null
          notification_push?: boolean | null
          preferences?: Json | null
          theme?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          currency?: string | null
          date_format?: string | null
          id?: string
          language?: string | null
          notification_email?: boolean | null
          notification_push?: boolean | null
          preferences?: Json | null
          theme?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      vat_declarations: {
        Row: {
          company_id: string | null
          created_at: string | null
          due_date: string | null
          end_date: string | null
          id: string
          input_vat: number | null
          net_vat: number | null
          output_vat: number | null
          period: string
          period_type: string | null
          start_date: string | null
          status: string | null
          submitted_at: string | null
          updated_at: string | null
          user_id: string | null
          year: number
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          due_date?: string | null
          end_date?: string | null
          id?: string
          input_vat?: number | null
          net_vat?: number | null
          output_vat?: number | null
          period: string
          period_type?: string | null
          start_date?: string | null
          status?: string | null
          submitted_at?: string | null
          updated_at?: string | null
          user_id?: string | null
          year: number
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          due_date?: string | null
          end_date?: string | null
          id?: string
          input_vat?: number | null
          net_vat?: number | null
          output_vat?: number | null
          period?: string
          period_type?: string | null
          start_date?: string | null
          status?: string | null
          submitted_at?: string | null
          updated_at?: string | null
          user_id?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "vat_declarations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_lines: {
        Row: {
          account_name: string | null
          account_number: number
          company_id: string | null
          created_at: string | null
          credit: number | null
          debit: number | null
          description: string | null
          id: string
          user_id: string
          verification_id: string
        }
        Insert: {
          account_name?: string | null
          account_number: number
          company_id?: string | null
          created_at?: string | null
          credit?: number | null
          debit?: number | null
          description?: string | null
          id?: string
          user_id: string
          verification_id: string
        }
        Update: {
          account_name?: string | null
          account_number?: number
          company_id?: string | null
          created_at?: string | null
          credit?: number | null
          debit?: number | null
          description?: string | null
          id?: string
          user_id?: string
          verification_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_lines_verification_id_fkey"
            columns: ["verification_id"]
            isOneToOne: false
            referencedRelation: "verifications"
            referencedColumns: ["id"]
          },
        ]
      }
      verifications: {
        Row: {
          company_id: string | null
          created_at: string | null
          date: string | null
          description: string | null
          fiscal_year: number | null
          id: string
          is_locked: boolean | null
          number: number | null
          rows: Json | null
          series: string | null
          source_id: string | null
          source_type: string | null
          total_amount: number | null
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          date?: string | null
          description?: string | null
          fiscal_year?: number | null
          id?: string
          is_locked?: boolean | null
          number?: number | null
          rows?: Json | null
          series?: string | null
          source_id?: string | null
          source_type?: string | null
          total_amount?: number | null
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          date?: string | null
          description?: string | null
          fiscal_year?: number | null
          id?: string
          is_locked?: boolean | null
          number?: number | null
          rows?: Json | null
          series?: string | null
          source_id?: string | null
          source_type?: string | null
          total_amount?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "verifications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_user_credits: {
        Args: { p_amount: number; p_user_id: string }
        Returns: number
      }
      book_pending_item_status: {
        Args: {
          p_entries: Json
          p_pending_id: string
          p_source_id: string
          p_source_type: string
          p_verification_id: string
        }
        Returns: undefined
      }
      clear_demo_data: { Args: { p_user_id: string }; Returns: undefined }
      consume_user_credits: {
        Args: { p_amount: number; p_user_id: string }
        Returns: boolean
      }
      get_account_balances: {
        Args: { p_date_from: string; p_date_to: string }
        Returns: {
          account_name: string
          account_number: string
          balance: number
          credit: number
          debit: number
        }[]
      }
      get_agi_stats: { Args: { p_year?: number }; Returns: Json }
      get_benefit_stats: { Args: { target_year?: number }; Returns: Json }
      get_dashboard_counts: { Args: never; Returns: Json }
      get_employee_balances: {
        Args: never
        Returns: {
          email: string
          id: string
          name: string
          role: string
          salary: number
          status: string
        }[]
      }
      get_inventory_stats: { Args: { p_status?: string }; Returns: Json }
      get_invoice_stats: {
        Args: { p_status?: string; p_year?: number }
        Returns: Json
      }
      get_meeting_stats_v1: { Args: { p_meeting_type?: string }; Returns: Json }
      get_member_stats: { Args: never; Returns: Json }
      get_monthly_cashflow: {
        Args: { p_year: number }
        Returns: {
          expenses: number
          month: string
          result: number
          revenue: number
        }[]
      }
      get_next_verification_number: {
        Args: { p_series?: string; p_user_id: string }
        Returns: number
      }
      get_partner_stats: { Args: never; Returns: Json }
      get_payroll_stats: { Args: never; Returns: Json }
      get_receipt_stats: { Args: { p_year?: number }; Returns: Json }
      get_shareholder_stats: { Args: { p_company_id?: string }; Returns: Json }
      get_user_credits: { Args: { p_user_id: string }; Returns: number }
      get_vat_stats: { Args: { p_year?: number }; Returns: Json }
      increment_ai_usage: {
        Args: {
          p_model_id: string
          p_provider: string
          p_tokens: number
          p_user_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      event_category:
        | "bokföring"
        | "skatt"
        | "rapporter"
        | "parter"
        | "löner"
        | "dokument"
        | "system"
        | "bolagsåtgärd"
      event_source: "ai" | "user" | "system" | "document" | "authority"
      event_status:
        | "draft"
        | "pending_signature"
        | "ready_to_send"
        | "submitted"
        | "registered"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      event_category: [
        "bokföring",
        "skatt",
        "rapporter",
        "parter",
        "löner",
        "dokument",
        "system",
        "bolagsåtgärd",
      ],
      event_source: ["ai", "user", "system", "document", "authority"],
      event_status: [
        "draft",
        "pending_signature",
        "ready_to_send",
        "submitted",
        "registered",
      ],
    },
  },
} as const
