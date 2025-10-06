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
      action_history: {
        Row: {
          action_type: string
          created_at: string
          description: string
          id: string
          incident_id: string
          new_values: Json | null
          old_values: Json | null
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          description: string
          id?: string
          incident_id: string
          new_values?: Json | null
          old_values?: Json | null
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          description?: string
          id?: string
          incident_id?: string
          new_values?: Json | null
          old_values?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "action_history_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      drivers: {
        Row: {
          cnh: string | null
          cnh_expiry: string | null
          cnh_pdf_url: string | null
          cpf: string
          created_at: string | null
          full_name: string
          id: string
          omnilink_score_expiry_date: string | null
          omnilink_score_registration_date: string | null
          omnilink_score_status: string | null
          phone: string | null
          reason_nao_indicacao: string | null
          status_indicacao: string | null
          type: string | null
        }
        Insert: {
          cnh?: string | null
          cnh_expiry?: string | null
          cnh_pdf_url?: string | null
          cpf: string
          created_at?: string | null
          full_name: string
          id?: string
          omnilink_score_expiry_date?: string | null
          omnilink_score_registration_date?: string | null
          omnilink_score_status?: string | null
          phone?: string | null
          reason_nao_indicacao?: string | null
          status_indicacao?: string | null
          type?: string | null
        }
        Update: {
          cnh?: string | null
          cnh_expiry?: string | null
          cnh_pdf_url?: string | null
          cpf?: string
          created_at?: string | null
          full_name?: string
          id?: string
          omnilink_score_expiry_date?: string | null
          omnilink_score_registration_date?: string | null
          omnilink_score_status?: string | null
          phone?: string | null
          reason_nao_indicacao?: string | null
          status_indicacao?: string | null
          type?: string | null
        }
        Relationships: []
      }
      drivers_pending_approval: {
        Row: {
          cnh: string | null
          cnh_expiry: string | null
          cnh_pdf_url: string | null
          cpf: string
          created_at: string | null
          full_name: string
          id: string
          omnilink_score_expiry_date: string | null
          omnilink_score_registration_date: string | null
          omnilink_score_status: string | null
          original_driver_id: string | null
          phone: string | null
          reason: string | null
          reason_nao_indicacao: string | null
          status: string
          status_indicacao: string | null
          type: string | null
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          cnh?: string | null
          cnh_expiry?: string | null
          cnh_pdf_url?: string | null
          cpf: string
          created_at?: string | null
          full_name: string
          id?: string
          omnilink_score_expiry_date?: string | null
          omnilink_score_registration_date?: string | null
          omnilink_score_status?: string | null
          original_driver_id?: string | null
          phone?: string | null
          reason?: string | null
          reason_nao_indicacao?: string | null
          status?: string
          status_indicacao?: string | null
          type?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          cnh?: string | null
          cnh_expiry?: string | null
          cnh_pdf_url?: string | null
          cpf?: string
          created_at?: string | null
          full_name?: string
          id?: string
          omnilink_score_expiry_date?: string | null
          omnilink_score_registration_date?: string | null
          omnilink_score_status?: string | null
          original_driver_id?: string | null
          phone?: string | null
          reason?: string | null
          reason_nao_indicacao?: string | null
          status?: string
          status_indicacao?: string | null
          type?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "drivers_pending_approval_original_driver_id_fkey"
            columns: ["original_driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_comments: {
        Row: {
          comment: string
          created_at: string
          id: string
          incident_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          comment: string
          created_at?: string
          id?: string
          incident_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          incident_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_comments_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          assigned_to: string | null
          bo_number: string | null
          corrective_actions: string | null
          cost_estimate: number | null
          created_at: string
          date_occurred: string | null
          description: string | null
          details: Json | null
          evidence_files: string[] | null
          id: string
          incident_number: string | null
          incident_type: string | null
          location: string | null
          preventive_actions: string | null
          reported_by: string
          resolved_at: string | null
          root_cause: string | null
          severity: string | null
          status: string
          title: string | null
          updated_at: string
          witnesses: string[] | null
        }
        Insert: {
          assigned_to?: string | null
          bo_number?: string | null
          corrective_actions?: string | null
          cost_estimate?: number | null
          created_at?: string
          date_occurred?: string | null
          description?: string | null
          details?: Json | null
          evidence_files?: string[] | null
          id?: string
          incident_number?: string | null
          incident_type?: string | null
          location?: string | null
          preventive_actions?: string | null
          reported_by: string
          resolved_at?: string | null
          root_cause?: string | null
          severity?: string | null
          status?: string
          title?: string | null
          updated_at?: string
          witnesses?: string[] | null
        }
        Update: {
          assigned_to?: string | null
          bo_number?: string | null
          corrective_actions?: string | null
          cost_estimate?: number | null
          created_at?: string
          date_occurred?: string | null
          description?: string | null
          details?: Json | null
          evidence_files?: string[] | null
          id?: string
          incident_number?: string | null
          incident_type?: string | null
          location?: string | null
          preventive_actions?: string | null
          reported_by?: string
          resolved_at?: string | null
          root_cause?: string | null
          severity?: string | null
          status?: string
          title?: string | null
          updated_at?: string
          witnesses?: string[] | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          cnh: string | null
          cnh_expiry: string | null
          created_at: string
          department: string | null
          email: string | null
          full_name: string
          id: string
          is_active: boolean
          phone: string | null
          position: string | null
          role: string
          updated_at: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          cnh?: string | null
          cnh_expiry?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          full_name: string
          id?: string
          is_active?: boolean
          phone?: string | null
          position?: string | null
          role?: string
          updated_at?: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          cnh?: string | null
          cnh_expiry?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          phone?: string | null
          position?: string | null
          role?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      generated_reports: {
        Row: {
          end_date: string | null
          file_name: string | null
          file_url: string | null
          generated_at: string | null
          generated_by: string | null
          id: string
          metadata: Json | null
          report_type: string
          start_date: string | null
        }
        Insert: {
          end_date?: string | null
          file_name?: string | null
          file_url?: string | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          metadata?: Json | null
          report_type: string
          start_date?: string | null
        }
        Update: {
          end_date?: string | null
          file_name?: string | null
          file_url?: string | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          metadata?: Json | null
          report_type?: string
          start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "generated_reports_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      role_page_permissions: {
        Row: {
          created_at: string | null
          id: string
          is_visible: boolean | null
          page_id: string
          role: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_visible?: boolean | null
          page_id: string
          role: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_visible?: boolean | null
          page_id?: string
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_page_permissions: {
        Row: {
          created_at: string | null
          id: string
          is_visible: boolean
          page_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_visible?: boolean
          page_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_visible?: boolean
          page_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          blocker_installed: boolean | null
          created_at: string | null
          id: string
          model: string
          plate: string
          priority: number | null
          technology: string[] | null
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          blocker_installed?: boolean | null
          created_at?: string | null
          id?: string
          model: string
          plate: string
          priority?: number | null
          technology?: string[] | null
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          blocker_installed?: boolean | null
          created_at?: string | null
          id?: string
          model?: string
          plate?: string
          priority?: number | null
          technology?: string[] | null
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles_pending_approval: {
        Row: {
          blocker_installed: boolean | null
          created_at: string | null
          id: string
          model: string
          original_vehicle_id: string | null
          plate: string
          priority: number | null
          reason: string | null
          status: string
          technology: string[] | null
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          blocker_installed?: boolean | null
          created_at?: string | null
          id?: string
          model: string
          original_vehicle_id?: string | null
          plate: string
          priority?: number | null
          reason?: string | null
          status?: string
          technology?: string[] | null
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          blocker_installed?: boolean | null
          created_at?: string | null
          id?: string
          model?: string
          original_vehicle_id?: string | null
          plate?: string
          priority?: number | null
          reason?: string | null
          status?: string
          technology?: string[] | null
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_pending_approval_original_vehicle_id_fkey"
            columns: ["original_vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_pending_approval_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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