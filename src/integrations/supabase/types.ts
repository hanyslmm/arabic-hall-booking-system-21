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
      academic_stages: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      attendance_records: {
        Row: {
          created_at: string | null
          created_by: string | null
          date: string
          id: string
          notes: string | null
          status: Database["public"]["Enums"]["attendance_status"] | null
          student_registration_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          date: string
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["attendance_status"] | null
          student_registration_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          date?: string
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["attendance_status"] | null
          student_registration_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_student_registration_id_fkey"
            columns: ["student_registration_id"]
            isOneToOne: false
            referencedRelation: "student_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_user_id: string | null
          created_at: string | null
          details: Json | null
          id: string
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string | null
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          academic_stage_id: string
          class_code: string | null
          class_fees: number | null
          created_at: string | null
          days_of_week: string[]
          end_date: string | null
          hall_id: string
          id: string
          is_custom_fee: boolean | null
          number_of_students: number | null
          start_date: string
          start_time: string
          status: string | null
          teacher_id: string
          updated_at: string | null
        }
        Insert: {
          academic_stage_id: string
          class_code?: string | null
          class_fees?: number | null
          created_at?: string | null
          days_of_week?: string[]
          end_date?: string | null
          hall_id: string
          id?: string
          is_custom_fee?: boolean | null
          number_of_students?: number | null
          start_date: string
          start_time: string
          status?: string | null
          teacher_id: string
          updated_at?: string | null
        }
        Update: {
          academic_stage_id?: string
          class_code?: string | null
          class_fees?: number | null
          created_at?: string | null
          days_of_week?: string[]
          end_date?: string | null
          hall_id?: string
          id?: string
          is_custom_fee?: boolean | null
          number_of_students?: number | null
          start_date?: string
          start_time?: string
          status?: string | null
          teacher_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_academic_stage_id_fkey"
            columns: ["academic_stage_id"]
            isOneToOne: false
            referencedRelation: "academic_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_hall_id_fkey"
            columns: ["hall_id"]
            isOneToOne: false
            referencedRelation: "halls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      halls: {
        Row: {
          capacity: number
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          capacity?: number
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          capacity?: number
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          read: boolean | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          read?: boolean | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_records: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          notes: string | null
          payment_date: string | null
          payment_method: string | null
          student_registration_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          student_registration_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          student_registration_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_records_student_registration_id_fkey"
            columns: ["student_registration_id"]
            isOneToOne: false
            referencedRelation: "student_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          phone: string | null
          role: string | null
          teacher_id: string | null
          updated_at: string | null
          user_role: Database["public"]["Enums"]["user_role"] | null
          username: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          phone?: string | null
          role?: string | null
          teacher_id?: string | null
          updated_at?: string | null
          user_role?: Database["public"]["Enums"]["user_role"] | null
          username?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: string | null
          teacher_id?: string | null
          updated_at?: string | null
          user_role?: Database["public"]["Enums"]["user_role"] | null
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          key: string
          updated_at: string | null
          value: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: string | null
        }
        Relationships: []
      }
      student_registrations: {
        Row: {
          booking_id: string
          created_at: string | null
          id: string
          notes: string | null
          paid_amount: number | null
          payment_status: string | null
          registration_date: string | null
          student_id: string
          total_fees: number | null
        }
        Insert: {
          booking_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          paid_amount?: number | null
          payment_status?: string | null
          registration_date?: string | null
          student_id: string
          total_fees?: number | null
        }
        Update: {
          booking_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          paid_amount?: number | null
          payment_status?: string | null
          registration_date?: string | null
          student_id?: string
          total_fees?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "student_registrations_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_registrations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          academic_stage_id: string | null
          city: string | null
          created_at: string | null
          id: string
          mobile_phone: string | null
          name: string
          parent_phone: string | null
          serial_number: string | null
        }
        Insert: {
          academic_stage_id?: string | null
          city?: string | null
          created_at?: string | null
          id?: string
          mobile_phone?: string | null
          name: string
          parent_phone?: string | null
          serial_number?: string | null
        }
        Update: {
          academic_stage_id?: string | null
          city?: string | null
          created_at?: string | null
          id?: string
          mobile_phone?: string | null
          name?: string
          parent_phone?: string | null
          serial_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_academic_stage_id_fkey"
            columns: ["academic_stage_id"]
            isOneToOne: false
            referencedRelation: "academic_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      teachers: {
        Row: {
          created_at: string | null
          default_class_fee: number | null
          id: string
          mobile_phone: string | null
          name: string
          subject_id: string | null
          teacher_code: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          default_class_fee?: number | null
          id?: string
          mobile_phone?: string | null
          name: string
          subject_id?: string | null
          teacher_code?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          default_class_fee?: number | null
          id?: string
          mobile_phone?: string | null
          name?: string
          subject_id?: string | null
          teacher_code?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teachers_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          category: string
          created_at: string | null
          created_by: string | null
          date: string | null
          description: string | null
          id: string
          student_registration_id: string | null
          type: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string | null
          created_by?: string | null
          date?: string | null
          description?: string | null
          id?: string
          student_registration_id?: string | null
          type: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string | null
          created_by?: string | null
          date?: string | null
          description?: string | null
          id?: string
          student_registration_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_student_registration_id_fkey"
            columns: ["student_registration_id"]
            isOneToOne: false
            referencedRelation: "student_registrations"
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
      app_role: "ADMIN" | "USER"
      attendance_status: "present" | "absent" | "late"
      payment_status: "pending" | "partial" | "paid"
      user_role:
        | "owner"
        | "manager"
        | "teacher"
        | "receptionist"
        | "space_manager"
        | "read_only"
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
      app_role: ["ADMIN", "USER"],
      attendance_status: ["present", "absent", "late"],
      payment_status: ["pending", "partial", "paid"],
      user_role: [
        "owner",
        "manager",
        "teacher",
        "receptionist",
        "space_manager",
        "read_only",
      ],
    },
  },
} as const
