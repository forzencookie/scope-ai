export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      accountbalances: {
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
          year: number
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
          year?: number
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
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "accountbalances_company_id_fkey"
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
          created_at: string
          error: string | null
          error_agent: string | null
          execution_time_ms: number | null
          handoffs: string[] | null
          has_confirmation: boolean | null
          has_display: boolean | null
          has_navigation: boolean | null
          id: string
          intent: string
          intent_confidence: number
          is_multi_agent: boolean | null
          model_id: string | null
          response_length: number | null
          response_success: boolean | null
          selected_agent: string
          tokens_estimate: number | null
          tools_called: string[] | null
          tools_failed: number | null
          tools_succeeded: number | null
          total_time_ms: number | null
          user_id: string
        }
        Insert: {
          classification_time_ms?: number | null
          company_id?: string | null
          conversation_id?: string | null
          created_at?: string
          error?: string | null
          error_agent?: string | null
          execution_time_ms?: number | null
          handoffs?: string[] | null
          has_confirmation?: boolean | null
          has_display?: boolean | null
          has_navigation?: boolean | null
          id?: string
          intent: string
          intent_confidence?: number
          is_multi_agent?: boolean | null
          model_id?: string | null
          response_length?: number | null
          response_success?: boolean | null
          selected_agent: string
          tokens_estimate?: number | null
          tools_called?: string[] | null
          tools_failed?: number | null
          tools_succeeded?: number | null
          total_time_ms?: number | null
          user_id: string
        }
        Update: {
          classification_time_ms?: number | null
          company_id?: string | null
          conversation_id?: string | null
          created_at?: string
          error?: string | null
          error_agent?: string | null
          execution_time_ms?: number | null
          handoffs?: string[] | null
          has_confirmation?: boolean | null
          has_display?: boolean | null
          has_navigation?: boolean | null
          id?: string
          intent?: string
          intent_confidence?: number
          is_multi_agent?: boolean | null
          model_id?: string | null
          response_length?: number | null
          response_success?: boolean | null
          selected_agent?: string
          tokens_estimate?: number | null
          tools_called?: string[] | null
          tools_failed?: number | null
          tools_succeeded?: number | null
          total_time_ms?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_metrics_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_metrics_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      agireports: {
        Row: {
          company_id: string | null
          created_at: string | null
          data: Json | null
          employer_contributions: number | null
          id: string
          period: string | null
          status: string | null
          total_salary: number | null
          total_tax: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          data?: Json | null
          employer_contributions?: number | null
          id?: string
          period?: string | null
          status?: string | null
          total_salary?: number | null
          total_tax?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          data?: Json | null
          employer_contributions?: number | null
          id?: string
          period?: string | null
          status?: string | null
          total_salary?: number | null
          total_tax?: number | null
          updated_at?: string | null
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
          parameters: Json
          result: Json | null
          status: string
          tool_name: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          parameters: Json
          result?: Json | null
          status: string
          tool_name: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          parameters?: Json
          result?: Json | null
          status?: string
          tool_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      ailogs: {
        Row: {
          company_id: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      aiusage: {
        Row: {
          created_at: string
          id: string
          model_id: string
          period_end: string
          period_start: string
          provider: string
          requests_count: number
          tokens_used: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          model_id: string
          period_end: string
          period_start: string
          provider: string
          requests_count?: number
          tokens_used?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          model_id?: string
          period_end?: string
          period_start?: string
          provider?: string
          requests_count?: number
          tokens_used?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      annualclosings: {
        Row: {
          company_id: string | null
          id: string
          status: string | null
          user_id: string | null
          year: number | null
        }
        Insert: {
          company_id?: string | null
          id?: string
          status?: string | null
          user_id?: string | null
          year?: number | null
        }
        Update: {
          company_id?: string | null
          id?: string
          status?: string | null
          user_id?: string | null
          year?: number | null
        }
        Relationships: []
      }
      annualreports: {
        Row: {
          company_id: string | null
          id: string
          status: string | null
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          id?: string
          status?: string | null
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          id?: string
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      assets: {
        Row: {
          company_id: string | null
          depreciation_rate: number | null
          id: string
          purchase_value: number | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          depreciation_rate?: number | null
          id?: string
          purchase_value?: number | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          depreciation_rate?: number | null
          id?: string
          purchase_value?: number | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      bankconnections: {
        Row: {
          access_token_encrypted: string | null
          account_id: string | null
          account_type: string | null
          bank_name: string
          company_id: string
          created_at: string | null
          error_message: string | null
          id: string
          last_sync_at: string | null
          metadata: Json | null
          provider: string
          refresh_token_encrypted: string | null
          status: string | null
          token_expires_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token_encrypted?: string | null
          account_id?: string | null
          account_type?: string | null
          bank_name: string
          company_id: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          last_sync_at?: string | null
          metadata?: Json | null
          provider: string
          refresh_token_encrypted?: string | null
          status?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token_encrypted?: string | null
          account_id?: string | null
          account_type?: string | null
          bank_name?: string
          company_id?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          last_sync_at?: string | null
          metadata?: Json | null
          provider?: string
          refresh_token_encrypted?: string | null
          status?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bankconnections_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      benefits: {
        Row: {
          company_id: string | null
          created_at: string | null
          id: string
          name: string
          taxable_amount: number | null
          type: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          name: string
          taxable_amount?: number | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          name?: string
          taxable_amount?: number | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      boardminutes: {
        Row: {
          company_id: string | null
          id: string
          meeting_id: string | null
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          id?: string
          meeting_id?: string | null
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          id?: string
          meeting_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "boardminutes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boardminutes_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "companymeetings"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          id: string
          name: string
          type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      companies: {
        Row: {
          created_at: string | null
          id: string
          name: string
          org_number: string | null
          settings: Json | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_ends_at: string | null
          subscription_status: string | null
          subscription_tier: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          org_number?: string | null
          settings?: Json | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_ends_at?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          org_number?: string | null
          settings?: Json | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_ends_at?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      company_members: {
        Row: {
          company_id: string
          created_at: string
          id: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      companymeetings: {
        Row: {
          company_id: string | null
          id: string
          meeting_date: string | null
          status: string | null
          type: string | null
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          id?: string
          meeting_date?: string | null
          status?: string | null
          type?: string | null
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          id?: string
          meeting_date?: string | null
          status?: string | null
          type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string | null
          id: string
          metadata: Json | null
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      corporate_documents: {
        Row: {
          content: string | null
          created_at: string | null
          created_by: string | null
          date: string
          id: string
          metadata: Json | null
          source: string | null
          status: string | null
          title: string
          type: string
          updated_at: string | null
          version: number | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          date: string
          id?: string
          metadata?: Json | null
          source?: string | null
          status?: string | null
          title: string
          type: string
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          date?: string
          id?: string
          metadata?: Json | null
          source?: string | null
          status?: string | null
          title?: string
          type?: string
          updated_at?: string | null
          version?: number | null
        }
        Relationships: []
      }
      customerinvoices: {
        Row: {
          company_id: string
          created_at: string | null
          currency: string | null
          customer_address: string | null
          customer_email: string | null
          customer_name: string
          customer_org_number: string | null
          due_date: string
          id: string
          invoice_date: string
          invoice_number: string
          items: Json | null
          last_reminder_at: string | null
          paid_amount: number | null
          paid_at: string | null
          payment_reference: string | null
          reminder_count: number | null
          status: string | null
          subtotal: number
          total_amount: number
          updated_at: string | null
          user_id: string
          vat_amount: number | null
          vat_rate: number | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          currency?: string | null
          customer_address?: string | null
          customer_email?: string | null
          customer_name: string
          customer_org_number?: string | null
          due_date: string
          id?: string
          invoice_date: string
          invoice_number: string
          items?: Json | null
          last_reminder_at?: string | null
          paid_amount?: number | null
          paid_at?: string | null
          payment_reference?: string | null
          reminder_count?: number | null
          status?: string | null
          subtotal: number
          total_amount?: number
          updated_at?: string | null
          user_id: string
          vat_amount?: number | null
          vat_rate?: number | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          currency?: string | null
          customer_address?: string | null
          customer_email?: string | null
          customer_name?: string
          customer_org_number?: string | null
          due_date?: string
          id?: string
          invoice_date?: string
          invoice_number?: string
          items?: Json | null
          last_reminder_at?: string | null
          paid_amount?: number | null
          paid_at?: string | null
          payment_reference?: string | null
          reminder_count?: number | null
          status?: string | null
          subtotal?: number
          total_amount?: number
          updated_at?: string | null
          user_id?: string
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
          company_id: string
          created_at: string | null
          decision_date: string
          fiscal_year: number
          id: string
          meeting_id: string | null
          net_amount: number | null
          payment_date: string | null
          per_share_amount: number | null
          status: string | null
          tax_rate: number | null
          total_amount: number
          total_tax: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          decision_date: string
          fiscal_year: number
          id?: string
          meeting_id?: string | null
          net_amount?: number | null
          payment_date?: string | null
          per_share_amount?: number | null
          status?: string | null
          tax_rate?: number | null
          total_amount: number
          total_tax?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          decision_date?: string
          fiscal_year?: number
          id?: string
          meeting_id?: string | null
          net_amount?: number | null
          payment_date?: string | null
          per_share_amount?: number | null
          status?: string | null
          tax_rate?: number | null
          total_amount?: number
          total_tax?: number | null
          updated_at?: string | null
          user_id?: string
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
            foreignKeyName: "dividends_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "companymeetings"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          company_id: string
          created_at: string | null
          document_type: string | null
          entity_id: string | null
          entity_type: string | null
          extracted_data: Json | null
          extraction_status: string | null
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          name: string
          tags: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          document_type?: string | null
          entity_id?: string | null
          entity_type?: string | null
          extracted_data?: Json | null
          extraction_status?: string | null
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          name: string
          tags?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          document_type?: string | null
          entity_id?: string | null
          entity_type?: string | null
          extracted_data?: Json | null
          extraction_status?: string | null
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          name?: string
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      employeebenefits: {
        Row: {
          benefit_id: string | null
          company_id: string | null
          created_at: string | null
          employee_id: string | null
          id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          benefit_id?: string | null
          company_id?: string | null
          created_at?: string | null
          employee_id?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          benefit_id?: string | null
          company_id?: string | null
          created_at?: string | null
          employee_id?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employeebenefits_benefit_id_fkey"
            columns: ["benefit_id"]
            isOneToOne: false
            referencedRelation: "benefits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employeebenefits_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          company_id: string | null
          created_at: string | null
          id: string
          monthly_salary: number
          name: string
          role: string | null
          start_date: string | null
          status: string
          tax_rate: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          monthly_salary?: number
          name: string
          role?: string | null
          start_date?: string | null
          status?: string
          tax_rate?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          monthly_salary?: number
          name?: string
          role?: string | null
          start_date?: string | null
          status?: string
          tax_rate?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          action: string
          actor_id: string | null
          actor_name: string | null
          actor_type: string
          category: Database["public"]["Enums"]["event_category"]
          company_id: string | null
          corporate_action_type: string | null
          created_at: string
          description: string | null
          hash: string | null
          id: string
          metadata: Json | null
          previous_hash: string | null
          proof: Json | null
          related_to: Json | null
          source: Database["public"]["Enums"]["event_source"]
          status: Database["public"]["Enums"]["event_status"] | null
          timestamp: string
          title: string
          user_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_name?: string | null
          actor_type: string
          category: Database["public"]["Enums"]["event_category"]
          company_id?: string | null
          corporate_action_type?: string | null
          created_at?: string
          description?: string | null
          hash?: string | null
          id?: string
          metadata?: Json | null
          previous_hash?: string | null
          proof?: Json | null
          related_to?: Json | null
          source: Database["public"]["Enums"]["event_source"]
          status?: Database["public"]["Enums"]["event_status"] | null
          timestamp?: string
          title: string
          user_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_name?: string | null
          actor_type?: string
          category?: Database["public"]["Enums"]["event_category"]
          company_id?: string | null
          corporate_action_type?: string | null
          created_at?: string
          description?: string | null
          hash?: string | null
          id?: string
          metadata?: Json | null
          previous_hash?: string | null
          proof?: Json | null
          related_to?: Json | null
          source?: Database["public"]["Enums"]["event_source"]
          status?: Database["public"]["Enums"]["event_status"] | null
          timestamp?: string
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      financialperiods: {
        Row: {
          company_id: string | null
          created_at: string | null
          end_date: string
          id: string
          locked_at: string | null
          locked_by: string | null
          name: string
          reconciliation_checks: Json | null
          start_date: string
          status: string | null
          type: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          end_date: string
          id: string
          locked_at?: string | null
          locked_by?: string | null
          name: string
          reconciliation_checks?: Json | null
          start_date: string
          status?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          end_date?: string
          id?: string
          locked_at?: string | null
          locked_by?: string | null
          name?: string
          reconciliation_checks?: Json | null
          start_date?: string
          status?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      inboxitems: {
        Row: {
          company_id: string | null
          id: string
          user_id: string | null
          read: boolean | null
        }
        Insert: {
          company_id?: string | null
          id?: string
          user_id?: string | null
          read?: boolean | null
        }
        Update: {
          company_id?: string | null
          id?: string
          user_id?: string | null
          read?: boolean | null
        }
        Relationships: []
      }
      incomedeclarations: {
        Row: {
          company_id: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      integrations: {
        Row: {
          connected: boolean
          connected_at: string | null
          created_at: string
          id: string
          integration_id: string
          metadata: Json | null
          service: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          connected?: boolean
          connected_at?: string | null
          created_at?: string
          id?: string
          integration_id: string
          metadata?: Json | null
          service?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          connected?: boolean
          connected_at?: string | null
          created_at?: string
          id?: string
          integration_id?: string
          metadata?: Json | null
          service?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      inventarier: {
        Row: {
          anteckningar: string | null
          avskrivningsmetod: string | null
          beskrivning: string | null
          created_at: string
          fakturanummer: string | null
          forsaljningsdatum: string | null
          forsaljningspris: number | null
          id: string
          inkopsdatum: string
          inkopspris: number
          kategori: string
          leverantor: string | null
          livslangd_ar: number
          namn: string
          placering: string | null
          restvarde: number | null
          serienummer: string | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          anteckningar?: string | null
          avskrivningsmetod?: string | null
          beskrivning?: string | null
          created_at?: string
          fakturanummer?: string | null
          forsaljningsdatum?: string | null
          forsaljningspris?: number | null
          id?: string
          inkopsdatum: string
          inkopspris: number
          kategori?: string
          leverantor?: string | null
          livslangd_ar?: number
          namn: string
          placering?: string | null
          restvarde?: number | null
          serienummer?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          anteckningar?: string | null
          avskrivningsmetod?: string | null
          beskrivning?: string | null
          created_at?: string
          fakturanummer?: string | null
          forsaljningsdatum?: string | null
          forsaljningspris?: number | null
          id?: string
          inkopsdatum?: string
          inkopspris?: number
          kategori?: string
          leverantor?: string | null
          livslangd_ar?: number
          namn?: string
          placering?: string | null
          restvarde?: number | null
          serienummer?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount: number
          company_id: string | null
          created_at: string | null
          created_by: string | null
          customer_name: string | null
          due_date: string
          id: string
          invoice_number: string | null
          issue_date: string
          metadata: Json | null
          source: string | null
          status: string | null
          total_amount: number | null
          updated_at: string | null
          user_id: string | null
          vat_amount: number | null
        }
        Insert: {
          amount: number
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_name?: string | null
          due_date: string
          id: string
          invoice_number?: string | null
          issue_date: string
          metadata?: Json | null
          source?: string | null
          status?: string | null
          total_amount?: number | null
          updated_at?: string | null
          user_id?: string | null
          vat_amount?: number | null
        }
        Update: {
          amount?: number
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_name?: string | null
          due_date?: string
          id?: string
          invoice_number?: string | null
          issue_date?: string
          metadata?: Json | null
          source?: string | null
          status?: string | null
          total_amount?: number | null
          updated_at?: string | null
          user_id?: string | null
          vat_amount?: number | null
        }
        Relationships: []
      }
      k10declarations: {
        Row: {
          company_id: string | null
          fiscal_year: number | null
          id: string
          shareholder_id: string | null
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          fiscal_year?: number | null
          id?: string
          shareholder_id?: string | null
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          fiscal_year?: number | null
          id?: string
          shareholder_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "k10declarations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "k10declarations_shareholder_id_fkey"
            columns: ["shareholder_id"]
            isOneToOne: false
            referencedRelation: "shareholders"
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
          membership_type: string
          metadata: Json | null
          name: string
          phone: string | null
          roles: string[] | null
          status: string
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
          membership_type?: string
          metadata?: Json | null
          name: string
          phone?: string | null
          roles?: string[] | null
          status?: string
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
          membership_type?: string
          metadata?: Json | null
          name?: string
          phone?: string | null
          roles?: string[] | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      neappendices: {
        Row: {
          company_id: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          expires_at: string | null
          id: string
          is_read: boolean | null
          message: string
          read_at: string | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          read_at?: string | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          read_at?: string | null
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      partners: {
        Row: {
          capital_contribution: number | null
          company_id: string | null
          created_at: string | null
          current_capital_balance: number | null
          id: string
          is_limited_liability: boolean | null
          join_date: string | null
          metadata: Json | null
          name: string
          ownership_percentage: number | null
          personal_number: string | null
          profit_share_percentage: number | null
          type: string
          user_id: string | null
        }
        Insert: {
          capital_contribution?: number | null
          company_id?: string | null
          created_at?: string | null
          current_capital_balance?: number | null
          id?: string
          is_limited_liability?: boolean | null
          join_date?: string | null
          metadata?: Json | null
          name: string
          ownership_percentage?: number | null
          personal_number?: string | null
          profit_share_percentage?: number | null
          type: string
          user_id?: string | null
        }
        Update: {
          capital_contribution?: number | null
          company_id?: string | null
          created_at?: string | null
          current_capital_balance?: number | null
          id?: string
          is_limited_liability?: boolean | null
          join_date?: string | null
          metadata?: Json | null
          name?: string
          ownership_percentage?: number | null
          personal_number?: string | null
          profit_share_percentage?: number | null
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partners_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      payslips: {
        Row: {
          bonuses: number | null
          company_id: string | null
          created_at: string | null
          deductions: number | null
          employee_id: string | null
          gross_salary: number
          id: string
          net_salary: number
          payment_date: string | null
          period: string
          status: string
          tax_deduction: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          bonuses?: number | null
          company_id?: string | null
          created_at?: string | null
          deductions?: number | null
          employee_id?: string | null
          gross_salary?: number
          id: string
          net_salary?: number
          payment_date?: string | null
          period: string
          status?: string
          tax_deduction: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          bonuses?: number | null
          company_id?: string | null
          created_at?: string | null
          deductions?: number | null
          employee_id?: string | null
          gross_salary?: number
          id?: string
          net_salary?: number
          payment_date?: string | null
          period?: string
          status?: string
          tax_deduction?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payslips_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          subscription_tier: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          subscription_tier?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          subscription_tier?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ratelimits: {
        Row: {
          count: number
          created_at: string | null
          identifier: string
          reset_time: string
          updated_at: string | null
        }
        Insert: {
          count?: number
          created_at?: string | null
          identifier: string
          reset_time: string
          updated_at?: string | null
        }
        Update: {
          count?: number
          created_at?: string | null
          identifier?: string
          reset_time?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ratelimitssliding: {
        Row: {
          created_at: string
          identifier: string
          last_access: string
          updated_at: string
          window_data: Json
        }
        Insert: {
          created_at?: string
          identifier: string
          last_access?: string
          updated_at?: string
          window_data?: Json
        }
        Update: {
          created_at?: string
          identifier?: string
          last_access?: string
          updated_at?: string
          window_data?: Json
        }
        Relationships: []
      }
      receipts: {
        Row: {
          amount: number
          category: string | null
          company_id: string | null
          created_at: string | null
          created_by: string | null
          date: string
          id: string
          image_url: string | null
          metadata: Json | null
          source: string | null
          status: string | null
          supplier: string | null
          total_amount: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          category?: string | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          date: string
          id: string
          image_url?: string | null
          metadata?: Json | null
          source?: string | null
          status?: string | null
          supplier?: string | null
          total_amount?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          category?: string | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          date?: string
          id?: string
          image_url?: string | null
          metadata?: Json | null
          source?: string | null
          status?: string | null
          supplier?: string | null
          total_amount?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      roadmap_steps: {
        Row: {
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          order_index: number
          roadmap_id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          order_index: number
          roadmap_id: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          order_index?: number
          roadmap_id?: string
          status?: string
          title?: string
          updated_at?: string
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
          created_at: string
          description: string | null
          id: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      securityauditlog: {
        Row: {
          allowed_resource: string | null
          created_at: string
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          requested_resource: string | null
          user_agent: string | null
          user_id: string | null
          user_tier: string | null
        }
        Insert: {
          allowed_resource?: string | null
          created_at?: string
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          requested_resource?: string | null
          user_agent?: string | null
          user_id?: string | null
          user_tier?: string | null
        }
        Update: {
          allowed_resource?: string | null
          created_at?: string
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          requested_resource?: string | null
          user_agent?: string | null
          user_id?: string | null
          user_tier?: string | null
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
          user_id: string
          value: Json
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          key: string
          scope?: string | null
          updated_at?: string | null
          user_id: string
          value: Json
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          key?: string
          scope?: string | null
          updated_at?: string | null
          user_id?: string
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      share_transactions: {
        Row: {
          created_at: string
          document_url: string | null
          from_name: string | null
          from_shareholder_id: string | null
          id: string
          notes: string | null
          price_per_share: number | null
          share_class: string | null
          shares: number
          to_name: string | null
          to_shareholder_id: string | null
          total_price: number | null
          transaction_date: string
          transaction_type: string
          updated_at: string
          user_id: string
          verification_id: string | null
        }
        Insert: {
          created_at?: string
          document_url?: string | null
          from_name?: string | null
          from_shareholder_id?: string | null
          id?: string
          notes?: string | null
          price_per_share?: number | null
          share_class?: string | null
          shares: number
          to_name?: string | null
          to_shareholder_id?: string | null
          total_price?: number | null
          transaction_date: string
          transaction_type: string
          updated_at?: string
          user_id: string
          verification_id?: string | null
        }
        Update: {
          created_at?: string
          document_url?: string | null
          from_name?: string | null
          from_shareholder_id?: string | null
          id?: string
          notes?: string | null
          price_per_share?: number | null
          share_class?: string | null
          shares?: number
          to_name?: string | null
          to_shareholder_id?: string | null
          total_price?: number | null
          transaction_date?: string
          transaction_type?: string
          updated_at?: string
          user_id?: string
          verification_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "share_transactions_from_shareholder_id_fkey"
            columns: ["from_shareholder_id"]
            isOneToOne: false
            referencedRelation: "shareholders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "share_transactions_to_shareholder_id_fkey"
            columns: ["to_shareholder_id"]
            isOneToOne: false
            referencedRelation: "shareholders"
            referencedColumns: ["id"]
          },
        ]
      }
      shareholders: {
        Row: {
          company_id: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          name: string
          share_percentage: number | null
          shares: number
          ssn_org_nr: string | null
          updated_at: string | null
          user_id: string | null
          voting_power: number | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          name: string
          share_percentage?: number | null
          shares?: number
          ssn_org_nr?: string | null
          updated_at?: string | null
          user_id?: string | null
          voting_power?: number | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          share_percentage?: number | null
          shares?: number
          ssn_org_nr?: string | null
          updated_at?: string | null
          user_id?: string | null
          voting_power?: number | null
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
      sharetransactions: {
        Row: {
          company_id: string
          created_at: string | null
          document_reference: string | null
          from_shareholder_id: string | null
          id: string
          notes: string | null
          price_per_share: number | null
          registration_date: string | null
          share_count: number
          to_shareholder_id: string | null
          total_amount: number | null
          transaction_date: string
          transaction_type: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          document_reference?: string | null
          from_shareholder_id?: string | null
          id?: string
          notes?: string | null
          price_per_share?: number | null
          registration_date?: string | null
          share_count: number
          to_shareholder_id?: string | null
          total_amount?: number | null
          transaction_date: string
          transaction_type: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          document_reference?: string | null
          from_shareholder_id?: string | null
          id?: string
          notes?: string | null
          price_per_share?: number | null
          registration_date?: string | null
          share_count?: number
          to_shareholder_id?: string | null
          total_amount?: number | null
          transaction_date?: string
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sharetransactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sharetransactions_from_shareholder_id_fkey"
            columns: ["from_shareholder_id"]
            isOneToOne: false
            referencedRelation: "shareholders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sharetransactions_to_shareholder_id_fkey"
            columns: ["to_shareholder_id"]
            isOneToOne: false
            referencedRelation: "shareholders"
            referencedColumns: ["id"]
          },
        ]
      }
      supplierinvoices: {
        Row: {
          amount: number | null
          company_id: string | null
          created_at: string | null
          due_date: string | null
          id: string
          ocr: string | null
          status: string | null
          supplier_name: string | null
          updated_at: string | null
          user_id: string | null
          invoice_number: string | null
          vat_amount: number | null
          total_amount: number | null
          issue_date: string | null
        }
        Insert: {
          amount?: number | null
          company_id?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          ocr?: string | null
          status?: string | null
          supplier_name?: string | null
          updated_at?: string | null
          user_id?: string | null
          invoice_number?: string | null
          vat_amount?: number | null
          total_amount?: number | null
          issue_date?: string | null
        }
        Update: {
          amount?: number | null
          company_id?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          ocr?: string | null
          status?: string | null
          supplier_name?: string | null
          updated_at?: string | null
          user_id?: string | null
          invoice_number?: string | null
          vat_amount?: number | null
          total_amount?: number | null
          issue_date?: string | null
        }
        Relationships: []
      }
      taxcalendar: {
        Row: {
          company_id: string
          completed_at: string | null
          created_at: string | null
          deadline_type: string
          description: string | null
          due_date: string
          id: string
          is_recurring: boolean | null
          period: string | null
          recurrence_pattern: string | null
          reminder_date: string | null
          status: string | null
          title: string
          user_id: string
          year: number | null
        }
        Insert: {
          company_id: string
          completed_at?: string | null
          created_at?: string | null
          deadline_type: string
          description?: string | null
          due_date: string
          id?: string
          is_recurring?: boolean | null
          period?: string | null
          recurrence_pattern?: string | null
          reminder_date?: string | null
          status?: string | null
          title: string
          user_id: string
          year?: number | null
        }
        Update: {
          company_id?: string
          completed_at?: string | null
          created_at?: string | null
          deadline_type?: string
          description?: string | null
          due_date?: string
          id?: string
          is_recurring?: boolean | null
          period?: string | null
          recurrence_pattern?: string | null
          reminder_date?: string | null
          status?: string | null
          title?: string
          user_id?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "taxcalendar_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      taxreports: {
        Row: {
          company_id: string | null
          created_at: string | null
          data: Json | null
          generated_at: string | null
          id: string
          period_id: string | null
          status: string | null
          type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          data?: Json | null
          generated_at?: string | null
          id?: string
          period_id?: string | null
          status?: string | null
          type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          data?: Json | null
          generated_at?: string | null
          id?: string
          period_id?: string | null
          status?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tax_reports_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "financialperiods"
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
          booked_at: string | null
          booked_by: string | null
          category: string | null
          company_id: string | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          date: string
          description: string | null
          external_id: string | null
          icon_color: string | null
          icon_name: string | null
          id: string
          name: string
          receipt_id: string | null
          source: string | null
          status: string
          metadata: Json | null
          timestamp: string
          updated_at: string | null
          user_id: string | null
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
          booked_at?: string | null
          booked_by?: string | null
          category?: string | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          date: string
          description?: string | null
          external_id?: string | null
          icon_color?: string | null
          icon_name?: string | null
          id: string
          name: string
          receipt_id?: string | null
          source?: string | null
          status?: string
          metadata?: Json | null
          timestamp?: string
          updated_at?: string | null
          user_id?: string | null
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
          booked_at?: string | null
          booked_by?: string | null
          category?: string | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          date?: string
          description?: string | null
          external_id?: string | null
          icon_color?: string | null
          icon_name?: string | null
          id?: string
          name?: string
          receipt_id?: string | null
          source?: string | null
          status?: string
          metadata?: Json | null
          timestamp?: string
          updated_at?: string | null
          user_id?: string | null
          voucher_id?: string | null
        }
        Relationships: []
      }
      vatdeclarations: {
        Row: {
          company_id: string | null
          created_at: string | null
          data: Json | null
          id: string
          period: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          data?: Json | null
          id?: string
          period?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          data?: Json | null
          id?: string
          period?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      verifications: {
        Row: {
          company_id: string | null
          date: string | null
          description: string | null
          id: string
          user_id: string | null
          rows: Json | null
        }
        Insert: {
          company_id?: string | null
          date?: string | null
          description?: string | null
          id?: string
          user_id?: string | null
          rows?: Json | null
        }
        Update: {
          company_id?: string | null
          date?: string | null
          description?: string | null
          id?: string
          user_id?: string | null
          rows?: Json | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          id: string
          created_at: string | null
          conversation_id: string
          role: string
          content: string
          tool_calls: Json | null
          tool_results: Json | null
          user_id: string
        }
        Insert: {
          id?: string
          created_at?: string | null
          conversation_id: string
          role: string
          content: string
          tool_calls?: Json | null
          tool_results?: Json | null
          user_id: string
        }
        Update: {
          id?: string
          created_at?: string | null
          conversation_id?: string
          role?: string
          content?: string
          tool_calls?: Json | null
          tool_results?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      tax_reports: {
        Row: {
          id: string
          user_id: string | null
          period_id: string | null
          report_type: string
          data: Json | null
          status: string
          period_start: string | null
          period_end: string | null
          generated_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          period_id?: string | null
          report_type?: string
          data?: Json | null
          status?: string
          period_start?: string | null
          period_end?: string | null
          generated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          period_id?: string | null
          report_type?: string
          data?: Json | null
          status?: string
          period_start?: string | null
          period_end?: string | null
          generated_at?: string | null
        }
        Relationships: []
      }
      companymembers: {
        Row: {
          id: string
          company_id: string
          user_id: string
          role: string
          created_at: string | null
        }
        Insert: {
          id?: string
          company_id: string
          user_id: string
          role: string
          created_at?: string | null
        }
        Update: {
          id?: string
          company_id?: string
          user_id?: string
          role?: string
          created_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_rate_limit_atomic: {
        Args: {
          p_identifier: string
          p_max_requests: number
          p_window_ms: number
        }
        Returns: Json
      }
      check_rls_status: {
        Args: never
        Returns: {
          has_rls: boolean
          has_user_id: boolean
          policy_count: number
          table_name: string
        }[]
      }
      cleanup_old_rate_limits_sliding: {
        Args: { max_age_minutes?: number }
        Returns: number
      }
      get_account_balances: {
        Args: { date_from: string; date_to: string }
        Returns: {
          account: string
          balance: number
        }[]
      }
      get_agi_stats: { Args: { p_year?: number }; Returns: Json }
      get_benefit_stats: { Args: { target_year?: number }; Returns: Json }
      get_dashboard_counts: { Args: never; Returns: Json }
      get_employee_balances: {
        Args: never
        Returns: {
          balance: number
          email: string
          id: string
          mileage: number
          name: string
          role: string
          salary: number
          status: string
        }[]
      }
      get_inventory_stats: {
        Args: never
        Returns: {
          active_items: number
          total_items: number
          total_value: number
        }[]
      }
      get_invoice_stats:
        | {
            Args: never
            Returns: {
              overdue_count: number
              paid_amount: number
              total_amount: number
              total_invoices: number
            }[]
          }
        | {
            Args: { p_user_id?: string }
            Returns: {
              draft_invoices: number
              outstanding_amount: number
              overdue_invoices: number
              paid_amount: number
              paid_invoices: number
              sent_invoices: number
              total_amount: number
              total_invoices: number
            }[]
          }
      get_invoice_stats_v1: { Args: never; Returns: Json }
      get_meeting_stats: {
        Args: { p_user_id?: string }
        Returns: {
          held_meetings: number
          scheduled_meetings: number
          total_meetings: number
          upcoming_meetings: number
        }[]
      }
      get_meeting_stats_v1: { Args: { p_meeting_type?: string }; Returns: Json }
      get_meeting_stats_v2: { Args: { p_meeting_type?: string }; Returns: Json }
      get_member_stats: { Args: never; Returns: Json }
      get_monthly_cashflow: {
        Args: { p_year?: number }
        Returns: {
          expenses: number
          month: string
          result: number
          revenue: number
        }[]
      }
      get_or_create_monthly_usage: {
        Args: { p_model_id: string; p_provider: string; p_user_id: string }
        Returns: string
      }
      get_partner_stats: { Args: never; Returns: Json }
      get_payroll_stats: { Args: never; Returns: Json }
      get_receipt_stats: {
        Args: never
        Returns: {
          pending_receipts: number
          processed_receipts: number
          total_receipts: number
        }[]
      }
      get_shareholder_stats:
        | {
            Args: { p_company_id?: string }
            Returns: {
              total_shareholders: number
              total_shares: number
              unique_shareholders: number
            }[]
          }
        | {
            Args: { p_user_id?: string }
            Returns: {
              avg_ownership: number
              total_companies: number
              total_shareholders: number
              total_shares: number
            }[]
          }
      get_shareholder_stats_v1: {
        Args: { p_company_id: string }
        Returns: Json
      }
      get_transaction_stats: {
        Args: never
        Returns: {
          pending_count: number
          total_expenses: number
          total_income: number
          total_transactions: number
        }[]
      }
      get_vat_stats: { Args: { p_year?: number }; Returns: Json }
      increment_ai_usage: {
        Args: {
          p_model_id: string
          p_provider: string
          p_tokens?: number
          p_user_id: string
        }
        Returns: undefined
      }
      verify_rls_status: {
        Args: never
        Returns: {
          has_policies: boolean
          policy_count: number
          rls_enabled: boolean
          table_name: string
        }[]
      }
      verify_security_setup: {
        Args: never
        Returns: {
          has_user_id: boolean
          policy_count: number
          rls_enabled: boolean
          status: string
          table_name: string
        }[]
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
      user_role: "user" | "admin" | "owner"
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
  graphql_public: {
    Enums: {},
  },
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
      user_role: ["user", "admin", "owner"],
    },
  },
} as const

