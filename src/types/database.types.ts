export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          display_name: string | null
          phone: string | null
          avatar_url: string | null
          role: string
          org_id: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          display_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          role: string
          org_id?: string | null
          is_active?: boolean
        }
        Update: {
          id?: string
          email?: string
          display_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          role?: string
          org_id?: string | null
          is_active?: boolean
        }
      }
      organizations: {
        Row: {
          id: string
          name: string
          owner_id: string
          logo_url: string | null
          website: string | null
          instagram: string | null
          address: string | null
          city: string
          state: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          owner_id: string
          logo_url?: string | null
          website?: string | null
          instagram?: string | null
          address?: string | null
          city?: string
          state?: string | null
        }
        Update: {
          id?: string
          name?: string
          owner_id?: string
          logo_url?: string | null
          website?: string | null
          instagram?: string | null
          address?: string | null
          city?: string
          state?: string | null
        }
      }
      events: {
        Row: {
          id: string
          org_id: string
          created_by: string
          name: string
          event_type: string
          event_date: string | null
          end_date: string | null
          venue_name: string | null
          venue_address: string | null
          guest_count: number | null
          size_tier: string | null
          budget_total: number | null
          status: string
          payment_status: string
          payment_provider: string | null
          amount_paid: number | null
          paid_at: string | null
          paystack_ref: string | null
          current_phase: number
          client_id: string | null
          coordinator_id: string | null
          notes: string | null
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          created_by: string
          name: string
          event_type: string
          event_date?: string | null
          end_date?: string | null
          venue_name?: string | null
          venue_address?: string | null
          guest_count?: number | null
          size_tier?: string | null
          budget_total?: number | null
          status?: string
          payment_status?: string
          payment_provider?: string | null
          amount_paid?: number | null
          paid_at?: string | null
          paystack_ref?: string | null
          current_phase?: number
          client_id?: string | null
          coordinator_id?: string | null
          notes?: string | null
          deleted_at?: string | null
        }
        Update: {
          id?: string
          org_id?: string
          created_by?: string
          name?: string
          event_type?: string
          event_date?: string | null
          end_date?: string | null
          venue_name?: string | null
          venue_address?: string | null
          guest_count?: number | null
          size_tier?: string | null
          budget_total?: number | null
          status?: string
          payment_status?: string
          payment_provider?: string | null
          amount_paid?: number | null
          paid_at?: string | null
          paystack_ref?: string | null
          current_phase?: number
          client_id?: string | null
          coordinator_id?: string | null
          notes?: string | null
          deleted_at?: string | null
        }
      }
      event_access: {
        Row: {
          id: string
          event_id: string
          user_id: string
          role: string
          invited_by: string | null
          accepted_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          user_id: string
          role: string
          invited_by?: string | null
          accepted_at?: string | null
        }
        Update: {
          id?: string
          event_id?: string
          user_id?: string
          role?: string
          invited_by?: string | null
          accepted_at?: string | null
        }
      }
      event_phases: {
        Row: {
          id: string
          event_id: string
          phase_number: number
          phase_name: string
          status: string
          owner_id: string | null
          due_date: string | null
          completed_at: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          phase_number: number
          phase_name: string
          status?: string
          owner_id?: string | null
          due_date?: string | null
          completed_at?: string | null
          notes?: string | null
        }
        Update: {
          id?: string
          event_id?: string
          phase_number?: number
          phase_name?: string
          status?: string
          owner_id?: string | null
          due_date?: string | null
          completed_at?: string | null
          notes?: string | null
        }
      }
      vendors: {
        Row: {
          id: string
          org_id: string
          name: string
          category: string
          contact_name: string | null
          phone: string | null
          email: string | null
          instagram: string | null
          rating: number | null
          notes: string | null
          is_verified: boolean
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          name: string
          category: string
          contact_name?: string | null
          phone?: string | null
          email?: string | null
          instagram?: string | null
          rating?: number | null
          notes?: string | null
          is_verified?: boolean
          deleted_at?: string | null
        }
        Update: {
          id?: string
          org_id?: string
          name?: string
          category?: string
          contact_name?: string | null
          phone?: string | null
          email?: string | null
          instagram?: string | null
          rating?: number | null
          notes?: string | null
          is_verified?: boolean
          deleted_at?: string | null
        }
      }
      event_vendors: {
        Row: {
          id: string
          event_id: string
          vendor_id: string | null
          vendor_name: string
          category: string
          service_desc: string | null
          quantity: number
          total_amount: number
          advance_paid: number
          balance: number
          payment_status: string
          booking_status: string
          contract_url: string | null
          payment_date: string | null
          notes: string | null
          portal_user_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          vendor_id?: string | null
          vendor_name: string
          category: string
          service_desc?: string | null
          quantity?: number
          total_amount: number
          advance_paid?: number
          payment_status?: string
          booking_status?: string
          contract_url?: string | null
          payment_date?: string | null
          notes?: string | null
          portal_user_id?: string | null
        }
        Update: {
          id?: string
          event_id?: string
          vendor_id?: string | null
          vendor_name?: string
          category?: string
          service_desc?: string | null
          quantity?: number
          total_amount?: number
          advance_paid?: number
          payment_status?: string
          booking_status?: string
          contract_url?: string | null
          payment_date?: string | null
          notes?: string | null
          portal_user_id?: string | null
        }
      }
      financial_entries: {
        Row: {
          id: string
          event_id: string
          event_vendor_id: string | null
          vendor_name: string
          description: string
          category: string
          quantity: number
          total_amount: number
          advance_paid: number
          balance: number
          payment_status: string
          payment_date: string | null
          receipt_url: string | null
          notes: string | null
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          event_vendor_id?: string | null
          vendor_name: string
          description: string
          category: string
          quantity?: number
          total_amount: number
          advance_paid?: number
          payment_status?: string
          payment_date?: string | null
          receipt_url?: string | null
          notes?: string | null
          sort_order?: number
        }
        Update: {
          id?: string
          event_id?: string
          event_vendor_id?: string | null
          vendor_name?: string
          description?: string
          category?: string
          quantity?: number
          total_amount?: number
          advance_paid?: number
          payment_status?: string
          payment_date?: string | null
          receipt_url?: string | null
          notes?: string | null
          sort_order?: number
        }
      }
      tasks: {
        Row: {
          id: string
          event_id: string
          phase_id: string | null
          title: string
          description: string | null
          assignee_id: string | null
          created_by: string
          due_datetime: string | null
          priority: string
          status: string
          completed_at: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          phase_id?: string | null
          title: string
          description?: string | null
          assignee_id?: string | null
          created_by: string
          due_datetime?: string | null
          priority?: string
          status?: string
          completed_at?: string | null
          notes?: string | null
        }
        Update: {
          id?: string
          event_id?: string
          phase_id?: string | null
          title?: string
          description?: string | null
          assignee_id?: string | null
          created_by?: string
          due_datetime?: string | null
          priority?: string
          status?: string
          completed_at?: string | null
          notes?: string | null
        }
      }
      task_comments: {
        Row: {
          id: string
          task_id: string
          user_id: string
          message: string
          photo_urls: string
          created_at: string
        }
        Insert: {
          id?: string
          task_id: string
          user_id: string
          message: string
          photo_urls?: string
        }
        Update: {
          id?: string
          task_id?: string
          user_id?: string
          message?: string
          photo_urls?: string
        }
      }
      seating_tables: {
        Row: {
          id: string
          event_id: string
          table_name: string
          capacity: number
          is_vip: boolean
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          table_name: string
          capacity?: number
          is_vip?: boolean
          notes?: string | null
        }
        Update: {
          id?: string
          event_id?: string
          table_name?: string
          capacity?: number
          is_vip?: boolean
          notes?: string | null
        }
      }
      guests: {
        Row: {
          id: string
          event_id: string
          first_name: string
          last_name: string | null
          phone: string | null
          email: string | null
          rsvp_status: string
          table_id: string | null
          seat_number: number | null
          is_vip: boolean
          group_name: string | null
          plus_one: boolean
          checked_in: boolean
          checked_in_at: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          first_name: string
          last_name?: string | null
          phone?: string | null
          email?: string | null
          rsvp_status?: string
          table_id?: string | null
          seat_number?: number | null
          is_vip?: boolean
          group_name?: string | null
          plus_one?: boolean
          checked_in?: boolean
          checked_in_at?: string | null
          notes?: string | null
        }
        Update: {
          id?: string
          event_id?: string
          first_name?: string
          last_name?: string | null
          phone?: string | null
          email?: string | null
          rsvp_status?: string
          table_id?: string | null
          seat_number?: number | null
          is_vip?: boolean
          group_name?: string | null
          plus_one?: boolean
          checked_in?: boolean
          checked_in_at?: string | null
          notes?: string | null
        }
      }
      live_board_items: {
        Row: {
          id: string
          event_id: string
          station_name: string
          category: string | null
          status: string
          status_label: string | null
          updated_by: string | null
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          station_name: string
          category?: string | null
          status?: string
          status_label?: string | null
          updated_by?: string | null
          sort_order?: number
        }
        Update: {
          id?: string
          event_id?: string
          station_name?: string
          category?: string | null
          status?: string
          status_label?: string | null
          updated_by?: string | null
          sort_order?: number
        }
      }
      issues: {
        Row: {
          id: string
          event_id: string
          board_item_id: string | null
          title: string
          description: string | null
          severity: string
          photo_url: string | null
          raised_by: string
          raised_at: string
          resolved_at: string | null
          resolution: string | null
          resolved_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          board_item_id?: string | null
          title: string
          description?: string | null
          severity?: string
          photo_url?: string | null
          raised_by: string
          raised_at?: string
          resolved_at?: string | null
          resolution?: string | null
          resolved_by?: string | null
        }
        Update: {
          id?: string
          event_id?: string
          board_item_id?: string | null
          title?: string
          description?: string | null
          severity?: string
          photo_url?: string | null
          raised_by?: string
          raised_at?: string
          resolved_at?: string | null
          resolution?: string | null
          resolved_by?: string | null
        }
      }
      media: {
        Row: {
          id: string
          event_id: string
          uploader_id: string
          url: string
          storage_path: string
          tag: string | null
          phase_number: number | null
          caption: string | null
          file_size: number | null
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          uploader_id: string
          url: string
          storage_path: string
          tag?: string | null
          phase_number?: number | null
          caption?: string | null
          file_size?: number | null
        }
        Update: {
          id?: string
          event_id?: string
          uploader_id?: string
          url?: string
          storage_path?: string
          tag?: string | null
          phase_number?: number | null
          caption?: string | null
          file_size?: number | null
        }
      }
      client_portals: {
        Row: {
          id: string
          event_id: string
          client_name: string
          client_email: string | null
          client_phone: string | null
          access_token: string
          is_active: boolean
          expires_at: string | null
          last_accessed: string | null
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          client_name: string
          client_email?: string | null
          client_phone?: string | null
          access_token?: string
          is_active?: boolean
          expires_at?: string | null
        }
        Update: {
          id?: string
          event_id?: string
          client_name?: string
          client_email?: string | null
          client_phone?: string | null
          access_token?: string
          is_active?: boolean
          expires_at?: string | null
          last_accessed?: string | null
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          event_id: string | null
          type: string
          title: string
          body: string | null
          is_read: boolean
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          event_id?: string | null
          type: string
          title: string
          body?: string | null
          is_read?: boolean
          read_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          event_id?: string | null
          type?: string
          title?: string
          body?: string | null
          is_read?: boolean
          read_at?: string | null
        }
      }
      run_sheet_items: {
        Row: {
          id: string
          event_id: string
          time: string
          duration_mins: number
          title: string
          description: string | null
          owner: string | null
          status: string
          actual_time: string | null
          notes: string | null
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          time: string
          duration_mins?: number
          title: string
          description?: string | null
          owner?: string | null
          status?: string
          actual_time?: string | null
          notes?: string | null
          sort_order?: number
        }
        Update: {
          id?: string
          event_id?: string
          time?: string
          duration_mins?: number
          title?: string
          description?: string | null
          owner?: string | null
          status?: string
          actual_time?: string | null
          notes?: string | null
          sort_order?: number
        }
      }
      survey_responses: {
        Row: {
          id: string
          respondent_name: string | null
          respondent_email: string | null
          respondent_role: string | null
          open_to_software: boolean
          currently_using: boolean
          current_software_names: string | null
          preferred_billing: string | null
          pay_per_event: string | null
          monthly_amount: string | null
          quarterly_amount: string | null
          yearly_amount: string | null
          important_features: string[]
          wanted_features: string | null
          additional_feedback: string | null
          created_at: string
        }
        Insert: {
          id?: string
          respondent_name?: string | null
          respondent_email?: string | null
          respondent_role?: string | null
          open_to_software?: boolean
          currently_using?: boolean
          current_software_names?: string | null
          preferred_billing?: string | null
          pay_per_event?: string | null
          monthly_amount?: string | null
          quarterly_amount?: string | null
          yearly_amount?: string | null
          important_features?: string[]
          wanted_features?: string | null
          additional_feedback?: string | null
        }
        Update: {
          id?: string
          respondent_name?: string | null
          respondent_email?: string | null
          respondent_role?: string | null
          open_to_software?: boolean
          currently_using?: boolean
          current_software_names?: string | null
          preferred_billing?: string | null
          pay_per_event?: string | null
          monthly_amount?: string | null
          quarterly_amount?: string | null
          yearly_amount?: string | null
          important_features?: string[]
          wanted_features?: string | null
          additional_feedback?: string | null
        }
      }
      reviews: {
        Row: {
          id: string
          reviewed_id: string
          reviewer_id: string
          event_id: string
          reviewer_role: string
          rating: number
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          reviewed_id: string
          reviewer_id: string
          event_id: string
          reviewer_role: string
          rating: number
          comment?: string | null
        }
        Update: {
          id?: string
          reviewed_id?: string
          reviewer_id?: string
          event_id?: string
          reviewer_role?: string
          rating?: number
          comment?: string | null
        }
      }
    }
    Views: Record<string, never>
    Functions: {
      manually_complete_phase: {
        Args: { p_phase_id: string }
        Returns: undefined
      }
      reopen_phase: {
        Args: { p_phase_id: string }
        Returns: undefined
      }
    }
    Enums: Record<string, never>
  }
}
