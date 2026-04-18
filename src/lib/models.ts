import type { Database } from "./database.types";

type TableRow<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type Project = TableRow<"projects">;
export type Capture = TableRow<"captures">;
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

export interface SignalRule {
  id: string;
  user_id: string;
  project_id: string | null;
  name: string;
  query: string;
  match_type: MatchType;
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
