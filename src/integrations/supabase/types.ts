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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
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
      bookings: {
        Row: {
          agreement_summary_text: string | null
          allowed_at: string | null
          approved_at: string | null
          artist_fee: number | null
          audience_estimate: number | null
          both_parties_approved: boolean | null
          cancelled_at: string | null
          concept_ids: string[]
          contact_info_shared_at: string | null
          created_at: string | null
          deleted_at: string | null
          deletion_reason: string | null
          description: string | null
          event_date: string | null
          hospitality_rider: string | null
          hospitality_rider_status: string | null
          id: string
          is_public_after_approval: boolean | null
          last_modified_at: string | null
          last_modified_by: string | null
          personal_message: string | null
          price_musician: string | null
          price_ticket: string | null
          public_visibility_settings: Json | null
          published_at: string | null
          receiver_allowed_at: string | null
          receiver_confirmed: boolean | null
          receiver_id: string
          receiver_read_agreement: boolean | null
          rejected_at: string | null
          requires_approval: boolean | null
          selected_concept_id: string | null
          sender_confirmed: boolean | null
          sender_contact_info: Json | null
          sender_id: string
          sender_read_agreement: boolean | null
          status: Database["public"]["Enums"]["booking_status"] | null
          tech_spec: string | null
          ticket_price: number | null
          time: string | null
          title: string
          updated_at: string | null
          venue: string | null
        }
        Insert: {
          agreement_summary_text?: string | null
          allowed_at?: string | null
          approved_at?: string | null
          artist_fee?: number | null
          audience_estimate?: number | null
          both_parties_approved?: boolean | null
          cancelled_at?: string | null
          concept_ids?: string[]
          contact_info_shared_at?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deletion_reason?: string | null
          description?: string | null
          event_date?: string | null
          hospitality_rider?: string | null
          hospitality_rider_status?: string | null
          id?: string
          is_public_after_approval?: boolean | null
          last_modified_at?: string | null
          last_modified_by?: string | null
          personal_message?: string | null
          price_musician?: string | null
          price_ticket?: string | null
          public_visibility_settings?: Json | null
          published_at?: string | null
          receiver_allowed_at?: string | null
          receiver_confirmed?: boolean | null
          receiver_id: string
          receiver_read_agreement?: boolean | null
          rejected_at?: string | null
          requires_approval?: boolean | null
          selected_concept_id?: string | null
          sender_confirmed?: boolean | null
          sender_contact_info?: Json | null
          sender_id: string
          sender_read_agreement?: boolean | null
          status?: Database["public"]["Enums"]["booking_status"] | null
          tech_spec?: string | null
          ticket_price?: number | null
          time?: string | null
          title: string
          updated_at?: string | null
          venue?: string | null
        }
        Update: {
          agreement_summary_text?: string | null
          allowed_at?: string | null
          approved_at?: string | null
          artist_fee?: number | null
          audience_estimate?: number | null
          both_parties_approved?: boolean | null
          cancelled_at?: string | null
          concept_ids?: string[]
          contact_info_shared_at?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deletion_reason?: string | null
          description?: string | null
          event_date?: string | null
          hospitality_rider?: string | null
          hospitality_rider_status?: string | null
          id?: string
          is_public_after_approval?: boolean | null
          last_modified_at?: string | null
          last_modified_by?: string | null
          personal_message?: string | null
          price_musician?: string | null
          price_ticket?: string | null
          public_visibility_settings?: Json | null
          published_at?: string | null
          receiver_allowed_at?: string | null
          receiver_confirmed?: boolean | null
          receiver_id?: string
          receiver_read_agreement?: boolean | null
          rejected_at?: string | null
          requires_approval?: boolean | null
          selected_concept_id?: string | null
          sender_confirmed?: boolean | null
          sender_contact_info?: Json | null
          sender_id?: string
          sender_read_agreement?: boolean | null
          status?: Database["public"]["Enums"]["booking_status"] | null
          tech_spec?: string | null
          ticket_price?: number | null
          time?: string | null
          title?: string
          updated_at?: string | null
          venue?: string | null
        }
        Relationships: [
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
          created_at: string
          description: string | null
          expected_audience: number | null
          hospitality_rider_reference: string | null
          id: string
          is_published: boolean
          maker_id: string
          price: number | null
          status: string | null
          tech_spec: string | null
          tech_spec_reference: string | null
          title: string
          updated_at: string
        }
        Insert: {
          available_dates?: Json | null
          created_at?: string
          description?: string | null
          expected_audience?: number | null
          hospitality_rider_reference?: string | null
          id?: string
          is_published?: boolean
          maker_id: string
          price?: number | null
          status?: string | null
          tech_spec?: string | null
          tech_spec_reference?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          available_dates?: Json | null
          created_at?: string
          description?: string | null
          expected_audience?: number | null
          hospitality_rider_reference?: string | null
          id?: string
          is_published?: boolean
          maker_id?: string
          price?: number | null
          status?: string | null
          tech_spec?: string | null
          tech_spec_reference?: string | null
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
          {
            foreignKeyName: "concepts_tech_spec_reference_fkey"
            columns: ["tech_spec_reference"]
            isOneToOne: false
            referencedRelation: "profile_tech_specs"
            referencedColumns: ["id"]
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
      events: {
        Row: {
          created_at: string
          description: string | null
          event_date: string | null
          id: string
          is_public: boolean | null
          location: string | null
          maker_id: string
          max_participants: number | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_date?: string | null
          id?: string
          is_public?: boolean | null
          location?: string | null
          maker_id: string
          max_participants?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          event_date?: string | null
          id?: string
          is_public?: boolean | null
          location?: string | null
          maker_id?: string
          max_participants?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_maker_id_fkey"
            columns: ["maker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      events_market: {
        Row: {
          created_at: string | null
          created_by: string | null
          date: string
          description: string | null
          event_datetime: string | null
          expected_audience: number | null
          id: string
          is_public: boolean | null
          portfolio_id: string | null
          ticket_price: number | null
          time: string | null
          title: string
          venue: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          date: string
          description?: string | null
          event_datetime?: string | null
          expected_audience?: number | null
          id?: string
          is_public?: boolean | null
          portfolio_id?: string | null
          ticket_price?: number | null
          time?: string | null
          title: string
          venue?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          date?: string
          description?: string | null
          event_datetime?: string | null
          expected_audience?: number | null
          id?: string
          is_public?: boolean | null
          portfolio_id?: string | null
          ticket_price?: number | null
          time?: string | null
          title?: string
          venue?: string | null
        }
        Relationships: [
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
          show_about: boolean
          show_contact: boolean
          show_events: boolean
          show_on_map: boolean
          show_portfolio: boolean
          show_techspec: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          maker_id: string
          show_about?: boolean
          show_contact?: boolean
          show_events?: boolean
          show_on_map?: boolean
          show_portfolio?: boolean
          show_techspec?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          maker_id?: string
          show_about?: boolean
          show_contact?: boolean
          show_events?: boolean
          show_on_map?: boolean
          show_portfolio?: boolean
          show_techspec?: boolean
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
          display_name: string
          id: string
          is_address_public: boolean
          latitude: number | null
          longitude: number | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          bio?: string | null
          contact_info?: Json | null
          created_at?: string
          display_name: string
          id?: string
          is_address_public?: boolean
          latitude?: number | null
          longitude?: number | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          bio?: string | null
          contact_info?: Json | null
          created_at?: string
          display_name?: string
          id?: string
          is_address_public?: boolean
          latitude?: number | null
          longitude?: number | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      clean_booking_sensitive_data: {
        Args: { booking_uuid: string }
        Returns: undefined
      }
      delete_user_data: {
        Args: { user_uuid: string }
        Returns: undefined
      }
      get_all_visible_makers: {
        Args: Record<PropertyKey, never>
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
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["user_role"]
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
      get_public_makers_for_explore: {
        Args: Record<PropertyKey, never>
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
      get_public_profile: {
        Args: { target_user_id: string }
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
      is_maker: {
        Args: { user_uuid: string }
        Returns: boolean
      }
    }
    Enums: {
      booking_status:
        | "draft"
        | "pending"
        | "allowed"
        | "approved"
        | "published"
        | "rejected"
        | "cancelled"
        | "confirmed"
        | "deleted"
      user_role: "maker" | "goer"
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
        "draft",
        "pending",
        "allowed",
        "approved",
        "published",
        "rejected",
        "cancelled",
        "confirmed",
        "deleted",
      ],
      user_role: ["maker", "goer"],
    },
  },
} as const
