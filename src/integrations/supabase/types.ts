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
          user_id: string
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
          user_id: string
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
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "concept_files_concept_id_fkey"
            columns: ["concept_id"]
            isOneToOne: false
            referencedRelation: "concepts"
            referencedColumns: ["id"]
          },
        ]
      }
      concepts: {
        Row: {
          available_dates: Json | null
          created_at: string
          description: string | null
          expected_audience: number | null
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
      portfolio: {
        Row: {
          created_at: string | null
          description: string | null
          file_url: string | null
          id: number
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          file_url?: string | null
          id?: never
          title: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          file_url?: string | null
          id?: never
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      portfolio_items: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_public: boolean | null
          maker_id: string
          media_type: string | null
          media_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          maker_id: string
          media_type?: string | null
          media_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          maker_id?: string
          media_type?: string | null
          media_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_items_maker_id_fkey"
            columns: ["maker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profile_files: {
        Row: {
          created_at: string | null
          file_url: string
          id: number
          title: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          file_url: string
          id?: never
          title?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          file_url?: string
          id?: never
          title?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profile_images: {
        Row: {
          created_at: string | null
          file_url: string | null
          id: number
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          file_url?: string | null
          id?: never
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          file_url?: string | null
          id?: never
          user_id?: string | null
        }
        Relationships: []
      }
      profile_picture: {
        Row: {
          created_at: string | null
          file_url: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          file_url?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          file_url?: string | null
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
          creator_id: string
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string
          file_url: string
          id: string
          mime_type: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string
          file_url: string
          id?: string
          mime_type?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string
          file_url?: string
          id?: string
          mime_type?: string | null
          updated_at?: string
        }
        Relationships: []
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
      is_maker: {
        Args: { user_uuid: string }
        Returns: boolean
      }
    }
    Enums: {
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
      user_role: ["maker", "goer"],
    },
  },
} as const
