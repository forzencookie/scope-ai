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
      agi_reports: {
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
      ai_logs: {
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
        Relationships: [
          {
            foreignKeyName: "ai_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      annual_closings: {
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
      annual_reports: {
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
      board_minutes: {
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
            referencedRelation: "company_meetings"
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
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          name: string
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          parent_id?: string | null
          updated_at?: string
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
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          org_number?: string | null
          settings?: Json | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          org_number?: string | null
          settings?: Json | null
        }
        Relationships: []
      }
      company_meetings: {
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
      customer_invoices: {
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
            referencedRelation: "company_meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_benefits: {
        Row: {
          benefit_id: string | null
          created_at: string | null
          employee_id: string | null
          end_date: string | null
          id: string
          start_date: string | null
        }
        Insert: {
          benefit_id?: string | null
          created_at?: string | null
          employee_id?: string | null
          end_date?: string | null
          id?: string
          start_date?: string | null
        }
        Update: {
          benefit_id?: string | null
          created_at?: string | null
          employee_id?: string | null
          end_date?: string | null
          id?: string
          start_date?: string | null
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
          actor_id: string | null
          actor_name: string | null
          category: string | null
          company_id: string
          created_at: string | null
          description: string | null
          entity_id: string | null
          entity_type: string | null
          event_type: string
          id: string
          metadata: Json | null
          related_to: Json | null
          source: string
          status: string | null
          timestamp: string | null
          title: string
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          actor_name?: string | null
          category?: string | null
          company_id: string
          created_at?: string | null
          description?: string | null
          entity_id?: string | null
          entity_type?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          related_to?: Json | null
          source: string
          status?: string | null
          timestamp?: string | null
          title: string
          user_id: string
        }
        Update: {
          actor_id?: string | null
          actor_name?: string | null
          category?: string | null
          company_id?: string
          created_at?: string | null
          description?: string | null
          entity_id?: string | null
          entity_type?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          related_to?: Json | null
          source?: string
          status?: string | null
          timestamp?: string | null
          title?: string
          user_id?: string
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
      inbox_items: {
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
        }
        Relationships: []
      }
      income_declarations: {
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
      k10_declarations: {
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
      ne_appendices: {
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
      rate_limits: {
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
      rate_limits_sliding: {
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
        Relationships: [
          {
            foreignKeyName: "receipts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
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
      supplier_invoices: {
        Row: {
          amount: number
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
          vat_amount: number | null
        }
        Insert: {
          amount: number
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
          vat_amount?: number | null
        }
        Update: {
          amount?: number
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
          vat_amount?: number | null
        }
        Relationships: []
      }
      tax_reports: {
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
        Relationships: [
          {
            foreignKeyName: "tax_reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          category: string | null
          category_id: string | null
          created_at: string
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
          amount: number
          category?: string | null
          category_id?: string | null
          created_at?: string
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
          amount?: number
          category?: string | null
          category_id?: string | null
          created_at?: string
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
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          metadata: Json | null
          phone: string | null
          preferred_name: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          metadata?: Json | null
          phone?: string | null
          preferred_name?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          metadata?: Json | null
          phone?: string | null
          preferred_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      vat_declarations: {
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
        }
        Insert: {
          created_at?: string | null
          date: string
          description: string
          id: string
          number?: number | null
          rows: Json
          series?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          description?: string
          id?: string
          number?: number | null
          rows?: Json
          series?: string | null
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
        Relationships: [
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
      get_invoice_stats: { Args: never; Returns: Json }
      get_payroll_stats: { Args: never; Returns: Json }
      get_receipt_stats: { Args: never; Returns: Json }
      get_shareholder_stats: { Args: { p_company_id: string }; Returns: Json }
      get_transaction_stats: { Args: never; Returns: Json }
      get_vat_stats: {
        Args: { end_date: string; start_date: string }
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
    Enums: {},
  },
} as const
