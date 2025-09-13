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
    PostgrestVersion: "12.2.3 (519615d)"
  }
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
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
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
      admin_audit_log: {
        Row: {
          action: string
          admin_user_id: string
          created_at: string
          details: Json | null
          id: string
          ip_address: unknown | null
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_user_id: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      ai_models: {
        Row: {
          created_at: string | null
          display_name: string
          id: string
          is_active: boolean
          model_name: string
          provider: string
          temperature: number
          top_k: number
          top_p: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_name: string
          id?: string
          is_active?: boolean
          model_name: string
          provider?: string
          temperature?: number
          top_k?: number
          top_p?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_name?: string
          id?: string
          is_active?: boolean
          model_name?: string
          provider?: string
          temperature?: number
          top_k?: number
          top_p?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          campaign: string | null
          content: string | null
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          medium: string | null
          name: string
          notes: string | null
          redirect_path: string | null
          slug: string
          source: string
          term: string | null
          total_clicks: number | null
          total_conversions: number | null
          updated_at: string | null
        }
        Insert: {
          campaign?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          medium?: string | null
          name: string
          notes?: string | null
          redirect_path?: string | null
          slug: string
          source: string
          term?: string | null
          total_clicks?: number | null
          total_conversions?: number | null
          updated_at?: string | null
        }
        Update: {
          campaign?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          medium?: string | null
          name?: string
          notes?: string | null
          redirect_path?: string | null
          slug?: string
          source?: string
          term?: string | null
          total_clicks?: number | null
          total_conversions?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
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
          {
            foreignKeyName: "chapter_hearts_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "combined_chapters_sequences"
            referencedColumns: ["chapter_id"]
          },
        ]
      }
      chapter_reports: {
        Row: {
          admin_notes: string | null
          chapter_id: string
          comment: string | null
          created_at: string | null
          id: string
          report_type: string
          reporter_user_id: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          chapter_id: string
          comment?: string | null
          created_at?: string | null
          id?: string
          report_type: string
          reporter_user_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          chapter_id?: string
          comment?: string | null
          created_at?: string | null
          id?: string
          report_type?: string
          reporter_user_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chapter_reports_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chapter_reports_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "combined_chapters_sequences"
            referencedColumns: ["chapter_id"]
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
            foreignKeyName: "chapter_sequence_map_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "combined_chapters_sequences"
            referencedColumns: ["chapter_id"]
          },
          {
            foreignKeyName: "chapter_sequence_map_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "combined_chapters_sequences"
            referencedColumns: ["sequence_id"]
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
          created_at: string
          description: string | null
          embedding: string | null
          generation_progress: number | null
          generation_status: string | null
          id: string
          parent_id: string | null
          updated_at: string
        }
        Insert: {
          author: string
          content: string
          created_at?: string
          description?: string | null
          embedding?: string | null
          generation_progress?: number | null
          generation_status?: string | null
          id?: string
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          author?: string
          content?: string
          created_at?: string
          description?: string | null
          embedding?: string | null
          generation_progress?: number | null
          generation_status?: string | null
          id?: string
          parent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chapters_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chapters_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "combined_chapters_sequences"
            referencedColumns: ["chapter_id"]
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
            foreignKeyName: "comments_author_fkey"
            columns: ["author"]
            isOneToOne: false
            referencedRelation: "user_preferences"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "comments_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "combined_chapters_sequences"
            referencedColumns: ["chapter_id"]
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
      daily_achievements: {
        Row: {
          achieved_date: string
          achievement_type: string
          created_at: string | null
          id: string
          tokens_awarded: number
          user_id: string
        }
        Insert: {
          achieved_date: string
          achievement_type: string
          created_at?: string | null
          id?: string
          tokens_awarded: number
          user_id: string
        }
        Update: {
          achieved_date?: string
          achievement_type?: string
          created_at?: string | null
          id?: string
          tokens_awarded?: number
          user_id?: string
        }
        Relationships: []
      }
      daily_reward_milestones: {
        Row: {
          bonus_tokens: number
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          streak_days: number
          title: string
          updated_at: string | null
        }
        Insert: {
          bonus_tokens: number
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          streak_days: number
          title: string
          updated_at?: string | null
        }
        Update: {
          bonus_tokens?: number
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          streak_days?: number
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      email_campaigns: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          name: string
          sent_at: string | null
          subject: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          name: string
          sent_at?: string | null
          subject?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          name?: string
          sent_at?: string | null
          subject?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      email_link_clicks: {
        Row: {
          clicked_at: string | null
          id: string
          ip_hash: string | null
          link_id: string
          user_agent: string | null
          user_id_hash: string | null
        }
        Insert: {
          clicked_at?: string | null
          id?: string
          ip_hash?: string | null
          link_id: string
          user_agent?: string | null
          user_id_hash?: string | null
        }
        Update: {
          clicked_at?: string | null
          id?: string
          ip_hash?: string | null
          link_id?: string
          user_agent?: string | null
          user_id_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_link_clicks_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "email_links"
            referencedColumns: ["id"]
          },
        ]
      }
      email_links: {
        Row: {
          campaign_id: string
          created_at: string | null
          hash: string
          id: string
          label: string | null
          url: string
        }
        Insert: {
          campaign_id: string
          created_at?: string | null
          hash: string
          id?: string
          label?: string | null
          url: string
        }
        Update: {
          campaign_id?: string
          created_at?: string | null
          hash?: string
          id?: string
          label?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_links_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaign_analytics"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "email_links_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      email_opens: {
        Row: {
          campaign_id: string
          id: string
          ip_hash: string | null
          opened_at: string | null
          user_agent: string | null
          user_id_hash: string | null
        }
        Insert: {
          campaign_id: string
          id?: string
          ip_hash?: string | null
          opened_at?: string | null
          user_agent?: string | null
          user_id_hash?: string | null
        }
        Update: {
          campaign_id?: string
          id?: string
          ip_hash?: string | null
          opened_at?: string | null
          user_agent?: string | null
          user_id_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_opens_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaign_analytics"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "email_opens_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      email_send_log: {
        Row: {
          campaign_id: string | null
          email_type: string
          id: string
          metadata: Json | null
          sent_at: string | null
          user_id: string
        }
        Insert: {
          campaign_id?: string | null
          email_type: string
          id?: string
          metadata?: Json | null
          sent_at?: string | null
          user_id: string
        }
        Update: {
          campaign_id?: string | null
          email_type?: string
          id?: string
          metadata?: Json | null
          sent_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_send_log_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaign_analytics"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "email_send_log_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      environments: {
        Row: {
          created_at: string | null
          description: string
          id: string
          image_url: string
          is_featured: boolean | null
          is_public: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          image_url: string
          is_featured?: boolean | null
          is_public?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          image_url?: string
          is_featured?: boolean | null
          is_public?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      fandom_pack_characters: {
        Row: {
          age_range: string | null
          created_at: string | null
          custom_image_prompt: string | null
          description: string
          gender: string | null
          height_range: string | null
          id: string
          image_prompt: string | null
          image_url: string | null
          key_relationships: Json | null
          name: string
          occupation: string | null
          pack_id: string | null
          personality_traits: string[] | null
          physical_build: string | null
          powers_abilities: string[] | null
          priority: number | null
          pronouns: string | null
          sexual_orientation: string | null
          species: string | null
          updated_at: string | null
        }
        Insert: {
          age_range?: string | null
          created_at?: string | null
          custom_image_prompt?: string | null
          description: string
          gender?: string | null
          height_range?: string | null
          id?: string
          image_prompt?: string | null
          image_url?: string | null
          key_relationships?: Json | null
          name: string
          occupation?: string | null
          pack_id?: string | null
          personality_traits?: string[] | null
          physical_build?: string | null
          powers_abilities?: string[] | null
          priority?: number | null
          pronouns?: string | null
          sexual_orientation?: string | null
          species?: string | null
          updated_at?: string | null
        }
        Update: {
          age_range?: string | null
          created_at?: string | null
          custom_image_prompt?: string | null
          description?: string
          gender?: string | null
          height_range?: string | null
          id?: string
          image_prompt?: string | null
          image_url?: string | null
          key_relationships?: Json | null
          name?: string
          occupation?: string | null
          pack_id?: string | null
          personality_traits?: string[] | null
          physical_build?: string | null
          powers_abilities?: string[] | null
          priority?: number | null
          pronouns?: string | null
          sexual_orientation?: string | null
          species?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fandom_pack_characters_pack_id_fkey"
            columns: ["pack_id"]
            isOneToOne: false
            referencedRelation: "fandom_packs"
            referencedColumns: ["id"]
          },
        ]
      }
      fandom_packs: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          fandom_name: string
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          fandom_name: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          fandom_name?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      featured_quotes: {
        Row: {
          admin_notes: string | null
          approved_by: string | null
          chapter_id: string
          context_sentence: string | null
          created_at: string | null
          created_by: string | null
          emotional_score: number | null
          end_position: number
          featured_end_date: string | null
          featured_start_date: string | null
          genre_category: string | null
          id: string
          mood_category: string | null
          quality_score: number | null
          quote_text: string
          sequence_id: string | null
          sequence_tags: string[] | null
          sequence_title: string | null
          spoiler_risk: number | null
          start_position: number
          status: string | null
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          admin_notes?: string | null
          approved_by?: string | null
          chapter_id: string
          context_sentence?: string | null
          created_at?: string | null
          created_by?: string | null
          emotional_score?: number | null
          end_position: number
          featured_end_date?: string | null
          featured_start_date?: string | null
          genre_category?: string | null
          id?: string
          mood_category?: string | null
          quality_score?: number | null
          quote_text: string
          sequence_id?: string | null
          sequence_tags?: string[] | null
          sequence_title?: string | null
          spoiler_risk?: number | null
          start_position: number
          status?: string | null
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          admin_notes?: string | null
          approved_by?: string | null
          chapter_id?: string
          context_sentence?: string | null
          created_at?: string | null
          created_by?: string | null
          emotional_score?: number | null
          end_position?: number
          featured_end_date?: string | null
          featured_start_date?: string | null
          genre_category?: string | null
          id?: string
          mood_category?: string | null
          quality_score?: number | null
          quote_text?: string
          sequence_id?: string | null
          sequence_tags?: string[] | null
          sequence_title?: string | null
          spoiler_risk?: number | null
          start_position?: number
          status?: string | null
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "featured_quotes_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "featured_quotes_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "combined_chapters_sequences"
            referencedColumns: ["chapter_id"]
          },
        ]
      }
      generation_jobs: {
        Row: {
          chapter_id: string
          completed_at: string | null
          created_at: string | null
          current_step: string | null
          error_message: string | null
          id: string
          job_type: string | null
          model_id: string | null
          progress: number | null
          quote_id: string | null
          sequence_id: string | null
          started_at: string | null
          status: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          chapter_id: string
          completed_at?: string | null
          created_at?: string | null
          current_step?: string | null
          error_message?: string | null
          id?: string
          job_type?: string | null
          model_id?: string | null
          progress?: number | null
          quote_id?: string | null
          sequence_id?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          chapter_id?: string
          completed_at?: string | null
          created_at?: string | null
          current_step?: string | null
          error_message?: string | null
          id?: string
          job_type?: string | null
          model_id?: string | null
          progress?: number | null
          quote_id?: string | null
          sequence_id?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string | null
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
            foreignKeyName: "generation_jobs_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "combined_chapters_sequences"
            referencedColumns: ["chapter_id"]
          },
          {
            foreignKeyName: "generation_jobs_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "ai_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generation_jobs_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "featured_quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generation_jobs_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "combined_chapters_sequences"
            referencedColumns: ["sequence_id"]
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
      ghost_users: {
        Row: {
          ab_test_assignments: Json | null
          ab_test_exposures: Json | null
          browser_fingerprint: string
          conversion_completed_at: string | null
          converted_to_user_id: string | null
          created_at: string | null
          id: string
          last_activity: string | null
        }
        Insert: {
          ab_test_assignments?: Json | null
          ab_test_exposures?: Json | null
          browser_fingerprint: string
          conversion_completed_at?: string | null
          converted_to_user_id?: string | null
          created_at?: string | null
          id?: string
          last_activity?: string | null
        }
        Update: {
          ab_test_assignments?: Json | null
          ab_test_exposures?: Json | null
          browser_fingerprint?: string
          conversion_completed_at?: string | null
          converted_to_user_id?: string | null
          created_at?: string | null
          id?: string
          last_activity?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ghost_users_converted_to_user_id_fkey"
            columns: ["converted_to_user_id"]
            isOneToOne: false
            referencedRelation: "user_preferences"
            referencedColumns: ["user_id"]
          },
        ]
      }
      heart_notification_milestones: {
        Row: {
          author_id: string
          chapter_id: string
          created_at: string
          id: string
          milestone_reached: number
          notified_at: string
        }
        Insert: {
          author_id: string
          chapter_id: string
          created_at?: string
          id?: string
          milestone_reached: number
          notified_at?: string
        }
        Update: {
          author_id?: string
          chapter_id?: string
          created_at?: string
          id?: string
          milestone_reached?: number
          notified_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "heart_notification_milestones_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "heart_notification_milestones_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "combined_chapters_sequences"
            referencedColumns: ["chapter_id"]
          },
        ]
      }
      interactive_scenarios: {
        Row: {
          character_id: string | null
          created_at: string | null
          environment_id: string | null
          featured_order: number | null
          id: string
          image_url: string | null
          is_featured: boolean | null
          is_public: boolean | null
          popularity_score: number | null
          spice_level: Database["public"]["Enums"]["spice_level"]
          starting_prompt: string
          title: string
          updated_at: string | null
          usage_count: number | null
          view_count: number | null
        }
        Insert: {
          character_id?: string | null
          created_at?: string | null
          environment_id?: string | null
          featured_order?: number | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          is_public?: boolean | null
          popularity_score?: number | null
          spice_level?: Database["public"]["Enums"]["spice_level"]
          starting_prompt: string
          title: string
          updated_at?: string | null
          usage_count?: number | null
          view_count?: number | null
        }
        Update: {
          character_id?: string | null
          created_at?: string | null
          environment_id?: string | null
          featured_order?: number | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          is_public?: boolean | null
          popularity_score?: number | null
          spice_level?: Database["public"]["Enums"]["spice_level"]
          starting_prompt?: string
          title?: string
          updated_at?: string | null
          usage_count?: number | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "interactive_scenarios_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "fandom_pack_characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interactive_scenarios_environment_id_fkey"
            columns: ["environment_id"]
            isOneToOne: false
            referencedRelation: "environments"
            referencedColumns: ["id"]
          },
        ]
      }
      interactive_stories: {
        Row: {
          author_id: string
          author_style: number | null
          content: string
          cover_image_url: string | null
          created_at: string
          description: string | null
          ghost_fingerprint: string | null
          id: string
          interactive_id: string | null
          is_anonymous_story: boolean | null
          is_main_character: boolean
          is_public: boolean
          is_sexually_explicit: boolean
          message_history: Json
          tags: string[]
          title: string | null
          tokens_spent: number
          trigger_warnings: string[]
          updated_at: string
          user_description: string | null
          user_tags: string[] | null
          word_count: number | null
          words_generated: number
        }
        Insert: {
          author_id: string
          author_style?: number | null
          content: string
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          ghost_fingerprint?: string | null
          id?: string
          interactive_id?: string | null
          is_anonymous_story?: boolean | null
          is_main_character?: boolean
          is_public?: boolean
          is_sexually_explicit?: boolean
          message_history: Json
          tags?: string[]
          title?: string | null
          tokens_spent?: number
          trigger_warnings?: string[]
          updated_at?: string
          user_description?: string | null
          user_tags?: string[] | null
          word_count?: number | null
          words_generated?: number
        }
        Update: {
          author_id?: string
          author_style?: number | null
          content?: string
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          ghost_fingerprint?: string | null
          id?: string
          interactive_id?: string | null
          is_anonymous_story?: boolean | null
          is_main_character?: boolean
          is_public?: boolean
          is_sexually_explicit?: boolean
          message_history?: Json
          tags?: string[]
          title?: string | null
          tokens_spent?: number
          trigger_warnings?: string[]
          updated_at?: string
          user_description?: string | null
          user_tags?: string[] | null
          word_count?: number | null
          words_generated?: number
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string | null
          data: Json | null
          id: string
          message: string
          read: boolean | null
          title: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          data?: Json | null
          id?: string
          message: string
          read?: boolean | null
          title: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          data?: Json | null
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          amount_cents: number
          created_at: string | null
          currency: string | null
          id: string
          metadata: Json | null
          status: string
          stripe_invoice_id: string | null
          stripe_payment_intent_id: string | null
          tokens_granted: number | null
          type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount_cents: number
          created_at?: string | null
          currency?: string | null
          id?: string
          metadata?: Json | null
          status: string
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          tokens_granted?: number | null
          type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount_cents?: number
          created_at?: string | null
          currency?: string | null
          id?: string
          metadata?: Json | null
          status?: string
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          tokens_granted?: number | null
          type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      project_runs: {
        Row: {
          created_at: string | null
          id: string
          project_id: string | null
          run_id: string
          status: string
          total_files: number | null
          uploaded_at: string | null
          uploaded_files: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          project_id?: string | null
          run_id: string
          status: string
          total_files?: number | null
          uploaded_at?: string | null
          uploaded_files?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          project_id?: string | null
          run_id?: string
          status?: string
          total_files?: number | null
          uploaded_at?: string | null
          uploaded_files?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_runs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          settings: Json | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          settings?: Json | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          settings?: Json | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      quote_keywords: {
        Row: {
          category: string
          created_at: string | null
          id: string
          is_active: boolean | null
          keyword: string
          score_value: number
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          keyword: string
          score_value?: number
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          keyword?: string
          score_value?: number
        }
        Relationships: []
      }
      re_engagement_emails: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          sent_at: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          sent_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          sent_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      scheduled_emails: {
        Row: {
          content: string
          created_at: string | null
          created_by: string | null
          email_type: string
          html_content: string
          id: string
          metadata: Json | null
          recipient_filters: Json | null
          recipients_count: number | null
          scheduled_for: string
          sent_at: string | null
          status: string
          subject: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by?: string | null
          email_type: string
          html_content: string
          id?: string
          metadata?: Json | null
          recipient_filters?: Json | null
          recipients_count?: number | null
          scheduled_for: string
          sent_at?: string | null
          status?: string
          subject: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string | null
          email_type?: string
          html_content?: string
          id?: string
          metadata?: Json | null
          recipient_filters?: Json | null
          recipients_count?: number | null
          scheduled_for?: string
          sent_at?: string | null
          status?: string
          subject?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      sequences: {
        Row: {
          chapters: Json | null
          cover_image_url: string | null
          created_at: string
          created_by: string
          description: string | null
          embedding: string | null
          ghost_fingerprint: string | null
          id: string
          is_anonymous_story: boolean | null
          is_sexually_explicit: boolean
          name: string | null
          tags: string[]
          target_audience: string[]
          trigger_warnings: string[]
          updated_at: string
          user_prompt_history: Json
          writing_quirk: string | null
        }
        Insert: {
          chapters?: Json | null
          cover_image_url?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          embedding?: string | null
          ghost_fingerprint?: string | null
          id?: string
          is_anonymous_story?: boolean | null
          is_sexually_explicit?: boolean
          name?: string | null
          tags?: string[]
          target_audience?: string[]
          trigger_warnings?: string[]
          updated_at?: string
          user_prompt_history?: Json
          writing_quirk?: string | null
        }
        Update: {
          chapters?: Json | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          embedding?: string | null
          ghost_fingerprint?: string | null
          id?: string
          is_anonymous_story?: boolean | null
          is_sexually_explicit?: boolean
          name?: string | null
          tags?: string[]
          target_audience?: string[]
          trigger_warnings?: string[]
          updated_at?: string
          user_prompt_history?: Json
          writing_quirk?: string | null
        }
        Relationships: []
      }
      stripe_webhook_events: {
        Row: {
          created_at: string | null
          error: string | null
          id: string
          payload: Json
          processed: boolean | null
          processed_at: string | null
          stripe_event_id: string
          type: string
        }
        Insert: {
          created_at?: string | null
          error?: string | null
          id?: string
          payload: Json
          processed?: boolean | null
          processed_at?: string | null
          stripe_event_id: string
          type: string
        }
        Update: {
          created_at?: string | null
          error?: string | null
          id?: string
          payload?: Json
          processed?: boolean | null
          processed_at?: string | null
          stripe_event_id?: string
          type?: string
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          billing_interval: string
          created_at: string | null
          description: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          name: string
          price_cents: number
          sort_order: number | null
          token_daily_allowance: number
          token_max_capacity: number
          updated_at: string | null
        }
        Insert: {
          billing_interval: string
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          name: string
          price_cents: number
          sort_order?: number | null
          token_daily_allowance?: number
          token_max_capacity?: number
          updated_at?: string | null
        }
        Update: {
          billing_interval?: string
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string
          price_cents?: number
          sort_order?: number | null
          token_daily_allowance?: number
          token_max_capacity?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      token_transactions: {
        Row: {
          amount: number
          balance_after: number
          balance_before: number
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          payment_transaction_id: string | null
          subscription_id: string | null
          transaction_type: Database["public"]["Enums"]["token_transaction_type"]
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          balance_before: number
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          payment_transaction_id?: string | null
          subscription_id?: string | null
          transaction_type: Database["public"]["Enums"]["token_transaction_type"]
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          balance_before?: number
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          payment_transaction_id?: string | null
          subscription_id?: string | null
          transaction_type?: Database["public"]["Enums"]["token_transaction_type"]
          user_id?: string
        }
        Relationships: []
      }
      traffic_sources: {
        Row: {
          campaign_id: string | null
          converted_user_id: string | null
          created_at: string | null
          id: string
          ip_hash: string | null
          source: string
          user_agent: string | null
        }
        Insert: {
          campaign_id?: string | null
          converted_user_id?: string | null
          created_at?: string | null
          id?: string
          ip_hash?: string | null
          source: string
          user_agent?: string | null
        }
        Update: {
          campaign_id?: string | null
          converted_user_id?: string | null
          created_at?: string | null
          id?: string
          ip_hash?: string | null
          source?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "traffic_sources_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      unsubscribe_tokens: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          token: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          token: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          token?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_follows: {
        Row: {
          created_at: string | null
          followed_id: string
          follower_id: string
        }
        Insert: {
          created_at?: string | null
          followed_id: string
          follower_id: string
        }
        Update: {
          created_at?: string | null
          followed_id?: string
          follower_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          avatar_url: string
          created_at: string | null
          email_follow_notifications: boolean | null
          email_marketing_consent: boolean | null
          email_newsletter_consent: boolean | null
          email_onboarding_consent: boolean | null
          email_product_updates: boolean | null
          email_story_extended_notifications: boolean | null
          email_story_liked_notifications: boolean | null
          first_sequence_created_at: string | null
          ghost_created_at: string | null
          ghost_expires_at: string | null
          ghost_fingerprint: string | null
          highest_streak: number | null
          id: string
          ignored_trigger_warnings: string[] | null
          is_ghost_user: boolean | null
          last_reward_claimed_date: string | null
          last_visit_date: string | null
          login_streak: number | null
          preferred_model_id: string
          reading_preferences: Json | null
          referral_count: number
          referral_rewards: number
          referred_by: string | null
          role: Database["public"]["Enums"]["user_role"]
          signup_source: string | null
          theme: string | null
          tokens: number
          unsubscribed_at: string | null
          updated_at: string | null
          user_id: string
          username: string
        }
        Insert: {
          avatar_url?: string
          created_at?: string | null
          email_follow_notifications?: boolean | null
          email_marketing_consent?: boolean | null
          email_newsletter_consent?: boolean | null
          email_onboarding_consent?: boolean | null
          email_product_updates?: boolean | null
          email_story_extended_notifications?: boolean | null
          email_story_liked_notifications?: boolean | null
          first_sequence_created_at?: string | null
          ghost_created_at?: string | null
          ghost_expires_at?: string | null
          ghost_fingerprint?: string | null
          highest_streak?: number | null
          id?: string
          ignored_trigger_warnings?: string[] | null
          is_ghost_user?: boolean | null
          last_reward_claimed_date?: string | null
          last_visit_date?: string | null
          login_streak?: number | null
          preferred_model_id?: string
          reading_preferences?: Json | null
          referral_count?: number
          referral_rewards?: number
          referred_by?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          signup_source?: string | null
          theme?: string | null
          tokens?: number
          unsubscribed_at?: string | null
          updated_at?: string | null
          user_id: string
          username?: string
        }
        Update: {
          avatar_url?: string
          created_at?: string | null
          email_follow_notifications?: boolean | null
          email_marketing_consent?: boolean | null
          email_newsletter_consent?: boolean | null
          email_onboarding_consent?: boolean | null
          email_product_updates?: boolean | null
          email_story_extended_notifications?: boolean | null
          email_story_liked_notifications?: boolean | null
          first_sequence_created_at?: string | null
          ghost_created_at?: string | null
          ghost_expires_at?: string | null
          ghost_fingerprint?: string | null
          highest_streak?: number | null
          id?: string
          ignored_trigger_warnings?: string[] | null
          is_ghost_user?: boolean | null
          last_reward_claimed_date?: string | null
          last_visit_date?: string | null
          login_streak?: number | null
          preferred_model_id?: string
          reading_preferences?: Json | null
          referral_count?: number
          referral_rewards?: number
          referred_by?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          signup_source?: string | null
          theme?: string | null
          tokens?: number
          unsubscribed_at?: string | null
          updated_at?: string | null
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_preferences_preferred_model"
            columns: ["preferred_model_id"]
            isOneToOne: false
            referencedRelation: "ai_models"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sequence_engagement: {
        Row: {
          chapters_progressed: number | null
          completed: boolean | null
          created_at: string | null
          engagement_score: number | null
          first_engaged_at: string | null
          id: string
          last_engaged_at: string | null
          sequence_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          chapters_progressed?: number | null
          completed?: boolean | null
          created_at?: string | null
          engagement_score?: number | null
          first_engaged_at?: string | null
          id?: string
          last_engaged_at?: string | null
          sequence_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          chapters_progressed?: number | null
          completed?: boolean | null
          created_at?: string | null
          engagement_score?: number | null
          first_engaged_at?: string | null
          id?: string
          last_engaged_at?: string | null
          sequence_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sequence_engagement_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "combined_chapters_sequences"
            referencedColumns: ["sequence_id"]
          },
          {
            foreignKeyName: "user_sequence_engagement_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      user_subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          last_token_grant: string | null
          metadata: Json | null
          payment_provider_customer_id: string | null
          payment_provider_subscription_id: string | null
          plan_id: string
          status: Database["public"]["Enums"]["subscription_status"] | null
          stripe_customer_id: string | null
          stripe_price_id: string | null
          trial_end: string | null
          trial_start: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          last_token_grant?: string | null
          metadata?: Json | null
          payment_provider_customer_id?: string | null
          payment_provider_subscription_id?: string | null
          plan_id: string
          status?: Database["public"]["Enums"]["subscription_status"] | null
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          last_token_grant?: string | null
          metadata?: Json | null
          payment_provider_customer_id?: string | null
          payment_provider_subscription_id?: string | null
          plan_id?: string
          status?: Database["public"]["Enums"]["subscription_status"] | null
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "active_subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      active_subscription_plans: {
        Row: {
          billing_interval: string | null
          description: string | null
          display_price: string | null
          features: Json | null
          id: string | null
          max_chapters_per_story: number | null
          name: string | null
          price_cents: number | null
          requires_daily_login: boolean | null
          sort_order: number | null
          token_daily_allowance: number | null
          token_max_capacity: number | null
          unlimited_reading: boolean | null
        }
        Insert: {
          billing_interval?: string | null
          description?: string | null
          display_price?: never
          features?: Json | null
          id?: string | null
          max_chapters_per_story?: never
          name?: string | null
          price_cents?: number | null
          requires_daily_login?: never
          sort_order?: number | null
          token_daily_allowance?: number | null
          token_max_capacity?: number | null
          unlimited_reading?: never
        }
        Update: {
          billing_interval?: string | null
          description?: string | null
          display_price?: never
          features?: Json | null
          id?: string | null
          max_chapters_per_story?: never
          name?: string | null
          price_cents?: number | null
          requires_daily_login?: never
          sort_order?: number | null
          token_daily_allowance?: number | null
          token_max_capacity?: number | null
          unlimited_reading?: never
        }
        Relationships: []
      }
      combined_chapters_sequences: {
        Row: {
          chapter_content: string | null
          chapter_description: string | null
          chapter_id: string | null
          chapter_index: number | null
          sequence_description: string | null
          sequence_id: string | null
          sequence_name: string | null
        }
        Relationships: []
      }
      email_campaign_analytics: {
        Row: {
          campaign_id: string | null
          campaign_name: string | null
          campaign_type: string | null
          click_through_rate: number | null
          sent_at: string | null
          subject: string | null
          total_clicks: number | null
          total_links: number | null
          total_opens: number | null
          unique_clicks: number | null
          unique_opens: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      auto_heart_new_user_chapters: {
        Args: { p_admin_user_id?: string }
        Returns: Json
      }
      backfill_missing_user_preferences: {
        Args: Record<PropertyKey, never>
        Returns: {
          created: boolean
          user_id: string
        }[]
      }
      calculate_engagement_score: {
        Args: { chapters_read: number; last_read?: string }
        Returns: number
      }
      check_and_award_daily_achievement: {
        Args: { p_achievement_type: string; p_user_id: string }
        Returns: Json
      }
      check_and_award_first_sequence_achievement: {
        Args: { p_sequence_id: string; p_user_id: string }
        Returns: Json
      }
      check_daily_reward_eligibility: {
        Args: { p_user_id: string }
        Returns: Json
      }
      check_subscription_limits: {
        Args: { p_user_id: string }
        Returns: Json
      }
      claim_daily_reward: {
        Args: { p_user_id: string }
        Returns: Json
      }
      claim_pending_jobs: {
        Args: { worker_count?: number }
        Returns: {
          chapter_id: string
          completed_at: string
          created_at: string
          current_step: string
          error_message: string
          id: string
          job_type: string
          model_id: string
          progress: number
          quote_id: string
          sequence_id: string
          started_at: string
          status: string
          updated_at: string
          user_id: string
        }[]
      }
      cleanup_expired_ghost_users: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      convert_ghost_user_to_real: {
        Args: { p_ghost_fingerprint: string; p_real_user_id: string }
        Returns: boolean
      }
      debug_quote_scoring: {
        Args: { chapter_text: string; min_score?: number }
        Returns: {
          length_check: number
          quote_text: string
          sentence_score: number
        }[]
      }
      extract_compelling_quotes: {
        Args: {
          chapter_id_param: string
          chapter_text: string
          sequence_tags_param: string[]
          sequence_title_param: string
        }
        Returns: {
          chapter_id: string
          emotional_indicators: string[]
          end_position: number
          genre_category: string
          mood_category: string
          quote_text: string
          sentence_score: number
          start_position: number
        }[]
      }
      extract_compelling_quotes_fixed: {
        Args: {
          chapter_id_param: string
          chapter_text: string
          sequence_tags_param: string[]
          sequence_title_param: string
        }
        Returns: {
          chapter_id: string
          emotional_indicators: string[]
          end_position: number
          genre_category: string
          mood_category: string
          quote_text: string
          sentence_score: number
          start_position: number
        }[]
      }
      extract_quote_candidates: {
        Args: {
          chapter_id_param: string
          chapter_text: string
          max_candidates?: number
          max_quote_length?: number
          min_quote_length?: number
          sequence_tags_param: string[]
          sequence_title_param: string
        }
        Returns: {
          chapter_id: string
          emotional_indicators: string[]
          end_position: number
          genre_category: string
          mood_category: string
          quote_text: string
          sentence_score: number
          start_position: number
        }[]
      }
      extract_quote_candidates_v2: {
        Args: {
          chapter_id_param: string
          chapter_text: string
          sequence_tags_param: string[]
          sequence_title_param: string
        }
        Returns: {
          chapter_id: string
          emotional_indicators: string[]
          end_position: number
          genre_category: string
          mood_category: string
          quote_text: string
          sentence_score: number
          start_position: number
        }[]
      }
      extract_quotes_with_dynamic_keywords: {
        Args: {
          chapter_id_param: string
          chapter_text: string
          sequence_tags_param: string[]
          sequence_title_param: string
        }
        Returns: {
          chapter_id: string
          emotional_indicators: string[]
          end_position: number
          genre_category: string
          mood_category: string
          quote_text: string
          sentence_score: number
          start_position: number
        }[]
      }
      generate_anonymous_username: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_follower_count: {
        Args: { user_id: string }
        Returns: number
      }
      get_hot_sequences: {
        Args: {
          exclude_user_id: string
          filter_tags: string[]
          match_count: number
          match_offset: number
          max_spice_level: number
          max_story_length: number
          min_spice_level: number
          min_story_length: number
          target_audiences?: string[]
          use_or_tags: boolean
          user_gender?: string
          user_preference?: string
        }
        Returns: {
          all_authors: string[]
          author_count: number
          chapter_count: number
          cover_image_url: string
          sequence_description: string
          sequence_id: string
          sequence_name: string
          story_length: number
          target_audience: string[]
          top_author: string
          total_hearts: number
        }[]
      }
      get_juicy_chapters_last_week: {
        Args: { limit_count?: number; min_content_length?: number }
        Returns: {
          chapter_content: string
          chapter_id: string
          content_length: number
          created_at: string
          heart_count: number
          juiciness_score: number
          sequence_tags: string[]
          sequence_title: string
        }[]
      }
      get_personalized_hot_sequences: {
        Args: {
          exclude_user_id: string
          filter_tags: string[]
          match_count: number
          match_offset: number
          max_spice_level: number
          max_story_length: number
          min_spice_level: number
          min_story_length: number
          target_audiences?: string[]
          use_or_tags: boolean
          user_gender?: string
          user_preference?: string
        }
        Returns: {
          all_authors: string[]
          author_count: number
          chapter_count: number
          cover_image_url: string
          sequence_description: string
          sequence_id: string
          sequence_name: string
          similarity_score: number
          story_length: number
          target_audience: string[]
          top_author: string
          total_hearts: number
        }[]
      }
      get_quote_candidates_from_juicy_chapters: {
        Args: {
          max_chapters?: number
          max_quotes_per_chapter?: number
          min_sentence_score?: number
        }
        Returns: {
          chapter_id_result: string
          chapter_juiciness_score_result: number
          emotional_indicators_result: string[]
          end_position_result: number
          genre_category_result: string
          mood_category_result: string
          quote_text_result: string
          sentence_score_result: number
          sequence_tags_result: string[]
          sequence_title_result: string
          start_position_result: number
        }[]
      }
      get_referral_stats: {
        Args: { user_uuid: string }
        Returns: Json
      }
      get_sequence_chapters_ordered: {
        Args: { sequence_id_param: string }
        Returns: {
          author: string
          chapter_index: number
          content: string
          created_at: string
          description: string
          embedding: string
          generation_progress: number
          generation_status: string
          id: string
          parent_id: string
          updated_at: string
        }[]
      }
      get_user_recommendations: {
        Args: { p_limit?: number; p_user_id: string }
        Returns: {
          description: string
          id: string
          name: string
          recommendation_reason: string
          similarity_score: number
          tags: string[]
        }[]
      }
      get_user_role: {
        Args: { user_uuid?: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      grant_daily_tokens: {
        Args: Record<PropertyKey, never>
        Returns: undefined
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
        Args: { points_to_add: number; user_id: string }
        Returns: number
      }
      is_admin: {
        Args: { user_uuid?: string }
        Returns: boolean
      }
      log_admin_action: {
        Args:
          | {
              action_name: string
              admin_user_id_param?: string
              details_param?: Json
              ip_address_param?: unknown
              resource_id_param?: string
              resource_type_param?: string
              user_agent_param?: string
            }
          | {
              action_name: string
              details_param?: Json
              ip_address_param?: unknown
              resource_id_param?: string
              resource_type_param?: string
              user_agent_param?: string
            }
        Returns: string
      }
      process_scheduled_emails: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      process_token_purchase: {
        Args: {
          p_payment_transaction_id: string
          p_token_amount: number
          p_user_id: string
        }
        Returns: boolean
      }
      search_chapters_hybrid: {
        Args: {
          match_count?: number
          match_offset?: number
          match_threshold?: number
          query_embedding: string
          query_text: string
        }
        Returns: {
          chapter_author: string
          chapter_author_username: string
          chapter_content: string
          chapter_created_at: string
          chapter_description: string
          chapter_id: string
          chapter_index: number
          chapter_parent_id: string
          chapter_title: string
          chapter_updated_at: string
          cover_image_url: string
          sequence_description: string
          sequence_id: string
          sequence_name: string
          similarity: number
        }[]
      }
      search_sequences_hybrid: {
        Args: {
          filter_tags?: string[]
          match_count?: number
          match_offset?: number
          match_threshold?: number
          max_spice_level?: number
          max_story_length?: number
          min_spice_level?: number
          min_story_length?: number
          query_embedding: string
          query_text: string
          target_audiences?: string[]
          use_or_tags?: boolean
        }
        Returns: {
          cover_image_url: string
          sequence_created_at: string
          sequence_created_by: string
          sequence_description: string
          sequence_forked_at_chapter_index: number
          sequence_id: string
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
      track_sequence_engagement: {
        Args: { p_sequence_id: string; p_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      payment_status:
        | "pending"
        | "completed"
        | "failed"
        | "refunded"
        | "canceled"
      spice_level: "mild" | "medium" | "hot"
      subscription_status:
        | "active"
        | "past_due"
        | "canceled"
        | "incomplete"
        | "paused"
      token_transaction_type:
        | "daily_grant"
        | "purchase"
        | "generation_usage"
        | "admin_adjustment"
        | "refund"
      user_role: "user" | "admin" | "moderator"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      payment_status: [
        "pending",
        "completed",
        "failed",
        "refunded",
        "canceled",
      ],
      spice_level: ["mild", "medium", "hot"],
      subscription_status: [
        "active",
        "past_due",
        "canceled",
        "incomplete",
        "paused",
      ],
      token_transaction_type: [
        "daily_grant",
        "purchase",
        "generation_usage",
        "admin_adjustment",
        "refund",
      ],
      user_role: ["user", "admin", "moderator"],
    },
  },
} as const
