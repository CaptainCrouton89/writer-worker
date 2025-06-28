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
          created_at: string | null
          description: string | null
          embedding: string | null
          generation_progress: number | null
          generation_status: string | null
          id: string
          parent_id: string | null
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
      fandom_pack_characters: {
        Row: {
          created_at: string | null
          description: string
          id: string
          name: string
          pack_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          name: string
          pack_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          name?: string
          pack_id?: string | null
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
      newsletter_campaigns: {
        Row: {
          content: string
          created_at: string | null
          created_by: string | null
          id: string
          recipients_count: number | null
          sent_at: string | null
          subject: string
          template_name: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          recipients_count?: number | null
          sent_at?: string | null
          subject: string
          template_name?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          recipients_count?: number | null
          sent_at?: string | null
          subject?: string
          template_name?: string | null
        }
        Relationships: []
      }
      newsletter_sends: {
        Row: {
          campaign_id: string | null
          error_message: string | null
          id: string
          sent_at: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          campaign_id?: string | null
          error_message?: string | null
          id?: string
          sent_at?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          campaign_id?: string | null
          error_message?: string | null
          id?: string
          sent_at?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "newsletter_sends_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "newsletter_campaigns"
            referencedColumns: ["id"]
          },
        ]
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
          description: string | null
          id: string
          payment_provider_customer_id: string | null
          payment_provider_transaction_id: string | null
          processed_at: string | null
          provider_data: Json | null
          status: Database["public"]["Enums"]["payment_status"]
          subscription_id: string | null
          transaction_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          payment_provider_customer_id?: string | null
          payment_provider_transaction_id?: string | null
          processed_at?: string | null
          provider_data?: Json | null
          status?: Database["public"]["Enums"]["payment_status"]
          subscription_id?: string | null
          transaction_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          payment_provider_customer_id?: string | null
          payment_provider_transaction_id?: string | null
          processed_at?: string | null
          provider_data?: Json | null
          status?: Database["public"]["Enums"]["payment_status"]
          subscription_id?: string | null
          transaction_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "user_subscriptions"
            referencedColumns: ["id"]
          },
        ]
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
      sequences: {
        Row: {
          chapters: Json | null
          created_at: string | null
          created_by: string
          description: string | null
          embedding: string | null
          id: string
          is_sexually_explicit: boolean
          name: string | null
          tags: string[]
          title: string | null
          trigger_warnings: string[]
          updated_at: string | null
          user_prompt_history: Json
        }
        Insert: {
          chapters?: Json | null
          created_at?: string | null
          created_by: string
          description?: string | null
          embedding?: string | null
          id?: string
          is_sexually_explicit?: boolean
          name?: string | null
          tags?: string[]
          title?: string | null
          trigger_warnings?: string[]
          updated_at?: string | null
          user_prompt_history?: Json
        }
        Update: {
          chapters?: Json | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          embedding?: string | null
          id?: string
          is_sexually_explicit?: boolean
          name?: string | null
          tags?: string[]
          title?: string | null
          trigger_warnings?: string[]
          updated_at?: string | null
          user_prompt_history?: Json
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
        Relationships: [
          {
            foreignKeyName: "token_transactions_payment_transaction_id_fkey"
            columns: ["payment_transaction_id"]
            isOneToOne: false
            referencedRelation: "payment_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "token_transactions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "user_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      traffic_sources: {
        Row: {
          converted_user_id: string | null
          created_at: string | null
          id: string
          ip_hash: string | null
          source: string
          user_agent: string | null
        }
        Insert: {
          converted_user_id?: string | null
          created_at?: string | null
          id?: string
          ip_hash?: string | null
          source: string
          user_agent?: string | null
        }
        Update: {
          converted_user_id?: string | null
          created_at?: string | null
          id?: string
          ip_hash?: string | null
          source?: string
          user_agent?: string | null
        }
        Relationships: []
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
      user_preferences: {
        Row: {
          created_at: string | null
          email_frequency_preference: string | null
          email_marketing_consent: boolean | null
          email_newsletter_consent: boolean | null
          email_product_updates: boolean | null
          highest_streak: number | null
          id: string
          ignored_trigger_warnings: string[] | null
          last_reward_claimed_date: string | null
          last_visit_date: string | null
          login_streak: number | null
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
          created_at?: string | null
          email_frequency_preference?: string | null
          email_marketing_consent?: boolean | null
          email_newsletter_consent?: boolean | null
          email_product_updates?: boolean | null
          highest_streak?: number | null
          id?: string
          ignored_trigger_warnings?: string[] | null
          last_reward_claimed_date?: string | null
          last_visit_date?: string | null
          login_streak?: number | null
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
          created_at?: string | null
          email_frequency_preference?: string | null
          email_marketing_consent?: boolean | null
          email_newsletter_consent?: boolean | null
          email_product_updates?: boolean | null
          highest_streak?: number | null
          id?: string
          ignored_trigger_warnings?: string[] | null
          last_reward_claimed_date?: string | null
          last_visit_date?: string | null
          login_streak?: number | null
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
        Relationships: []
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
          metadata: Json | null
          payment_provider_customer_id: string | null
          payment_provider_subscription_id: string | null
          plan_id: string
          status: Database["public"]["Enums"]["subscription_status"]
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
          metadata?: Json | null
          payment_provider_customer_id?: string | null
          payment_provider_subscription_id?: string | null
          plan_id: string
          status?: Database["public"]["Enums"]["subscription_status"]
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
          metadata?: Json | null
          payment_provider_customer_id?: string | null
          payment_provider_subscription_id?: string | null
          plan_id?: string
          status?: Database["public"]["Enums"]["subscription_status"]
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
    }
    Functions: {
      backfill_missing_user_preferences: {
        Args: Record<PropertyKey, never>
        Returns: {
          user_id: string
          created: boolean
        }[]
      }
      calculate_engagement_score: {
        Args: { chapters_read: number; last_read?: string }
        Returns: number
      }
      check_and_award_daily_achievement: {
        Args: { p_user_id: string; p_achievement_type: string }
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
      debug_quote_scoring: {
        Args: { chapter_text: string; min_score?: number }
        Returns: {
          quote_text: string
          sentence_score: number
          length_check: number
        }[]
      }
      extract_compelling_quotes: {
        Args: {
          chapter_text: string
          chapter_id_param: string
          sequence_title_param: string
          sequence_tags_param: string[]
        }
        Returns: {
          chapter_id: string
          quote_text: string
          start_position: number
          end_position: number
          sentence_score: number
          emotional_indicators: string[]
          genre_category: string
          mood_category: string
        }[]
      }
      extract_compelling_quotes_fixed: {
        Args: {
          chapter_text: string
          chapter_id_param: string
          sequence_title_param: string
          sequence_tags_param: string[]
        }
        Returns: {
          chapter_id: string
          quote_text: string
          start_position: number
          end_position: number
          sentence_score: number
          emotional_indicators: string[]
          genre_category: string
          mood_category: string
        }[]
      }
      extract_quote_candidates: {
        Args: {
          chapter_text: string
          chapter_id_param: string
          sequence_title_param: string
          sequence_tags_param: string[]
          min_quote_length?: number
          max_quote_length?: number
          max_candidates?: number
        }
        Returns: {
          chapter_id: string
          quote_text: string
          start_position: number
          end_position: number
          sentence_score: number
          emotional_indicators: string[]
          genre_category: string
          mood_category: string
        }[]
      }
      extract_quote_candidates_v2: {
        Args: {
          chapter_text: string
          chapter_id_param: string
          sequence_title_param: string
          sequence_tags_param: string[]
        }
        Returns: {
          chapter_id: string
          quote_text: string
          start_position: number
          end_position: number
          sentence_score: number
          emotional_indicators: string[]
          genre_category: string
          mood_category: string
        }[]
      }
      extract_quotes_with_dynamic_keywords: {
        Args: {
          chapter_text: string
          chapter_id_param: string
          sequence_title_param: string
          sequence_tags_param: string[]
        }
        Returns: {
          chapter_id: string
          quote_text: string
          start_position: number
          end_position: number
          sentence_score: number
          emotional_indicators: string[]
          genre_category: string
          mood_category: string
        }[]
      }
      generate_anonymous_username: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_hot_sequences: {
        Args:
          | { limit_count?: number; offset_count?: number }
          | {
              match_count?: number
              match_offset?: number
              filter_tags?: string[]
              min_story_length?: number
              max_story_length?: number
              min_spice_level?: number
              max_spice_level?: number
            }
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
      get_juicy_chapters_last_week: {
        Args: { min_content_length?: number; limit_count?: number }
        Returns: {
          chapter_id: string
          chapter_content: string
          content_length: number
          sequence_title: string
          sequence_tags: string[]
          heart_count: number
          created_at: string
          juiciness_score: number
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
          sequence_title_result: string
          sequence_tags_result: string[]
          quote_text_result: string
          start_position_result: number
          end_position_result: number
          sentence_score_result: number
          emotional_indicators_result: string[]
          genre_category_result: string
          mood_category_result: string
          chapter_juiciness_score_result: number
        }[]
      }
      get_referral_stats: {
        Args: { user_uuid: string }
        Returns: Json
      }
      get_user_recommendations: {
        Args: { p_user_id: string; p_limit?: number }
        Returns: {
          sequence_id: string
          name: string
          description: string
          tags: string[]
          similarity_score: number
          recommendation_reason: string
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
        Args: { user_id: string; points_to_add: number }
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
              resource_type_param?: string
              resource_id_param?: string
              details_param?: Json
              ip_address_param?: unknown
              user_agent_param?: string
            }
          | {
              action_name: string
              resource_type_param?: string
              resource_id_param?: string
              details_param?: Json
              ip_address_param?: unknown
              user_agent_param?: string
              admin_user_id_param?: string
            }
        Returns: string
      }
      process_token_purchase: {
        Args: {
          p_user_id: string
          p_token_amount: number
          p_payment_transaction_id: string
        }
        Returns: boolean
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
        Args:
          | {
              query_embedding: string
              query_text: string
              match_threshold?: number
              match_count?: number
              match_offset?: number
            }
          | {
              query_embedding: string
              query_text: string
              match_threshold?: number
              match_count?: number
              match_offset?: number
              filter_tags?: string[]
              min_story_length?: number
              max_story_length?: number
              min_spice_level?: number
              max_spice_level?: number
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
      track_sequence_engagement: {
        Args: { p_user_id: string; p_sequence_id: string }
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
    Enums: {
      payment_status: [
        "pending",
        "completed",
        "failed",
        "refunded",
        "canceled",
      ],
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
