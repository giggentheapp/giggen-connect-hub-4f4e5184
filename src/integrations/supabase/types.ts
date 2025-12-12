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
      admin_whitelist: {
        Row: {
          added_by: string | null
          can_scan_tickets: boolean | null
          created_at: string | null
          email: string
          id: string
          user_id: string | null
        }
        Insert: {
          added_by?: string | null
          can_scan_tickets?: boolean | null
          created_at?: string | null
          email: string
          id?: string
          user_id?: string | null
        }
        Update: {
          added_by?: string | null
          can_scan_tickets?: boolean | null
          created_at?: string | null
          email?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: string | null
          record_id: string | null
          sensitive_fields: string[] | null
          table_name: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          record_id?: string | null
          sensitive_fields?: string[] | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          record_id?: string | null
          sensitive_fields?: string[] | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      band_hospitality: {
        Row: {
          band_id: string
          created_at: string
          file_path: string
          file_size: number | null
          file_type: string
          file_url: string
          filename: string
          id: string
          mime_type: string | null
          updated_at: string
        }
        Insert: {
          band_id: string
          created_at?: string
          file_path: string
          file_size?: number | null
          file_type?: string
          file_url: string
          filename: string
          id?: string
          mime_type?: string | null
          updated_at?: string
        }
        Update: {
          band_id?: string
          created_at?: string
          file_path?: string
          file_size?: number | null
          file_type?: string
          file_url?: string
          filename?: string
          id?: string
          mime_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "band_hospitality_band_id_fkey"
            columns: ["band_id"]
            isOneToOne: false
            referencedRelation: "bands"
            referencedColumns: ["id"]
          },
        ]
      }
      band_invites: {
        Row: {
          band_id: string
          created_at: string | null
          id: string
          invited_by: string
          invited_user_id: string
          responded_at: string | null
          status: string | null
        }
        Insert: {
          band_id: string
          created_at?: string | null
          id?: string
          invited_by: string
          invited_user_id: string
          responded_at?: string | null
          status?: string | null
        }
        Update: {
          band_id?: string
          created_at?: string | null
          id?: string
          invited_by?: string
          invited_user_id?: string
          responded_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "band_invites_band_id_fkey"
            columns: ["band_id"]
            isOneToOne: false
            referencedRelation: "bands"
            referencedColumns: ["id"]
          },
        ]
      }
      band_members: {
        Row: {
          band_id: string
          id: string
          joined_at: string | null
          role: string | null
          show_in_profile: boolean
          user_id: string
        }
        Insert: {
          band_id: string
          id?: string
          joined_at?: string | null
          role?: string | null
          show_in_profile?: boolean
          user_id: string
        }
        Update: {
          band_id?: string
          id?: string
          joined_at?: string | null
          role?: string | null
          show_in_profile?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "band_members_band_id_fkey"
            columns: ["band_id"]
            isOneToOne: false
            referencedRelation: "bands"
            referencedColumns: ["id"]
          },
        ]
      }
      band_portfolio: {
        Row: {
          band_id: string
          created_at: string
          description: string | null
          file_path: string
          file_size: number | null
          file_type: string
          file_url: string | null
          filename: string
          id: string
          is_public: boolean
          mime_type: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          band_id: string
          created_at?: string
          description?: string | null
          file_path: string
          file_size?: number | null
          file_type: string
          file_url?: string | null
          filename: string
          id?: string
          is_public?: boolean
          mime_type?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          band_id?: string
          created_at?: string
          description?: string | null
          file_path?: string
          file_size?: number | null
          file_type?: string
          file_url?: string | null
          filename?: string
          id?: string
          is_public?: boolean
          mime_type?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "band_portfolio_band_id_fkey"
            columns: ["band_id"]
            isOneToOne: false
            referencedRelation: "bands"
            referencedColumns: ["id"]
          },
        ]
      }
      band_tech_specs: {
        Row: {
          band_id: string
          created_at: string
          file_path: string
          file_size: number | null
          file_type: string
          file_url: string
          filename: string
          id: string
          mime_type: string | null
          updated_at: string
        }
        Insert: {
          band_id: string
          created_at?: string
          file_path: string
          file_size?: number | null
          file_type?: string
          file_url: string
          filename: string
          id?: string
          mime_type?: string | null
          updated_at?: string
        }
        Update: {
          band_id?: string
          created_at?: string
          file_path?: string
          file_size?: number | null
          file_type?: string
          file_url?: string
          filename?: string
          id?: string
          mime_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "band_tech_specs_band_id_fkey"
            columns: ["band_id"]
            isOneToOne: false
            referencedRelation: "bands"
            referencedColumns: ["id"]
          },
        ]
      }
      bands: {
        Row: {
          banner_url: string | null
          bio: string | null
          contact_info: Json | null
          created_at: string | null
          created_by: string
          description: string | null
          discography: string[] | null
          founded_year: number | null
          genre: string | null
          id: string
          image_url: string | null
          is_public: boolean
          music_links: Json | null
          name: string
          social_media_links: Json | null
          updated_at: string | null
        }
        Insert: {
          banner_url?: string | null
          bio?: string | null
          contact_info?: Json | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          discography?: string[] | null
          founded_year?: number | null
          genre?: string | null
          id?: string
          image_url?: string | null
          is_public?: boolean
          music_links?: Json | null
          name: string
          social_media_links?: Json | null
          updated_at?: string | null
        }
        Update: {
          banner_url?: string | null
          bio?: string | null
          contact_info?: Json | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          discography?: string[] | null
          founded_year?: number | null
          genre?: string | null
          id?: string
          image_url?: string | null
          is_public?: boolean
          music_links?: Json | null
          name?: string
          social_media_links?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bands_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      booking_changes: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          booking_id: string
          change_timestamp: string
          changed_by: string
          created_at: string
          field_name: string
          id: string
          new_value: string | null
          old_value: string | null
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          requires_approval: boolean | null
          status: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          booking_id: string
          change_timestamp?: string
          changed_by: string
          created_at?: string
          field_name: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          requires_approval?: boolean | null
          status?: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          booking_id?: string
          change_timestamp?: string
          changed_by?: string
          created_at?: string
          field_name?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          requires_approval?: boolean | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_changes_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_portfolio_attachments: {
        Row: {
          attached_by: string
          booking_id: string
          created_at: string
          id: string
          portfolio_file_id: string
        }
        Insert: {
          attached_by: string
          booking_id: string
          created_at?: string
          id?: string
          portfolio_file_id: string
        }
        Update: {
          attached_by?: string
          booking_id?: string
          created_at?: string
          id?: string
          portfolio_file_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_portfolio_attachments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_portfolio_attachments_portfolio_file_id_fkey"
            columns: ["portfolio_file_id"]
            isOneToOne: false
            referencedRelation: "profile_portfolio"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          address: string | null
          agreement_summary_text: string | null
          allowed_at: string | null
          approved_at: string | null
          approved_by_receiver: boolean
          approved_by_sender: boolean
          artist_fee: number | null
          audience_estimate: number | null
          both_parties_approved: boolean | null
          by_agreement: boolean | null
          cancelled_at: string | null
          concept_ids: string[]
          contact_info_shared_at: string | null
          created_at: string | null
          deleted_at: string | null
          deletion_reason: string | null
          description: string | null
          door_deal: boolean | null
          door_percentage: number | null
          end_date: string | null
          end_time: string | null
          event_admin_id: string | null
          event_date: string | null
          event_id: string | null
          hospitality_rider: string | null
          hospitality_rider_status: string | null
          id: string
          is_public_after_approval: boolean | null
          last_modified_at: string | null
          last_modified_by: string | null
          latitude: number | null
          longitude: number | null
          personal_message: string | null
          price_musician: string | null
          price_ticket: string | null
          public_visibility_settings: Json | null
          published_at: string | null
          published_by_receiver: boolean | null
          published_by_sender: boolean | null
          receiver_allowed_at: string | null
          receiver_approved_at: string | null
          receiver_confirmed: boolean | null
          receiver_contact_info: Json | null
          receiver_id: string
          receiver_read_agreement: boolean | null
          receiver_signature: string | null
          receiver_signed_at: string | null
          rejected_at: string | null
          requires_approval: boolean | null
          selected_concept_id: string | null
          sender_approved_at: string | null
          sender_confirmed: boolean | null
          sender_contact_info: Json | null
          sender_id: string
          sender_read_agreement: boolean | null
          sender_signature: string | null
          sender_signed_at: string | null
          start_time: string | null
          status: Database["public"]["Enums"]["booking_status"]
          tech_spec: string | null
          ticket_price: number | null
          time: string | null
          title: string
          updated_at: string | null
          venue: string | null
        }
        Insert: {
          address?: string | null
          agreement_summary_text?: string | null
          allowed_at?: string | null
          approved_at?: string | null
          approved_by_receiver?: boolean
          approved_by_sender?: boolean
          artist_fee?: number | null
          audience_estimate?: number | null
          both_parties_approved?: boolean | null
          by_agreement?: boolean | null
          cancelled_at?: string | null
          concept_ids?: string[]
          contact_info_shared_at?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deletion_reason?: string | null
          description?: string | null
          door_deal?: boolean | null
          door_percentage?: number | null
          end_date?: string | null
          end_time?: string | null
          event_admin_id?: string | null
          event_date?: string | null
          event_id?: string | null
          hospitality_rider?: string | null
          hospitality_rider_status?: string | null
          id?: string
          is_public_after_approval?: boolean | null
          last_modified_at?: string | null
          last_modified_by?: string | null
          latitude?: number | null
          longitude?: number | null
          personal_message?: string | null
          price_musician?: string | null
          price_ticket?: string | null
          public_visibility_settings?: Json | null
          published_at?: string | null
          published_by_receiver?: boolean | null
          published_by_sender?: boolean | null
          receiver_allowed_at?: string | null
          receiver_approved_at?: string | null
          receiver_confirmed?: boolean | null
          receiver_contact_info?: Json | null
          receiver_id: string
          receiver_read_agreement?: boolean | null
          receiver_signature?: string | null
          receiver_signed_at?: string | null
          rejected_at?: string | null
          requires_approval?: boolean | null
          selected_concept_id?: string | null
          sender_approved_at?: string | null
          sender_confirmed?: boolean | null
          sender_contact_info?: Json | null
          sender_id: string
          sender_read_agreement?: boolean | null
          sender_signature?: string | null
          sender_signed_at?: string | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          tech_spec?: string | null
          ticket_price?: number | null
          time?: string | null
          title: string
          updated_at?: string | null
          venue?: string | null
        }
        Update: {
          address?: string | null
          agreement_summary_text?: string | null
          allowed_at?: string | null
          approved_at?: string | null
          approved_by_receiver?: boolean
          approved_by_sender?: boolean
          artist_fee?: number | null
          audience_estimate?: number | null
          both_parties_approved?: boolean | null
          by_agreement?: boolean | null
          cancelled_at?: string | null
          concept_ids?: string[]
          contact_info_shared_at?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deletion_reason?: string | null
          description?: string | null
          door_deal?: boolean | null
          door_percentage?: number | null
          end_date?: string | null
          end_time?: string | null
          event_admin_id?: string | null
          event_date?: string | null
          event_id?: string | null
          hospitality_rider?: string | null
          hospitality_rider_status?: string | null
          id?: string
          is_public_after_approval?: boolean | null
          last_modified_at?: string | null
          last_modified_by?: string | null
          latitude?: number | null
          longitude?: number | null
          personal_message?: string | null
          price_musician?: string | null
          price_ticket?: string | null
          public_visibility_settings?: Json | null
          published_at?: string | null
          published_by_receiver?: boolean | null
          published_by_sender?: boolean | null
          receiver_allowed_at?: string | null
          receiver_approved_at?: string | null
          receiver_confirmed?: boolean | null
          receiver_contact_info?: Json | null
          receiver_id?: string
          receiver_read_agreement?: boolean | null
          receiver_signature?: string | null
          receiver_signed_at?: string | null
          rejected_at?: string | null
          requires_approval?: boolean | null
          selected_concept_id?: string | null
          sender_approved_at?: string | null
          sender_confirmed?: boolean | null
          sender_contact_info?: Json | null
          sender_id?: string
          sender_read_agreement?: boolean | null
          sender_signature?: string | null
          sender_signed_at?: string | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          tech_spec?: string | null
          ticket_price?: number | null
          time?: string | null
          title?: string
          updated_at?: string | null
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events_market"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "bookings_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      concept_files: {
        Row: {
          concept_id: string
          created_at: string
          creator_id: string
          description: string | null
          file_path: string
          file_size: number | null
          file_type: string
          file_url: string | null
          filename: string
          id: string
          is_public: boolean
          mime_type: string | null
          thumbnail_path: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          concept_id: string
          created_at?: string
          creator_id: string
          description?: string | null
          file_path: string
          file_size?: number | null
          file_type: string
          file_url?: string | null
          filename: string
          id?: string
          is_public?: boolean
          mime_type?: string | null
          thumbnail_path?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          concept_id?: string
          created_at?: string
          creator_id?: string
          description?: string | null
          file_path?: string
          file_size?: number | null
          file_type?: string
          file_url?: string | null
          filename?: string
          id?: string
          is_public?: boolean
          mime_type?: string | null
          thumbnail_path?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "concept_files_concept_id_fkey"
            columns: ["concept_id"]
            isOneToOne: false
            referencedRelation: "concepts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_concept_files_creator_id"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      concepts: {
        Row: {
          available_dates: Json | null
          concept_type: string
          created_at: string
          description: string | null
          door_deal: boolean | null
          door_percentage: number | null
          expected_audience: number | null
          hospitality_rider_reference: string | null
          id: string
          is_published: boolean
          maker_id: string
          price: number | null
          price_by_agreement: boolean | null
          program_type: string | null
          public_visibility_settings: Json | null
          status: string | null
          teaching_data: Json | null
          tech_spec: string | null
          tech_spec_reference: string | null
          ticket_price: number | null
          title: string
          updated_at: string
        }
        Insert: {
          available_dates?: Json | null
          concept_type?: string
          created_at?: string
          description?: string | null
          door_deal?: boolean | null
          door_percentage?: number | null
          expected_audience?: number | null
          hospitality_rider_reference?: string | null
          id?: string
          is_published?: boolean
          maker_id: string
          price?: number | null
          price_by_agreement?: boolean | null
          program_type?: string | null
          public_visibility_settings?: Json | null
          status?: string | null
          teaching_data?: Json | null
          tech_spec?: string | null
          tech_spec_reference?: string | null
          ticket_price?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          available_dates?: Json | null
          concept_type?: string
          created_at?: string
          description?: string | null
          door_deal?: boolean | null
          door_percentage?: number | null
          expected_audience?: number | null
          hospitality_rider_reference?: string | null
          id?: string
          is_published?: boolean
          maker_id?: string
          price?: number | null
          price_by_agreement?: boolean | null
          program_type?: string | null
          public_visibility_settings?: Json | null
          status?: string | null
          teaching_data?: Json | null
          tech_spec?: string | null
          tech_spec_reference?: string | null
          ticket_price?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "concepts_maker_id_fkey"
            columns: ["maker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      concepts_history: {
        Row: {
          available_dates: Json | null
          description: string | null
          expected_audience: number | null
          id: string
          maker_id: string
          original_concept_id: string
          original_created_at: string
          original_data: Json | null
          price: number | null
          rejected_at: string
          rejected_by: string
          rejection_reason: string | null
          status: string
          tech_spec: string | null
          title: string
        }
        Insert: {
          available_dates?: Json | null
          description?: string | null
          expected_audience?: number | null
          id?: string
          maker_id: string
          original_concept_id: string
          original_created_at: string
          original_data?: Json | null
          price?: number | null
          rejected_at?: string
          rejected_by: string
          rejection_reason?: string | null
          status?: string
          tech_spec?: string | null
          title: string
        }
        Update: {
          available_dates?: Json | null
          description?: string | null
          expected_audience?: number | null
          id?: string
          maker_id?: string
          original_concept_id?: string
          original_created_at?: string
          original_data?: Json | null
          price?: number | null
          rejected_at?: string
          rejected_by?: string
          rejection_reason?: string | null
          status?: string
          tech_spec?: string | null
          title?: string
        }
        Relationships: []
      }
      events_market: {
        Row: {
          address: string | null
          banner_url: string | null
          booking_id: string | null
          created_at: string | null
          created_by: string | null
          date: string
          description: string | null
          end_time: string | null
          event_datetime: string | null
          expected_audience: number | null
          gallery_images: Json | null
          gallery_videos: Json | null
          has_paid_tickets: boolean | null
          id: string
          is_public: boolean | null
          participants: Json | null
          portfolio_id: string | null
          receiver_profile_image: string | null
          sender_profile_image: string | null
          start_time: string | null
          status: string | null
          ticket_price: number | null
          time: string | null
          title: string
          venue: string | null
        }
        Insert: {
          address?: string | null
          banner_url?: string | null
          booking_id?: string | null
          created_at?: string | null
          created_by?: string | null
          date: string
          description?: string | null
          end_time?: string | null
          event_datetime?: string | null
          expected_audience?: number | null
          gallery_images?: Json | null
          gallery_videos?: Json | null
          has_paid_tickets?: boolean | null
          id?: string
          is_public?: boolean | null
          participants?: Json | null
          portfolio_id?: string | null
          receiver_profile_image?: string | null
          sender_profile_image?: string | null
          start_time?: string | null
          status?: string | null
          ticket_price?: number | null
          time?: string | null
          title: string
          venue?: string | null
        }
        Update: {
          address?: string | null
          banner_url?: string | null
          booking_id?: string | null
          created_at?: string | null
          created_by?: string | null
          date?: string
          description?: string | null
          end_time?: string | null
          event_datetime?: string | null
          expected_audience?: number | null
          gallery_images?: Json | null
          gallery_videos?: Json | null
          has_paid_tickets?: boolean | null
          id?: string
          is_public?: boolean | null
          participants?: Json | null
          portfolio_id?: string | null
          receiver_profile_image?: string | null
          sender_profile_image?: string | null
          start_time?: string | null
          status?: string | null
          ticket_price?: number | null
          time?: string | null
          title?: string
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_market_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_market_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "events_market_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "profile_portfolio"
            referencedColumns: ["id"]
          },
        ]
      }
      file_usage: {
        Row: {
          created_at: string | null
          file_id: string
          id: string
          reference_id: string | null
          usage_type: string
        }
        Insert: {
          created_at?: string | null
          file_id: string
          id?: string
          reference_id?: string | null
          usage_type: string
        }
        Update: {
          created_at?: string | null
          file_id?: string
          id?: string
          reference_id?: string | null
          usage_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "file_usage_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "user_files"
            referencedColumns: ["id"]
          },
        ]
      }
      hospitality_riders: {
        Row: {
          created_at: string
          file_path: string
          file_size: number | null
          file_type: string
          file_url: string
          filename: string
          id: string
          mime_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_path: string
          file_size?: number | null
          file_type?: string
          file_url: string
          filename?: string
          id?: string
          mime_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_path?: string
          file_size?: number | null
          file_type?: string
          file_url?: string
          filename?: string
          id?: string
          mime_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string
          read: boolean
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message: string
          read?: boolean
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          read?: boolean
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profile_portfolio: {
        Row: {
          created_at: string
          description: string | null
          file_path: string
          file_size: number | null
          file_type: string
          file_url: string | null
          filename: string
          id: string
          is_public: boolean
          mime_type: string | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_path: string
          file_size?: number | null
          file_type: string
          file_url?: string | null
          filename: string
          id?: string
          is_public?: boolean
          mime_type?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          file_path?: string
          file_size?: number | null
          file_type?: string
          file_url?: string | null
          filename?: string
          id?: string
          is_public?: boolean
          mime_type?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profile_settings: {
        Row: {
          created_at: string
          id: string
          maker_id: string
          notifications_band_invites: boolean | null
          notifications_booking_requests: boolean
          show_about: boolean | null
          show_contact: boolean
          show_events: boolean | null
          show_on_map: boolean
          show_portfolio: boolean | null
          show_public_profile: boolean
          show_techspec: boolean | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          maker_id: string
          notifications_band_invites?: boolean | null
          notifications_booking_requests?: boolean
          show_about?: boolean | null
          show_contact?: boolean
          show_events?: boolean | null
          show_on_map?: boolean
          show_portfolio?: boolean | null
          show_public_profile?: boolean
          show_techspec?: boolean | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          maker_id?: string
          notifications_band_invites?: boolean | null
          notifications_booking_requests?: boolean
          show_about?: boolean | null
          show_contact?: boolean
          show_events?: boolean | null
          show_on_map?: boolean
          show_portfolio?: boolean | null
          show_public_profile?: boolean
          show_techspec?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_settings_maker_id_fkey"
            columns: ["maker_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profile_tech_specs: {
        Row: {
          created_at: string
          file_path: string
          file_size: number | null
          file_type: string
          file_url: string
          filename: string
          id: string
          mime_type: string | null
          profile_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          file_path: string
          file_size?: number | null
          file_type?: string
          file_url: string
          filename?: string
          id?: string
          mime_type?: string | null
          profile_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          file_path?: string
          file_size?: number | null
          file_type?: string
          file_url?: string
          filename?: string
          id?: string
          mime_type?: string | null
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_tech_specs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          bio: string | null
          contact_info: Json | null
          created_at: string
          dashboard_background_images: string[] | null
          display_name: string
          id: string
          instruments: Json | null
          is_address_public: boolean
          latitude: number | null
          longitude: number | null
          privacy_settings: Json | null
          randomize_backgrounds: boolean | null
          role: Database["public"]["Enums"]["user_role"]
          social_media_links: Json | null
          updated_at: string
          user_id: string
          username: string
          username_changed: boolean | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          bio?: string | null
          contact_info?: Json | null
          created_at?: string
          dashboard_background_images?: string[] | null
          display_name: string
          id?: string
          instruments?: Json | null
          is_address_public?: boolean
          latitude?: number | null
          longitude?: number | null
          privacy_settings?: Json | null
          randomize_backgrounds?: boolean | null
          role?: Database["public"]["Enums"]["user_role"]
          social_media_links?: Json | null
          updated_at?: string
          user_id: string
          username: string
          username_changed?: boolean | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          bio?: string | null
          contact_info?: Json | null
          created_at?: string
          dashboard_background_images?: string[] | null
          display_name?: string
          id?: string
          instruments?: Json | null
          is_address_public?: boolean
          latitude?: number | null
          longitude?: number | null
          privacy_settings?: Json | null
          randomize_backgrounds?: boolean | null
          role?: Database["public"]["Enums"]["user_role"]
          social_media_links?: Json | null
          updated_at?: string
          user_id?: string
          username?: string
          username_changed?: boolean | null
        }
        Relationships: []
      }
      purchases: {
        Row: {
          id: string
          price_paid: number
          purchased_at: string | null
          track_id: string
          user_id: string
          version_purchased: number
        }
        Insert: {
          id?: string
          price_paid: number
          purchased_at?: string | null
          track_id: string
          user_id: string
          version_purchased: number
        }
        Update: {
          id?: string
          price_paid?: number
          purchased_at?: string | null
          track_id?: string
          user_id?: string
          version_purchased?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchases_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      stems: {
        Row: {
          created_at: string | null
          duration: number | null
          file_path: string
          file_size: number | null
          file_url: string
          group_tag: string
          id: string
          is_default: boolean | null
          name: string
          price: number | null
          project_id: string | null
          track_id: string
          updated_at: string | null
          version: number | null
        }
        Insert: {
          created_at?: string | null
          duration?: number | null
          file_path: string
          file_size?: number | null
          file_url: string
          group_tag: string
          id?: string
          is_default?: boolean | null
          name: string
          price?: number | null
          project_id?: string | null
          track_id: string
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          created_at?: string | null
          duration?: number | null
          file_path?: string
          file_size?: number | null
          file_url?: string
          group_tag?: string
          id?: string
          is_default?: boolean | null
          name?: string
          price?: number | null
          project_id?: string | null
          track_id?: string
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stems_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          checked_in_by: string | null
          created_at: string | null
          event_id: string | null
          id: string
          purchased_at: string | null
          qr_code_data: string
          scanned_at: string | null
          scanned_by: string | null
          status: string | null
          ticket_code: string
          used_at: string | null
          user_id: string | null
        }
        Insert: {
          checked_in_by?: string | null
          created_at?: string | null
          event_id?: string | null
          id?: string
          purchased_at?: string | null
          qr_code_data: string
          scanned_at?: string | null
          scanned_by?: string | null
          status?: string | null
          ticket_code: string
          used_at?: string | null
          user_id?: string | null
        }
        Update: {
          checked_in_by?: string | null
          created_at?: string | null
          event_id?: string | null
          id?: string
          purchased_at?: string | null
          qr_code_data?: string
          scanned_at?: string | null
          scanned_by?: string | null
          status?: string | null
          ticket_code?: string
          used_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events_market"
            referencedColumns: ["id"]
          },
        ]
      }
      track_files: {
        Row: {
          created_at: string | null
          duration: number | null
          file_path: string
          file_type: string
          file_url: string
          id: string
          preview_end: number | null
          preview_start: number | null
          track_id: string
          version: number | null
        }
        Insert: {
          created_at?: string | null
          duration?: number | null
          file_path: string
          file_type: string
          file_url: string
          id?: string
          preview_end?: number | null
          preview_start?: number | null
          track_id: string
          version?: number | null
        }
        Update: {
          created_at?: string | null
          duration?: number | null
          file_path?: string
          file_type?: string
          file_url?: string
          id?: string
          preview_end?: number | null
          preview_start?: number | null
          track_id?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "track_files_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      track_versions: {
        Row: {
          created_at: string | null
          id: string
          master_file_path: string | null
          preview_file_path: string | null
          published_at: string | null
          stems_data: Json | null
          track_id: string
          version: number
          version_notes: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          master_file_path?: string | null
          preview_file_path?: string | null
          published_at?: string | null
          stems_data?: Json | null
          track_id: string
          version: number
          version_notes?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          master_file_path?: string | null
          preview_file_path?: string | null
          published_at?: string | null
          stems_data?: Json | null
          track_id?: string
          version?: number
          version_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "track_versions_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      tracks: {
        Row: {
          alignment_status: string | null
          approved: boolean | null
          bpm: number | null
          created_at: string | null
          current_version: number | null
          description: string | null
          final_mix_score: number | null
          genre: string | null
          id: string
          is_subscription_friendly: boolean | null
          key: string | null
          license_type: string | null
          price: number | null
          project_id: string | null
          quality_status: string | null
          review_notes: string | null
          rights_type: string | null
          status: string | null
          title: string
          updated_at: string | null
          upload_mode: string | null
          user_id: string
          version: number | null
          version_notes: string | null
        }
        Insert: {
          alignment_status?: string | null
          approved?: boolean | null
          bpm?: number | null
          created_at?: string | null
          current_version?: number | null
          description?: string | null
          final_mix_score?: number | null
          genre?: string | null
          id?: string
          is_subscription_friendly?: boolean | null
          key?: string | null
          license_type?: string | null
          price?: number | null
          project_id?: string | null
          quality_status?: string | null
          review_notes?: string | null
          rights_type?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          upload_mode?: string | null
          user_id: string
          version?: number | null
          version_notes?: string | null
        }
        Update: {
          alignment_status?: string | null
          approved?: boolean | null
          bpm?: number | null
          created_at?: string | null
          current_version?: number | null
          description?: string | null
          final_mix_score?: number | null
          genre?: string | null
          id?: string
          is_subscription_friendly?: boolean | null
          key?: string | null
          license_type?: string | null
          price?: number | null
          project_id?: string | null
          quality_status?: string | null
          review_notes?: string | null
          rights_type?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          upload_mode?: string | null
          user_id?: string
          version?: number | null
          version_notes?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount_nok: number
          created_at: string | null
          event_id: string | null
          id: string
          status: string | null
          stripe_payment_id: string
          ticket_id: string | null
          user_id: string | null
        }
        Insert: {
          amount_nok: number
          created_at?: string | null
          event_id?: string | null
          id?: string
          status?: string | null
          stripe_payment_id: string
          ticket_id?: string | null
          user_id?: string | null
        }
        Update: {
          amount_nok?: number
          created_at?: string | null
          event_id?: string | null
          id?: string
          status?: string | null
          stripe_payment_id?: string
          ticket_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_files: {
        Row: {
          bucket_name: string | null
          category: string
          created_at: string | null
          file_path: string
          file_size: number | null
          file_type: string
          file_url: string | null
          filename: string
          id: string
          is_public: boolean | null
          mime_type: string | null
          thumbnail_path: string | null
          thumbnail_url: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bucket_name?: string | null
          category?: string
          created_at?: string | null
          file_path: string
          file_size?: number | null
          file_type: string
          file_url?: string | null
          filename: string
          id?: string
          is_public?: boolean | null
          mime_type?: string | null
          thumbnail_path?: string | null
          thumbnail_url?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bucket_name?: string | null
          category?: string
          created_at?: string | null
          file_path?: string
          file_size?: number | null
          file_type?: string
          file_url?: string | null
          filename?: string
          id?: string
          is_public?: boolean | null
          mime_type?: string | null
          thumbnail_path?: string | null
          thumbnail_url?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_band_invite: { Args: { invite_id: string }; Returns: undefined }
      can_access_contact_info: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      can_create_band: { Args: { user_id: string }; Returns: boolean }
      clean_booking_sensitive_data: {
        Args: { booking_uuid: string }
        Returns: undefined
      }
      delete_auth_user: { Args: never; Returns: undefined }
      delete_band_permanently:
        | { Args: { band_uuid: string }; Returns: undefined }
        | {
            Args: { band_uuid: string; requesting_user_id: string }
            Returns: undefined
          }
      delete_cancelled_booking: {
        Args: { booking_uuid: string }
        Returns: undefined
      }
      delete_concept_file: { Args: { file_id: string }; Returns: undefined }
      delete_hospitality_rider: {
        Args: { file_id: string }
        Returns: undefined
      }
      delete_portfolio_file: { Args: { file_id: string }; Returns: undefined }
      delete_tech_spec_file: { Args: { file_id: string }; Returns: undefined }
      delete_user_data:
        | { Args: { user_uuid: string }; Returns: undefined }
        | {
            Args: { requesting_user_id: string; user_uuid: string }
            Returns: undefined
          }
      get_all_visible_artists: {
        Args: never
        Returns: {
          address: string
          avatar_url: string
          bio: string
          created_at: string
          display_name: string
          id: string
          is_address_public: boolean
          latitude: number
          longitude: number
          role: string
          user_id: string
        }[]
      }
      get_booking_for_viewer: {
        Args: { booking_id: string; viewer_id?: string }
        Returns: {
          allowed_at: string
          approved_at: string
          artist_fee: number
          contact_info: Json
          created_at: string
          description: string
          event_date: string
          hospitality_rider: string
          id: string
          is_viewer_receiver: boolean
          is_viewer_sender: boolean
          personal_message: string
          price_musician: string
          published_at: string
          receiver_id: string
          sender_id: string
          status: string
          title: string
          venue: string
        }[]
      }
      get_contact_info_with_audit: {
        Args: { requesting_user_id?: string; target_user_id: string }
        Returns: Json
      }
      get_current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_file_usage_summary: {
        Args: { p_file_id: string }
        Returns: {
          count: number
          reference_id: string
          usage_type: string
        }[]
      }
      get_profile_visibility: {
        Args: { maker_uuid: string }
        Returns: {
          show_about: boolean
          show_contact: boolean
          show_events: boolean
          show_portfolio: boolean
          show_techspec: boolean
        }[]
      }
      get_public_artists_for_explore: {
        Args: never
        Returns: {
          address: string
          avatar_url: string
          bio: string
          created_at: string
          display_name: string
          id: string
          is_address_public: boolean
          latitude: number
          longitude: number
          privacy_settings: Json
          role: string
          user_id: string
          username: string
        }[]
      }
      get_public_booking_data: {
        Args: { booking_uuid: string }
        Returns: {
          audience_estimate: number
          created_at: string
          description: string
          event_date: string
          event_time: string
          id: string
          published_at: string
          receiver_id: string
          sender_id: string
          title: string
          venue: string
        }[]
      }
      get_public_booking_info: {
        Args: { booking_uuid: string }
        Returns: {
          created_at: string
          description: string
          event_date: string
          event_time: string
          expected_audience: number
          id: string
          is_public: boolean
          ticket_price: number
          title: string
          venue: string
        }[]
      }
      get_public_profile: {
        Args: { target_user_id: string }
        Returns: {
          address: string
          avatar_url: string
          bio: string
          created_at: string
          display_name: string
          id: string
          instruments: Json
          is_address_public: boolean
          latitude: number
          longitude: number
          role: string
          social_media_links: Json
          user_id: string
          username: string
        }[]
      }
      get_safe_profile_fields: {
        Args: { viewed_user_id: string; viewer_user_id?: string }
        Returns: {
          address: string
          avatar_url: string
          bio: string
          contact_info: Json
          created_at: string
          display_name: string
          id: string
          is_address_public: boolean
          latitude: number
          longitude: number
          role: string
          user_id: string
        }[]
      }
      get_safe_public_booking_data: {
        Args: { booking_uuid: string }
        Returns: {
          created_at: string
          description: string
          event_date: string
          id: string
          receiver_id: string
          sender_id: string
          title: string
          venue: string
        }[]
      }
      get_safe_public_profile_data: {
        Args: { target_user_id: string }
        Returns: {
          avatar_url: string
          bio: string
          created_at: string
          display_name: string
          id: string
          role: string
          user_id: string
        }[]
      }
      get_secure_profile_data: {
        Args: { target_user_id: string; viewer_role?: string }
        Returns: {
          address: string
          avatar_url: string
          bio: string
          contact_info: Json
          created_at: string
          display_name: string
          id: string
          is_address_public: boolean
          latitude: number
          longitude: number
          role: string
          user_id: string
        }[]
      }
      has_active_booking_with_user: {
        Args: { target_user_id: string; viewer_user_id?: string }
        Returns: boolean
      }
      is_artist: { Args: { user_uuid: string }; Returns: boolean }
      is_booking_public: { Args: { booking_uuid: string }; Returns: boolean }
      is_file_in_portfolio: { Args: { file_uuid: string }; Returns: boolean }
      is_portfolio_file_in_user_booking: {
        Args: { p_portfolio_file_id: string; p_user_id: string }
        Returns: boolean
      }
      is_portfolio_file_owned_by_user: {
        Args: { p_portfolio_file_id: string; p_user_id: string }
        Returns: boolean
      }
      is_user_booking_party: {
        Args: { p_booking_id: string; p_user_id: string }
        Returns: boolean
      }
      log_sensitive_access: {
        Args: {
          p_action: string
          p_record_id?: string
          p_sensitive_fields?: string[]
          p_table_name?: string
          p_user_id: string
        }
        Returns: undefined
      }
      migrate_file_to_filbank: {
        Args: {
          file_id: string
          old_bucket: string
          old_path: string
          user_id: string
        }
        Returns: boolean
      }
      permanently_delete_any_booking: {
        Args: { booking_uuid: string }
        Returns: undefined
      }
      permanently_delete_booking: {
        Args: { booking_uuid: string }
        Returns: undefined
      }
      permanently_delete_booking_with_relations: {
        Args: { booking_uuid: string }
        Returns: undefined
      }
      process_scheduled_deletions: { Args: never; Returns: undefined }
      reject_booking_request: {
        Args: { booking_uuid: string }
        Returns: undefined
      }
    }
    Enums: {
      booking_status:
        | "pending"
        | "allowed"
        | "both_parties_approved"
        | "upcoming"
        | "completed"
        | "cancelled"
        | "approved_by_sender"
        | "approved_by_receiver"
        | "approved_by_both"
      user_role: "artist" | "audience" | "musician" | "organizer"
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
      booking_status: [
        "pending",
        "allowed",
        "both_parties_approved",
        "upcoming",
        "completed",
        "cancelled",
        "approved_by_sender",
        "approved_by_receiver",
        "approved_by_both",
      ],
      user_role: ["artist", "audience", "musician", "organizer"],
    },
  },
} as const
