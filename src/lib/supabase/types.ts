export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
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
  public: {
    Tables: {
      chapter_hearts: {
        Row: {
          chapter_id: string
          created_at: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          chapter_id: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          chapter_id?: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chapter_hearts_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      chapter_sequence_map: {
        Row: {
          chapter_id: string
          chapter_index: number
          created_at: string | null
          id: string
          sequence_id: string
          updated_at: string | null
        }
        Insert: {
          chapter_id: string
          chapter_index: number
          created_at?: string | null
          id?: string
          sequence_id: string
          updated_at?: string | null
        }
        Update: {
          chapter_id?: string
          chapter_index?: number
          created_at?: string | null
          id?: string
          sequence_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chapter_sequence_map_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chapter_sequence_map_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      chapters: {
        Row: {
          author: string
          content: string
          created_at: string | null
          description: string | null
          embedding: string | null
          generation_progress: number | null
          generation_status: string | null
          id: string
          parent_id: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          author: string
          content: string
          created_at?: string | null
          description?: string | null
          embedding?: string | null
          generation_progress?: number | null
          generation_status?: string | null
          id?: string
          parent_id?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          author?: string
          content?: string
          created_at?: string | null
          description?: string | null
          embedding?: string | null
          generation_progress?: number | null
          generation_status?: string | null
          id?: string
          parent_id?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chapters_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          author: string
          chapter_id: string
          content: string
          created_at: string | null
          id: string
          parent_id: string | null
          updated_at: string | null
        }
        Insert: {
          author: string
          chapter_id: string
          content: string
          created_at?: string | null
          id?: string
          parent_id?: string | null
          updated_at?: string | null
        }
        Update: {
          author?: string
          chapter_id?: string
          content?: string
          created_at?: string | null
          id?: string
          parent_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      generation_jobs: {
        Row: {
          bullet_progress: number | null
          chapter_id: string
          completed_at: string | null
          created_at: string | null
          current_step: string | null
          error_message: string | null
          id: string
          progress: number | null
          sequence_id: string | null
          started_at: string | null
          status: string
          story_outline: Json | null
          updated_at: string | null
          user_id: string | null
          user_preferences: Json
          user_prompt: string | null
        }
        Insert: {
          bullet_progress?: number | null
          chapter_id: string
          completed_at?: string | null
          created_at?: string | null
          current_step?: string | null
          error_message?: string | null
          id?: string
          progress?: number | null
          sequence_id?: string | null
          started_at?: string | null
          status?: string
          story_outline?: Json | null
          updated_at?: string | null
          user_id?: string | null
          user_preferences: Json
          user_prompt?: string | null
        }
        Update: {
          bullet_progress?: number | null
          chapter_id?: string
          completed_at?: string | null
          created_at?: string | null
          current_step?: string | null
          error_message?: string | null
          id?: string
          progress?: number | null
          sequence_id?: string | null
          started_at?: string | null
          status?: string
          story_outline?: Json | null
          updated_at?: string | null
          user_id?: string | null
          user_preferences?: Json
          user_prompt?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "generation_jobs_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generation_jobs_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      sequences: {
        Row: {
          created_at: string | null
          created_by: string
          description: string | null
          embedding: string | null
          id: string
          name: string | null
          tags: string[]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description?: string | null
          embedding?: string | null
          id?: string
          name?: string | null
          tags?: string[]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          embedding?: string | null
          id?: string
          name?: string | null
          tags?: string[]
          updated_at?: string | null
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string | null
          id: string
          story_points: number
          theme: string | null
          updated_at: string | null
          user_id: string
          username: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          story_points?: number
          theme?: string | null
          updated_at?: string | null
          user_id: string
          username?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          story_points?: number
          theme?: string | null
          updated_at?: string | null
          user_id?: string
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_anonymous_username: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_hot_sequences: {
        Args: { limit_count?: number; offset_count?: number }
        Returns: {
          sequence_id: string
          sequence_name: string
          sequence_description: string
          chapter_count: number
          total_hearts: number
          top_author: string
          author_count: number
          all_authors: string[]
          hot_score: number
          most_recent_update: string
        }[]
      }
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      increment_story_points: {
        Args: { user_id: string; points_to_add: number }
        Returns: number
      }
      search_chapters_hybrid: {
        Args: {
          query_embedding: string
          query_text: string
          match_threshold?: number
          match_count?: number
          match_offset?: number
        }
        Returns: {
          chapter_id: string
          chapter_title: string
          chapter_content: string
          chapter_description: string
          chapter_index: number
          chapter_author: string
          chapter_author_username: string
          chapter_created_at: string
          chapter_updated_at: string
          chapter_parent_id: string
          sequence_id: string
          sequence_name: string
          sequence_description: string
          similarity: number
        }[]
      }
      search_sequences_hybrid: {
        Args: {
          query_embedding: string
          query_text: string
          match_threshold?: number
          match_count?: number
          match_offset?: number
        }
        Returns: {
          sequence_id: string
          sequence_created_at: string
          sequence_created_by: string
          sequence_description: string
          sequence_forked_at_chapter_index: number
          sequence_name: string
          sequence_parent_sequence_id: string
          sequence_updated_at: string
          similarity: number
        }[]
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
