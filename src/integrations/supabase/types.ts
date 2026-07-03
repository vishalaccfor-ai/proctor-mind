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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      exam_attempts: {
        Row: {
          answers: Json
          created_at: string
          exam_id: string
          id: string
          started_at: string
          status: string
          submitted_at: string | null
          tab_switch_count: number
          user_id: string
        }
        Insert: {
          answers?: Json
          created_at?: string
          exam_id: string
          id?: string
          started_at?: string
          status?: string
          submitted_at?: string | null
          tab_switch_count?: number
          user_id: string
        }
        Update: {
          answers?: Json
          created_at?: string
          exam_id?: string
          id?: string
          started_at?: string
          status?: string
          submitted_at?: string | null
          tab_switch_count?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_attempts_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_results: {
        Row: {
          attempt_id: string
          attempted: number
          correct: number
          exam_id: string
          exam_title: string
          id: string
          incorrect: number
          max_score: number
          percentage: number
          question_results: Json
          subject_results: Json
          submitted_at: string
          time_taken: number
          total_questions: number
          total_score: number
          unattempted: number
          user_id: string
        }
        Insert: {
          attempt_id: string
          attempted?: number
          correct?: number
          exam_id: string
          exam_title: string
          id?: string
          incorrect?: number
          max_score?: number
          percentage?: number
          question_results?: Json
          subject_results?: Json
          submitted_at?: string
          time_taken?: number
          total_questions?: number
          total_score?: number
          unattempted?: number
          user_id: string
        }
        Update: {
          attempt_id?: string
          attempted?: number
          correct?: number
          exam_id?: string
          exam_title?: string
          id?: string
          incorrect?: number
          max_score?: number
          percentage?: number
          question_results?: Json
          subject_results?: Json
          submitted_at?: string
          time_taken?: number
          total_questions?: number
          total_score?: number
          unattempted?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_results_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: true
            referencedRelation: "exam_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_results_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          created_at: string
          created_by: string
          description: string
          duration: number
          id: string
          is_published: boolean
          marking_correct: number
          marking_incorrect: number
          marking_unattempted: number
          shuffle_options: boolean
          shuffle_questions: boolean
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string
          duration?: number
          id?: string
          is_published?: boolean
          marking_correct?: number
          marking_incorrect?: number
          marking_unattempted?: number
          shuffle_options?: boolean
          shuffle_questions?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string
          duration?: number
          id?: string
          is_published?: boolean
          marking_correct?: number
          marking_incorrect?: number
          marking_unattempted?: number
          shuffle_options?: boolean
          shuffle_questions?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          city: string | null
          created_at: string
          dismiss_parent_cta_at: string | null
          email: string | null
          id: string
          last_active_date: string | null
          name: string
          onboarding_complete: boolean
          parent_invite_token: string | null
          parent_linked: boolean
          streak_count: number
          study_hours_per_day: number | null
          target_college: string | null
          updated_at: string
          user_id: string
          weak_subjects: string[] | null
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          dismiss_parent_cta_at?: string | null
          email?: string | null
          id?: string
          last_active_date?: string | null
          name?: string
          onboarding_complete?: boolean
          parent_invite_token?: string | null
          parent_linked?: boolean
          streak_count?: number
          study_hours_per_day?: number | null
          target_college?: string | null
          updated_at?: string
          user_id: string
          weak_subjects?: string[] | null
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          dismiss_parent_cta_at?: string | null
          email?: string | null
          id?: string
          last_active_date?: string | null
          name?: string
          onboarding_complete?: boolean
          parent_invite_token?: string | null
          parent_linked?: boolean
          streak_count?: number
          study_hours_per_day?: number | null
          target_college?: string | null
          updated_at?: string
          user_id?: string
          weak_subjects?: string[] | null
        }
        Relationships: []
      }
      questions: {
        Row: {
          correct_option_id: string
          created_at: string
          difficulty: string
          exam_id: string
          id: string
          image_url: string | null
          options: Json
          sort_order: number
          subject_id: string
          text: string
          topic_id: string
        }
        Insert: {
          correct_option_id: string
          created_at?: string
          difficulty?: string
          exam_id: string
          id?: string
          image_url?: string | null
          options?: Json
          sort_order?: number
          subject_id: string
          text: string
          topic_id: string
        }
        Update: {
          correct_option_id?: string
          created_at?: string
          difficulty?: string
          exam_id?: string
          id?: string
          image_url?: string | null
          options?: Json
          sort_order?: number
          subject_id?: string
          text?: string
          topic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      topics: {
        Row: {
          created_at: string
          id: string
          name: string
          subject_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          subject_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "topics_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      parent_links: {
        Row: {
          id: string
          parent_id: string
          student_id: string
          relationship: string | null
          linked_at: string
          is_active: boolean
          whatsapp_number: string | null
          digest_opt_in: boolean
          nudge_opt_in: boolean
        }
        Insert: {
          id?: string
          parent_id: string
          student_id: string
          relationship?: string | null
          linked_at?: string
          is_active?: boolean
          whatsapp_number?: string | null
          digest_opt_in?: boolean
          nudge_opt_in?: boolean
        }
        Update: {
          id?: string
          parent_id?: string
          student_id?: string
          relationship?: string | null
          linked_at?: string
          is_active?: boolean
          whatsapp_number?: string | null
          digest_opt_in?: boolean
          nudge_opt_in?: boolean
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          id: string
          user_id: string
          plan: string
          price_paid: number | null
          started_at: string
          expires_at: string | null
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan?: string
          price_paid?: number | null
          started_at?: string
          expires_at?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan?: string
          price_paid?: number | null
          started_at?: string
          expires_at?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          status?: string
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "student" | "admin" | "parent"
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
      app_role: ["student", "admin"],
    },
  },
} as const
