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
      agireports: {
        Row: {
          created_at: string | null
          due_date: string
          employee_count: number | null
          employer_contributions: number | null
          id: string
          month: number
          period: string
          status: string | null
          submitted_at: string | null
          total_salary: number | null
          total_tax: number | null
          updated_at: string | null
          user_id: string
          year: number
        }
        Insert: {
          created_at?: string | null
          due_date: string
          employee_count?: number | null
          employer_contributions?: number | null
          id?: string
          month: number
          period: string
          status?: string | null
          submitted_at?: string | null
          total_salary?: number | null
          total_tax?: number | null
          updated_at?: string | null
          user_id: string
          year: number
        }
        Update: {
          created_at?: string | null
          due_date?: string
          employee_count?: number | null
          employer_contributions?: number | null
          id?: string
          month?: number
          period?: string
          status?: string | null
          submitted_at?: string | null
          total_salary?: number | null
          total_tax?: number | null
          updated_at?: string | null
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      ailogs: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          latency_ms: number | null
          model: string
          outcome: string | null
          prompt: string | null
          response: Json | null
          tokens_used: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          latency_ms?: number | null
          model: string
          outcome?: string | null
          prompt?: string | null
          response?: Json | null
          tokens_used?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          latency_ms?: number | null
          model?: string
          outcome?: string | null
          prompt?: string | null
          response?: Json | null
          tokens_used?: number | null
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
          completed_at: string | null
          created_at: string | null
          fiscal_year: number
          fiscal_year_end: string | null
          fiscal_year_start: string | null
          id: string
          net_profit: number | null
          status: string | null
          total_assets: number | null
          total_equity: number | null
          total_expenses: number | null
          total_liabilities: number | null
          total_revenue: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          fiscal_year: number
          fiscal_year_end?: string | null
          fiscal_year_start?: string | null
          id?: string
          net_profit?: number | null
          status?: string | null
          total_assets?: number | null
          total_equity?: number | null
          total_expenses?: number | null
          total_liabilities?: number | null
          total_revenue?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          fiscal_year?: number
          fiscal_year_end?: string | null
          fiscal_year_start?: string | null
          id?: string
          net_profit?: number | null
          status?: string | null
          total_assets?: number | null
          total_equity?: number | null
          total_expenses?: number | null
          total_liabilities?: number | null
          total_revenue?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      annualreports: {
        Row: {
          approved_at: string | null
          auditor_report: string | null
          bolagsverket_reference: string | null
          company_name: string | null
          created_at: string | null
          directors_report: string | null
          fiscal_year: number
          id: string
          org_number: string | null
          report_sections: Json | null
          status: string | null
          submitted_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          auditor_report?: string | null
          bolagsverket_reference?: string | null
          company_name?: string | null
          created_at?: string | null
          directors_report?: string | null
          fiscal_year: number
          id?: string
          org_number?: string | null
          report_sections?: Json | null
          status?: string | null
          submitted_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          approved_at?: string | null
          auditor_report?: string | null
          bolagsverket_reference?: string | null
          company_name?: string | null
          created_at?: string | null
          directors_report?: string | null
          fiscal_year?: number
          id?: string
          org_number?: string | null
          report_sections?: Json | null
          status?: string | null
          submitted_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      assets: {
        Row: {
          category: string | null
          created_at: string | null
          current_value: number | null
          depreciation_method: string | null
          depreciation_rate: number | null
          description: string | null
          disposed_date: string | null
          disposed_value: number | null
          id: string
          location: string | null
          name: string
          purchase_date: string
          purchase_value: number
          serial_number: string | null
          status: string | null
          updated_at: string | null
          useful_life_years: number | null
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          current_value?: number | null
          depreciation_method?: string | null
          depreciation_rate?: number | null
          description?: string | null
          disposed_date?: string | null
          disposed_value?: number | null
          id?: string
          location?: string | null
          name: string
          purchase_date: string
          purchase_value: number
          serial_number?: string | null
          status?: string | null
          updated_at?: string | null
          useful_life_years?: number | null
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          current_value?: number | null
          depreciation_method?: string | null
          depreciation_rate?: number | null
          description?: string | null
          disposed_date?: string | null
          disposed_value?: number | null
          id?: string
          location?: string | null
          name?: string
          purchase_date?: string
          purchase_value?: number
          serial_number?: string | null
          status?: string | null
          updated_at?: string | null
          useful_life_years?: number | null
          user_id?: string
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
          category: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_taxable: boolean | null
          name: string
          provider: string | null
          tax_value: number | null
          updated_at: string | null
          user_id: string
          value_per_month: number | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_taxable?: boolean | null
          name: string
          provider?: string | null
          tax_value?: number | null
          updated_at?: string | null
          user_id: string
          value_per_month?: number | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_taxable?: boolean | null
          name?: string
          provider?: string | null
          tax_value?: number | null
          updated_at?: string | null
          user_id?: string
          value_per_month?: number | null
        }
        Relationships: []
      }
      boardminutes: {
        Row: {
          agenda_items: Json | null
          attachments: Json | null
          attendees: Json | null
          chairman: string | null
          company_id: string
          created_at: string | null
          decisions: Json | null
          id: string
          meeting_date: string
          meeting_id: string | null
          notes: string | null
          protocol_number: string | null
          secretary: string | null
          signed_at: string | null
          status: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          agenda_items?: Json | null
          attachments?: Json | null
          attendees?: Json | null
          chairman?: string | null
          company_id: string
          created_at?: string | null
          decisions?: Json | null
          id?: string
          meeting_date: string
          meeting_id?: string | null
          notes?: string | null
          protocol_number?: string | null
          secretary?: string | null
          signed_at?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          agenda_items?: Json | null
          attachments?: Json | null
          attendees?: Json | null
          chairman?: string | null
          company_id?: string
          created_at?: string | null
          decisions?: Json | null
          id?: string
          meeting_date?: string
          meeting_id?: string | null
          notes?: string | null
          protocol_number?: string | null
          secretary?: string | null
          signed_at?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "board_minutes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_minutes_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "companymeetings"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          name: string
          parent_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          name: string
          parent_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          parent_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string | null
          id: string
          name: string
          org_number: string | null
          settings: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          org_number?: string | null
          settings?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          org_number?: string | null
          settings?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      companymeetings: {
        Row: {
          agenda: string | null
          attendees: Json | null
          company_id: string
          created_at: string | null
          deadline_proposals: string | null
          decisions: Json | null
          id: string
          is_digital: boolean | null
          location: string | null
          meeting_date: string
          meeting_link: string | null
          meeting_time: string | null
          meeting_type: string
          minutes: string | null
          notice_sent_at: string | null
          status: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          agenda?: string | null
          attendees?: Json | null
          company_id: string
          created_at?: string | null
          deadline_proposals?: string | null
          decisions?: Json | null
          id?: string
          is_digital?: boolean | null
          location?: string | null
          meeting_date: string
          meeting_link?: string | null
          meeting_time?: string | null
          meeting_type: string
          minutes?: string | null
          notice_sent_at?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          agenda?: string | null
          attendees?: Json | null
          company_id?: string
          created_at?: string | null
          deadline_proposals?: string | null
          decisions?: Json | null
          id?: string
          is_digital?: boolean | null
          location?: string | null
          meeting_date?: string
          meeting_link?: string | null
          meeting_time?: string | null
          meeting_type?: string
          minutes?: string | null
          notice_sent_at?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_meetings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
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
          total_amount: number
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
          created_at: string | null
          employee_id: string | null
          end_date: string | null
          id: string
          start_date: string | null
          user_id: string | null
        }
        Insert: {
          benefit_id?: string | null
          created_at?: string | null
          employee_id?: string | null
          end_date?: string | null
          id?: string
          start_date?: string | null
          user_id?: string | null
        }
        Update: {
          benefit_id?: string | null
          created_at?: string | null
          employee_id?: string | null
          end_date?: string | null
          id?: string
          start_date?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_benefits_benefit_id_fkey"
            columns: ["benefit_id"]
            isOneToOne: false
            referencedRelation: "benefits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_benefits_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          monthly_salary: number
          name: string
          personal_number: string | null
          role: string | null
          start_date: string | null
          status: string | null
          tax_table: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          monthly_salary?: number
          name: string
          personal_number?: string | null
          role?: string | null
          start_date?: string | null
          status?: string | null
          tax_table?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          monthly_salary?: number
          name?: string
          personal_number?: string | null
          role?: string | null
          start_date?: string | null
          status?: string | null
          tax_table?: number | null
          updated_at?: string | null
          user_id?: string
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
          ai_status: string | null
          ai_suggestion: string | null
          category: string | null
          created_at: string | null
          date: string | null
          description: string | null
          document_data: Json | null
          id: string
          linked_entity_id: string | null
          linked_entity_type: string | null
          read: boolean | null
          sender: string
          starred: boolean | null
          title: string
          user_id: string | null
        }
        Insert: {
          ai_status?: string | null
          ai_suggestion?: string | null
          category?: string | null
          created_at?: string | null
          date?: string | null
          description?: string | null
          document_data?: Json | null
          id?: string
          linked_entity_id?: string | null
          linked_entity_type?: string | null
          read?: boolean | null
          sender: string
          starred?: boolean | null
          title: string
          user_id?: string | null
        }
        Update: {
          ai_status?: string | null
          ai_suggestion?: string | null
          category?: string | null
          created_at?: string | null
          date?: string | null
          description?: string | null
          document_data?: Json | null
          id?: string
          linked_entity_id?: string | null
          linked_entity_type?: string | null
          read?: boolean | null
          sender?: string
          starred?: boolean | null
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      incomedeclarations: {
        Row: {
          created_at: string | null
          due_date: string | null
          expenses: number | null
          id: string
          profit_before_tax: number | null
          revenue: number | null
          status: string | null
          submitted_at: string | null
          tax_amount: number | null
          tax_year: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          due_date?: string | null
          expenses?: number | null
          id?: string
          profit_before_tax?: number | null
          revenue?: number | null
          status?: string | null
          submitted_at?: string | null
          tax_amount?: number | null
          tax_year: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          due_date?: string | null
          expenses?: number | null
          id?: string
          profit_before_tax?: number | null
          revenue?: number | null
          status?: string | null
          submitted_at?: string | null
          tax_amount?: number | null
          tax_year?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      integrations: {
        Row: {
          created_at: string | null
          credentials_encrypted: Json | null
          enabled: boolean | null
          error_message: string | null
          id: string
          last_sync_at: string | null
          service: string
          settings: Json | null
          sync_status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          credentials_encrypted?: Json | null
          enabled?: boolean | null
          error_message?: string | null
          id?: string
          last_sync_at?: string | null
          service: string
          settings?: Json | null
          sync_status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          credentials_encrypted?: Json | null
          enabled?: boolean | null
          error_message?: string | null
          id?: string
          last_sync_at?: string | null
          service?: string
          settings?: Json | null
          sync_status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      inventarier: {
        Row: {
          account_number: string | null
          barcode: string | null
          category: string | null
          company_id: string
          created_at: string | null
          current_value: number | null
          depreciation_account: string | null
          depreciation_method: string | null
          description: string | null
          disposal_date: string | null
          disposal_value: number | null
          id: string
          invoice_reference: string | null
          location: string | null
          metadata: Json | null
          name: string
          purchase_date: string
          purchase_price: number
          residual_value: number | null
          serial_number: string | null
          status: string | null
          supplier: string | null
          updated_at: string | null
          useful_life_years: number | null
          user_id: string
        }
        Insert: {
          account_number?: string | null
          barcode?: string | null
          category?: string | null
          company_id: string
          created_at?: string | null
          current_value?: number | null
          depreciation_account?: string | null
          depreciation_method?: string | null
          description?: string | null
          disposal_date?: string | null
          disposal_value?: number | null
          id?: string
          invoice_reference?: string | null
          location?: string | null
          metadata?: Json | null
          name: string
          purchase_date: string
          purchase_price: number
          residual_value?: number | null
          serial_number?: string | null
          status?: string | null
          supplier?: string | null
          updated_at?: string | null
          useful_life_years?: number | null
          user_id: string
        }
        Update: {
          account_number?: string | null
          barcode?: string | null
          category?: string | null
          company_id?: string
          created_at?: string | null
          current_value?: number | null
          depreciation_account?: string | null
          depreciation_method?: string | null
          description?: string | null
          disposal_date?: string | null
          disposal_value?: number | null
          id?: string
          invoice_reference?: string | null
          location?: string | null
          metadata?: Json | null
          name?: string
          purchase_date?: string
          purchase_price?: number
          residual_value?: number | null
          serial_number?: string | null
          status?: string | null
          supplier?: string | null
          updated_at?: string | null
          useful_life_years?: number | null
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
      k10declarations: {
        Row: {
          company_id: string
          created_at: string | null
          deadline: string | null
          fiscal_year: number
          gransbelopp: number | null
          id: string
          lonebaserat_utrymme: number | null
          omkostnadsbelopp: number | null
          saved_gransbelopp: number | null
          shareholder_id: string | null
          status: string | null
          submitted_at: string | null
          updated_at: string | null
          used_gransbelopp: number | null
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          deadline?: string | null
          fiscal_year: number
          gransbelopp?: number | null
          id?: string
          lonebaserat_utrymme?: number | null
          omkostnadsbelopp?: number | null
          saved_gransbelopp?: number | null
          shareholder_id?: string | null
          status?: string | null
          submitted_at?: string | null
          updated_at?: string | null
          used_gransbelopp?: number | null
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          deadline?: string | null
          fiscal_year?: number
          gransbelopp?: number | null
          id?: string
          lonebaserat_utrymme?: number | null
          omkostnadsbelopp?: number | null
          saved_gransbelopp?: number | null
          shareholder_id?: string | null
          status?: string | null
          submitted_at?: string | null
          updated_at?: string | null
          used_gransbelopp?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "k10_declarations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "k10_declarations_shareholder_id_fkey"
            columns: ["shareholder_id"]
            isOneToOne: false
            referencedRelation: "shareholders"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          address: string | null
          company_id: string
          created_at: string | null
          email: string | null
          exit_date: string | null
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
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          company_id: string
          created_at?: string | null
          email?: string | null
          exit_date?: string | null
          id?: string
          join_date?: string
          last_paid_year?: number | null
          member_number?: string | null
          membership_type?: string | null
          metadata?: Json | null
          name: string
          phone?: string | null
          roles?: string[] | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          company_id?: string
          created_at?: string | null
          email?: string | null
          exit_date?: string | null
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
          updated_at?: string | null
          user_id?: string
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
      monthclosings: {
        Row: {
          checks: Json | null
          company_id: string
          created_at: string | null
          id: string
          locked_at: string | null
          locked_by: string | null
          month: number
          status: string | null
          updated_at: string | null
          user_id: string | null
          year: number
        }
        Insert: {
          checks?: Json | null
          company_id: string
          created_at?: string | null
          id?: string
          locked_at?: string | null
          locked_by?: string | null
          month: number
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          year: number
        }
        Update: {
          checks?: Json | null
          company_id?: string
          created_at?: string | null
          id?: string
          locked_at?: string | null
          locked_by?: string | null
          month?: number
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          year?: number
        }
        Relationships: []
      }
      neappendices: {
        Row: {
          business_expenses: number | null
          business_income: number | null
          created_at: string | null
          egenavgifter: number | null
          id: string
          net_business_income: number | null
          schablonavdrag: number | null
          status: string | null
          submitted_at: string | null
          tax_year: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          business_expenses?: number | null
          business_income?: number | null
          created_at?: string | null
          egenavgifter?: number | null
          id?: string
          net_business_income?: number | null
          schablonavdrag?: number | null
          status?: string | null
          submitted_at?: string | null
          tax_year: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          business_expenses?: number | null
          business_income?: number | null
          created_at?: string | null
          egenavgifter?: number | null
          id?: string
          net_business_income?: number | null
          schablonavdrag?: number | null
          status?: string | null
          submitted_at?: string | null
          tax_year?: number
          updated_at?: string | null
          user_id?: string
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
          address: string | null
          capital_contribution: number | null
          company_id: string
          created_at: string | null
          current_capital_balance: number | null
          email: string | null
          exit_date: string | null
          id: string
          is_limited_liability: boolean | null
          join_date: string
          metadata: Json | null
          name: string
          ownership_percentage: number
          personal_number: string | null
          phone: string | null
          profit_share_percentage: number | null
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          capital_contribution?: number | null
          company_id: string
          created_at?: string | null
          current_capital_balance?: number | null
          email?: string | null
          exit_date?: string | null
          id?: string
          is_limited_liability?: boolean | null
          join_date?: string
          metadata?: Json | null
          name: string
          ownership_percentage?: number
          personal_number?: string | null
          phone?: string | null
          profit_share_percentage?: number | null
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          capital_contribution?: number | null
          company_id?: string
          created_at?: string | null
          current_capital_balance?: number | null
          email?: string | null
          exit_date?: string | null
          id?: string
          is_limited_liability?: boolean | null
          join_date?: string
          metadata?: Json | null
          name?: string
          ownership_percentage?: number
          personal_number?: string | null
          phone?: string | null
          profit_share_percentage?: number | null
          type?: string
          updated_at?: string | null
          user_id?: string
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
          created_at: string | null
          employee_id: string | null
          gross_salary: number
          id: string
          month: number
          net_salary: number
          other_deductions: number | null
          period: string
          sent_at: string | null
          status: string | null
          tax_deduction: number
          updated_at: string | null
          user_id: string
          year: number
        }
        Insert: {
          bonuses?: number | null
          created_at?: string | null
          employee_id?: string | null
          gross_salary?: number
          id?: string
          month: number
          net_salary?: number
          other_deductions?: number | null
          period: string
          sent_at?: string | null
          status?: string | null
          tax_deduction?: number
          updated_at?: string | null
          user_id: string
          year: number
        }
        Update: {
          bonuses?: number | null
          created_at?: string | null
          employee_id?: string | null
          gross_salary?: number
          id?: string
          month?: number
          net_salary?: number
          other_deductions?: number | null
          period?: string
          sent_at?: string | null
          status?: string | null
          tax_deduction?: number
          updated_at?: string | null
          user_id?: string
          year?: number
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
          stripe_customer_id: string | null
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
          stripe_customer_id?: string | null
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
          stripe_customer_id?: string | null
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
          user_id: string | null
        }
        Insert: {
          count?: number
          created_at?: string | null
          identifier: string
          reset_time: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          count?: number
          created_at?: string | null
          identifier?: string
          reset_time?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ratelimitssliding: {
        Row: {
          created_at: string
          identifier: string
          last_access: string
          updated_at: string
          user_id: string | null
          window_data: Json
        }
        Insert: {
          created_at?: string
          identifier: string
          last_access?: string
          updated_at?: string
          user_id?: string | null
          window_data?: Json
        }
        Update: {
          created_at?: string
          identifier?: string
          last_access?: string
          updated_at?: string
          user_id?: string | null
          window_data?: Json
        }
        Relationships: []
      }
      receipts: {
        Row: {
          amount: number | null
          captured_at: string
          created_at: string
          currency: string
          file_url: string | null
          id: string
          metadata: Json | null
          status: string | null
          total_amount: number | null
          transaction_count: number
          updated_at: string
          user_id: string
          vendor: string | null
        }
        Insert: {
          amount?: number | null
          captured_at?: string
          created_at?: string
          currency?: string
          file_url?: string | null
          id?: string
          metadata?: Json | null
          status?: string | null
          total_amount?: number | null
          transaction_count?: number
          updated_at?: string
          user_id: string
          vendor?: string | null
        }
        Update: {
          amount?: number | null
          captured_at?: string
          created_at?: string
          currency?: string
          file_url?: string | null
          id?: string
          metadata?: Json | null
          status?: string | null
          total_amount?: number | null
          transaction_count?: number
          updated_at?: string
          user_id?: string
          vendor?: string | null
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
      shareholders: {
        Row: {
          acquired_date: string | null
          address: string | null
          company_id: string
          created_at: string | null
          email: string | null
          id: string
          name: string
          person_number: string | null
          phone: string | null
          share_class: string | null
          share_percentage: number | null
          shares: number
          status: string | null
          updated_at: string | null
          user_id: string
          voting_rights: number | null
        }
        Insert: {
          acquired_date?: string | null
          address?: string | null
          company_id: string
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          person_number?: string | null
          phone?: string | null
          share_class?: string | null
          share_percentage?: number | null
          shares?: number
          status?: string | null
          updated_at?: string | null
          user_id: string
          voting_rights?: number | null
        }
        Update: {
          acquired_date?: string | null
          address?: string | null
          company_id?: string
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          person_number?: string | null
          phone?: string | null
          share_class?: string | null
          share_percentage?: number | null
          shares?: number
          status?: string | null
          updated_at?: string | null
          user_id?: string
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
          amount: number
          company_id: string | null
          created_at: string | null
          document_url: string | null
          due_date: string | null
          id: string
          invoice_number: string | null
          issue_date: string | null
          ocr: string | null
          status: string | null
          supplier_name: string
          total_amount: number
          user_id: string | null
          vat_amount: number | null
        }
        Insert: {
          amount: number
          company_id?: string | null
          created_at?: string | null
          document_url?: string | null
          due_date?: string | null
          id: string
          invoice_number?: string | null
          issue_date?: string | null
          ocr?: string | null
          status?: string | null
          supplier_name: string
          total_amount: number
          user_id?: string | null
          vat_amount?: number | null
        }
        Update: {
          amount?: number
          company_id?: string | null
          created_at?: string | null
          document_url?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          issue_date?: string | null
          ocr?: string | null
          status?: string | null
          supplier_name?: string
          total_amount?: number
          user_id?: string | null
          vat_amount?: number | null
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
          created_at: string
          data: Json | null
          file_url: string | null
          generated_at: string
          id: string
          metadata: Json | null
          period_end: string
          period_start: string
          report_type: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          file_url?: string | null
          generated_at?: string
          id?: string
          metadata?: Json | null
          period_end: string
          period_start: string
          report_type?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          file_url?: string | null
          generated_at?: string
          id?: string
          metadata?: Json | null
          period_end?: string
          period_start?: string
          report_type?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          account: string | null
          amount: number
          amount_value: number | null
          category: string | null
          category_id: string | null
          company_id: string | null
          created_at: string
          created_by: string | null
          currency: string
          description: string | null
          external_reference: string | null
          id: string
          merchant: string | null
          metadata: Json | null
          occurred_at: string
          receipt_id: string | null
          status: string
          updated_at: string
          user_id: string
          vat_amount: number | null
        }
        Insert: {
          account?: string | null
          amount: number
          amount_value?: number | null
          category?: string | null
          category_id?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          external_reference?: string | null
          id?: string
          merchant?: string | null
          metadata?: Json | null
          occurred_at?: string
          receipt_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
          vat_amount?: number | null
        }
        Update: {
          account?: string | null
          amount?: number
          amount_value?: number | null
          category?: string | null
          category_id?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          external_reference?: string | null
          id?: string
          merchant?: string | null
          metadata?: Json | null
          occurred_at?: string
          receipt_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          vat_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: false
            referencedRelation: "receipts"
            referencedColumns: ["id"]
          },
        ]
      }
      vatdeclarations: {
        Row: {
          created_at: string | null
          due_date: string
          end_date: string
          id: string
          input_vat: number | null
          net_vat: number | null
          output_vat: number | null
          period: string
          period_type: string | null
          start_date: string
          status: string | null
          submitted_at: string | null
          updated_at: string | null
          user_id: string
          year: number
        }
        Insert: {
          created_at?: string | null
          due_date: string
          end_date: string
          id?: string
          input_vat?: number | null
          net_vat?: number | null
          output_vat?: number | null
          period: string
          period_type?: string | null
          start_date: string
          status?: string | null
          submitted_at?: string | null
          updated_at?: string | null
          user_id: string
          year: number
        }
        Update: {
          created_at?: string | null
          due_date?: string
          end_date?: string
          id?: string
          input_vat?: number | null
          net_vat?: number | null
          output_vat?: number | null
          period?: string
          period_type?: string | null
          start_date?: string
          status?: string | null
          submitted_at?: string | null
          updated_at?: string | null
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      verifications: {
        Row: {
          created_at: string | null
          date: string
          description: string
          id: string
          number: number | null
          rows: Json
          series: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          description: string
          id: string
          number?: number | null
          rows: Json
          series?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          description?: string
          id?: string
          number?: number | null
          rows?: Json
          series?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      tax_monthly_summaries: {
        Row: {
          month: string | null
          receipts_count: number | null
          total_amount: number | null
          transaction_count: number | null
          user_id: string | null
        }
        Relationships: []
      }
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
      get_agi_stats: {
        Args: { period_month: number; period_year: number }
        Returns: Json
      }
      get_benefit_stats: { Args: { target_year: number }; Returns: Json }
      get_inventory_stats: { Args: never; Returns: Json }
      get_inventory_stats_tbl: {
        Args: never
        Returns: {
          active_items: number
          total_items: number
          total_value: number
        }[]
      }
      get_invoice_stats: { Args: never; Returns: Json }
      get_invoice_stats_tbl: {
        Args: never
        Returns: {
          overdue_count: number
          paid_amount: number
          total_amount: number
          total_invoices: number
        }[]
      }
      get_or_create_monthly_usage: {
        Args: { p_model_id: string; p_provider: string; p_user_id: string }
        Returns: string
      }
      get_payroll_stats: { Args: never; Returns: Json }
      get_receipt_stats: { Args: never; Returns: Json }
      get_receipt_stats_tbl: {
        Args: never
        Returns: {
          pending_receipts: number
          processed_receipts: number
          total_receipts: number
        }[]
      }
      get_shareholder_stats: { Args: { p_company_id: string }; Returns: Json }
      get_shareholder_stats_tbl: {
        Args: { p_company_id?: string }
        Returns: {
          total_shareholders: number
          total_shares: number
          unique_shareholders: number
        }[]
      }
      get_transaction_stats: { Args: never; Returns: Json }
      get_transaction_stats_tbl: {
        Args: never
        Returns: {
          posted_count: number
          total_expenses: number
          total_income: number
          total_transactions: number
        }[]
      }
      get_vat_stats: {
        Args: { end_date: string; start_date: string }
        Returns: Json
      }
      increment_ai_usage: {
        Args: {
          p_model_id: string
          p_provider: string
          p_tokens?: number
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
