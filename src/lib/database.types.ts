export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          avatar_url: string | null;
          preferences: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name?: string | null;
          avatar_url?: string | null;
          preferences?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          preferences?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          color: string;
          icon: string;
          archived: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          color?: string;
          icon?: string;
          archived?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          color?: string;
          icon?: string;
          archived?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      captures: {
        Row: {
          id: string;
          user_id: string;
          project_id: string | null;
          type: "url" | "note" | "file";
          title: string;
          content: string | null;
          url: string | null;
          metadata: Json;
          status: "pending" | "confirmed" | "ignored";
          confirmed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          project_id?: string | null;
          type: "url" | "note" | "file";
          title: string;
          content?: string | null;
          url?: string | null;
          metadata?: Json;
          status?: "pending" | "confirmed" | "ignored";
          confirmed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          project_id?: string | null;
          type?: "url" | "note" | "file";
          title?: string;
          content?: string | null;
          url?: string | null;
          metadata?: Json;
          status?: "pending" | "confirmed" | "ignored";
          confirmed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      memories: {
        Row: {
          id: string;
          user_id: string;
          project_id: string | null;
          capture_id: string | null;
          content: string;
          summary: string | null;
          embedding: number[] | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          project_id?: string | null;
          capture_id?: string | null;
          content: string;
          summary?: string | null;
          embedding?: number[] | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          project_id?: string | null;
          capture_id?: string | null;
          content?: string;
          summary?: string | null;
          embedding?: number[] | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      briefs: {
        Row: {
          id: string;
          user_id: string;
          project_id: string | null;
          title: string;
          content: string;
          type: "daily" | "weekly" | "project" | "custom";
          status: "pending" | "processing" | "completed" | "failed";
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          project_id?: string | null;
          title: string;
          content: string;
          type: "daily" | "weekly" | "project" | "custom";
          status?: "pending" | "processing" | "completed" | "failed";
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          project_id?: string | null;
          title?: string;
          content?: string;
          type?: "daily" | "weekly" | "project" | "custom";
          status?: "pending" | "processing" | "completed" | "failed";
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      signals: {
        Row: {
          id: string;
          user_id: string;
          project_id: string | null;
          type: "trend" | "connection" | "gap" | "insight";
          title: string;
          description: string | null;
          confidence: number | null;
          related_memory_ids: string[] | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          project_id?: string | null;
          type: "trend" | "connection" | "gap" | "insight";
          title: string;
          description?: string | null;
          confidence?: number | null;
          related_memory_ids?: string[] | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          project_id?: string | null;
          type?: "trend" | "connection" | "gap" | "insight";
          title?: string;
          description?: string | null;
          confidence?: number | null;
          related_memory_ids?: string[] | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      jobs: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          status: "pending" | "processing" | "completed" | "failed";
          input: Json;
          output: Json | null;
          error: string | null;
          created_at: string;
          updated_at: string;
          started_at: string | null;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          status?: "pending" | "processing" | "completed" | "failed";
          input: Json;
          output?: Json | null;
          error?: string | null;
          created_at?: string;
          updated_at?: string;
          started_at?: string | null;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          status?: "pending" | "processing" | "completed" | "failed";
          input?: Json;
          output?: Json | null;
          error?: string | null;
          created_at?: string;
          updated_at?: string;
          started_at?: string | null;
          completed_at?: string | null;
        };
      };
      memory_associations: {
        Row: {
          id: string;
          user_id: string;
          from_memory_id: string;
          to_memory_id: string;
          relation_type: string;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          from_memory_id: string;
          to_memory_id: string;
          relation_type: string;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          from_memory_id?: string;
          to_memory_id?: string;
          relation_type?: string;
          note?: string | null;
          created_at?: string;
        };
      };
      brief_memories: {
        Row: {
          brief_id: string;
          memory_id: string;
          relevance: string | null;
        };
        Insert: {
          brief_id: string;
          memory_id: string;
          relevance?: string | null;
        };
        Update: {
          brief_id?: string;
          memory_id?: string;
          relevance?: string | null;
        };
      };
      signal_rules: {
        Row: {
          id: string;
          user_id: string;
          project_id: string | null;
          name: string;
          query: string;
          match_type: string;
          is_active: boolean;
          last_checked_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          project_id?: string | null;
          name: string;
          query: string;
          match_type?: string;
          is_active?: boolean;
          last_checked_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          project_id?: string | null;
          name?: string;
          query?: string;
          match_type?: string;
          is_active?: boolean;
          last_checked_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      signal_matches: {
        Row: {
          id: string;
          user_id: string;
          signal_rule_id: string;
          memory_id: string | null;
          matched_text: string | null;
          is_dismissed: boolean;
          matched_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          signal_rule_id: string;
          memory_id?: string | null;
          matched_text?: string | null;
          is_dismissed?: boolean;
          matched_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          signal_rule_id?: string;
          memory_id?: string | null;
          matched_text?: string | null;
          is_dismissed?: boolean;
          matched_at?: string;
        };
      };
    };
    Functions: {
      match_memories: {
        Args: {
          query_embedding: number[];
          match_threshold: number;
          match_count: number;
          filter_user_id?: string;
          filter_project_id?: string;
        };
        Returns: {
          id: string;
          content: string;
          summary: string | null;
          similarity: number;
        }[];
      };
    };
  };
}
