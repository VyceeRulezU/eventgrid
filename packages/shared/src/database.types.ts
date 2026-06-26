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
          city: string
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
          slug: string | null
          header_image_url: string | null
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
          slug?: string | null
          header_image_url?: string | null
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
          slug?: string | null
          header_image_url?: string | null
          deleted_at?: string | null
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
      live_board_items: {
        Row: {
          id: string
          event_id: string
          station_name: string
          status: string
          status_label: string | null
          sort_order: number
          assigned_to: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          station_name: string
          status?: string
          status_label?: string | null
          sort_order?: number
          assigned_to?: string | null
        }
        Update: {
          id?: string
          event_id?: string
          station_name?: string
          status?: string
          status_label?: string | null
          sort_order?: number
          assigned_to?: string | null
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
          lessons_learned: string | null
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          board_item_id?: string | null
          title: string
          description?: string | null
          severity: string
          photo_url?: string | null
          raised_by: string
          raised_at?: string
          resolved_at?: string | null
          resolution?: string | null
          resolved_by?: string | null
          lessons_learned?: string | null
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
          lessons_learned?: string | null
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
          rsvp_note: string | null
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
          rsvp_note?: string | null
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
          rsvp_note?: string | null
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
      seating_tables: {
        Row: {
          id: string
          event_id: string
          table_name: string
          capacity: number
          is_vip: boolean
          notes: string | null
          x: number
          y: number
          width: number
          height: number
          rotation: number
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          table_name: string
          capacity: number
          is_vip?: boolean
          notes?: string | null
          x?: number
          y?: number
          width?: number
          height?: number
          rotation?: number
        }
        Update: {
          id?: string
          event_id?: string
          table_name?: string
          capacity?: number
          is_vip?: boolean
          notes?: string | null
          x?: number
          y?: number
          width?: number
          height?: number
          rotation?: number
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
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
