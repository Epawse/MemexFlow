import type { Database } from "./database.types";

type TableRow<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type Project = TableRow<"projects">;
export type Capture = TableRow<"captures">;
export type CaptureStatus = "pending" | "confirmed" | "ignored";
export type Memory = TableRow<"memories">;
export type Brief = TableRow<"briefs">;
export type Signal = TableRow<"signals">;
export type Job = TableRow<"jobs">;

export type RelationType = "supports" | "contradicts" | "elaborates" | "related";

export interface MemoryAssociation {
  id: string;
  user_id: string;
  from_memory_id: string;
  to_memory_id: string;
  relation_type: RelationType;
  note: string | null;
  created_at: string;
}

export interface BriefMemory {
  brief_id: string;
  memory_id: string;
  relevance: string | null;
}

export type MatchType = "keyword" | "regex";
export type ChannelType = "internal" | "rss" | "github_release";

export interface SignalRule {
  id: string;
  user_id: string;
  project_id: string | null;
  name: string;
  query: string;
  match_type: MatchType;
  channel_type: ChannelType;
  channel_config: string; // JSON string in PowerSync, object in Supabase
  is_active: number;
  last_checked_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SignalMatch {
  id: string;
  user_id: string;
  signal_rule_id: string;
  memory_id: string | null;
  matched_text: string | null;
  is_dismissed: number;
  matched_at: string;
}

export interface SignalDiscovery {
  id: string;
  user_id: string;
  signal_rule_id: string;
  project_id: string | null;
  source_type: "rss" | "github_release";
  source_uri: string;
  title: string;
  summary: string | null;
  published_at: string | null;
  is_captured: number; // 0 or 1 in PowerSync
  capture_id: string | null;
  discovered_at: string;
}

export type RecallReason = "time_based" | "project_active" | "association_dense" | "signal_triggered";
export type RecallPriority = "low" | "medium" | "high";

export interface Recall {
  id: string;
  user_id: string;
  project_id: string | null;
  memory_id: string;
  reason: RecallReason;
  priority: RecallPriority;
  reason_detail: string | null;
  scheduled_at: string;
  revisited_at: string | null;
  dismissed_at: string | null;
  created_at: string;
}
