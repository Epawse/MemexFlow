import { useQuery } from "@powersync/react";
import { useState, useEffect, useCallback } from "react";
import { getPowerSyncDb } from "../lib/powersync";
import { supabase } from "../lib/supabase";
import i18n from "../i18n/config";
import type { Project, Capture, Memory, Job, MemoryAssociation, RelationType, Brief, BriefMemory, SignalRule, SignalMatch, SignalDiscovery, CaptureStatus, ChannelType, Recall } from "../lib/models";

// ---------------------------------------------------------------------------
// Project queries
// ---------------------------------------------------------------------------

export function useProjects(userId: string) {
  const supabaseQuery = useCallback(async () => {
    const { data, error } = await (supabase.from("projects") as any)
      .select("*")
      .eq("user_id", userId)
      .eq("archived", false)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Project[];
  }, [userId]);

  return useDataQuery<Project>(
    "SELECT * FROM projects WHERE user_id = ? AND archived = 0 ORDER BY updated_at DESC",
    [userId],
    supabaseQuery,
    [userId],
  );
}

export function useProject(projectId: string) {
  const supabaseQuery = useCallback(async () => {
    const { data, error } = await (supabase.from("projects") as any)
      .select("*")
      .eq("id", projectId)
      .single();
    if (error) throw error;
    return (data ? [data] : []) as Project[];
  }, [projectId]);

  return useDataQuery<Project>(
    "SELECT * FROM projects WHERE id = ?",
    [projectId],
    supabaseQuery,
    [projectId],
  );
}

// ---------------------------------------------------------------------------
// Capture queries
// ---------------------------------------------------------------------------

export function useCapture(captureId: string) {
  const supabaseQuery = useCallback(async () => {
    const { data, error } = await (supabase.from("captures") as any)
      .select("*")
      .eq("id", captureId)
      .single();
    if (error) throw error;
    return (data ? [data] : []) as Capture[];
  }, [captureId]);

  return useDataQuery<Capture>(
    "SELECT * FROM captures WHERE id = ?",
    [captureId],
    supabaseQuery,
    [captureId],
  );
}

export function useCaptureMemories(captureId: string) {
  const supabaseQuery = useCallback(async () => {
    const { data, error } = await (supabase.from("memories") as any)
      .select("*")
      .eq("capture_id", captureId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Memory[];
  }, [captureId]);

  return useDataQuery<Memory>(
    "SELECT * FROM memories WHERE capture_id = ? ORDER BY created_at DESC",
    [captureId],
    supabaseQuery,
    [captureId],
  );
}

export function useCaptures(userId: string) {
  const supabaseQuery = useCallback(async () => {
    const { data, error } = await (supabase.from("captures") as any)
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Capture[];
  }, [userId]);

  return useDataQuery<Capture>(
    "SELECT * FROM captures WHERE user_id = ? ORDER BY created_at DESC",
    [userId],
    supabaseQuery,
    [userId],
  );
}

export function useProjectCaptures(projectId: string) {
  const supabaseQuery = useCallback(async () => {
    const { data, error } = await (supabase.from("captures") as any)
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Capture[];
  }, [projectId]);

  return useDataQuery<Capture>(
    "SELECT * FROM captures WHERE project_id = ? ORDER BY created_at DESC",
    [projectId],
    supabaseQuery,
    [projectId],
  );
}

export function useCapturesByStatus(userId: string, status: CaptureStatus | null) {
  const supabaseQuery = useCallback(async () => {
    let query = supabase
      .from("captures")
      .select("*")
      .eq("user_id", userId);
    if (status) {
      query = query.eq("status", status);
    }
    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Capture[];
  }, [userId, status]);

  const sql = status
    ? "SELECT * FROM captures WHERE user_id = ? AND status = ? ORDER BY created_at DESC"
    : "SELECT * FROM captures WHERE user_id = ? ORDER BY created_at DESC";
  const params = status ? [userId, status] : [userId];

  return useDataQuery<Capture>(sql, params, supabaseQuery, [userId, status]);
}

export function usePendingCaptureCount(userId: string) {
  const db = getPowerSyncDb();
  const countResult = useQuery(
    "SELECT count(*) as count FROM captures WHERE user_id = ? AND status = 'pending'",
    [userId],
  );

  const [fallbackCount, setFallbackCount] = useState(0);
  const [fallbackLoading, setFallbackLoading] = useState(!db);

  useEffect(() => {
    if (db || !userId) return;
    let cancelled = false;
    supabase
      .from("captures")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "pending")
      .then(({ count, error }) => {
        if (!cancelled && !error) {
          setFallbackCount(count ?? 0);
          setFallbackLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [db, userId]);

  if (db) {
    const rows = (countResult.data ?? []) as Array<{ count: number | string }>;
    return { count: Number(rows[0]?.count ?? 0), isLoading: countResult.isLoading };
  }
  return { count: fallbackCount, isLoading: fallbackLoading };
}

// ---------------------------------------------------------------------------
// Memory queries
// ---------------------------------------------------------------------------

export function useMemories(userId: string) {
  const supabaseQuery = useCallback(async () => {
    const { data, error } = await (supabase.from("memories") as any)
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Memory[];
  }, [userId]);

  return useDataQuery<Memory>(
    "SELECT * FROM memories WHERE user_id = ? ORDER BY created_at DESC",
    [userId],
    supabaseQuery,
    [userId],
  );
}

export function useProjectMemories(projectId: string) {
  const supabaseQuery = useCallback(async () => {
    const { data, error } = await (supabase.from("memories") as any)
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Memory[];
  }, [projectId]);

  return useDataQuery<Memory>(
    "SELECT * FROM memories WHERE project_id = ? ORDER BY created_at DESC",
    [projectId],
    supabaseQuery,
    [projectId],
  );
}

// ---------------------------------------------------------------------------
// Memory search (FTS5)
// ---------------------------------------------------------------------------

export function useMemorySearch(query: string, userId: string) {
  const db = getPowerSyncDb();
  const trimmed = query.trim();

  // FTS5 match query — search content and summary
  const ftsResult = useQuery(
    trimmed
      ? `SELECT m.* FROM memories m
         JOIN memories_fts fts ON m.rowid = fts.rowid
         WHERE memories_fts MATCH ? AND m.user_id = ?
         ORDER BY rank
         LIMIT 50`
      : "SELECT * FROM memories WHERE 0",
    trimmed ? [trimmed, userId] : [],
  );

  // Supabase fallback: use ilike for basic text search
  const supabaseQuery = useCallback(async () => {
    if (!trimmed) return [];
    const { data, error } = await (supabase.from("memories") as any)
      .select("*")
      .eq("user_id", userId)
      .or(`content.ilike.%${trimmed}%,summary.ilike.%${trimmed}%`)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return (data ?? []) as Memory[];
  }, [trimmed, userId]);

  const [fallbackData, setFallbackData] = useState<Memory[]>([]);
  const [fallbackLoading, setFallbackLoading] = useState(!db && !!trimmed);
  const [fallbackError, setFallbackError] = useState<string | null>(null);

  useEffect(() => {
    if (db || !trimmed) return;
    let cancelled = false;
    setFallbackLoading(true);
    supabaseQuery()
      .then((data) => {
        if (!cancelled) {
          setFallbackData(data);
          setFallbackLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setFallbackError(err.message || i18n.t("common.searchFailed"));
          setFallbackLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [db, trimmed, supabaseQuery]);

  if (db) {
    return {
      data: (trimmed ? (ftsResult.data ?? []) : []) as Memory[],
      isLoading: ftsResult.isLoading,
      error: null as string | null,
    };
  }

  return {
    data: fallbackData,
    isLoading: fallbackLoading,
    error: fallbackError,
  };
}

// ---------------------------------------------------------------------------
// Memory associations
// ---------------------------------------------------------------------------

export function useMemoryAssociations(memoryId: string) {
  const supabaseQuery = useCallback(async () => {
    const { data, error } = await (supabase.from("memory_associations") as any)
      .select("*")
      .or(`from_memory_id.eq.${memoryId},to_memory_id.eq.${memoryId}`);
    if (error) throw error;
    return (data ?? []) as MemoryAssociation[];
  }, [memoryId]);

  return useDataQuery<MemoryAssociation>(
    `SELECT * FROM memory_associations
     WHERE from_memory_id = ? OR to_memory_id = ?`,
    [memoryId, memoryId],
    supabaseQuery,
    [memoryId],
  );
}

export function useProjectAssociations(userId: string) {
  const supabaseQuery = useCallback(async () => {
    const { data, error } = await (supabase.from("memory_associations") as any)
      .select("*")
      .eq("user_id", userId);
    if (error) throw error;
    return (data ?? []) as MemoryAssociation[];
  }, [userId]);

  return useDataQuery<MemoryAssociation>(
    "SELECT * FROM memory_associations WHERE user_id = ?",
    [userId],
    supabaseQuery,
    [userId],
  );
}

export async function createAssociation(params: {
  userId: string;
  fromMemoryId: string;
  toMemoryId: string;
  relationType: RelationType;
  note?: string;
}) {
  const id = crypto.randomUUID();
  const db = getPowerSyncDb();
  if (db) {
    await db.execute(
      "INSERT INTO memory_associations (id, user_id, from_memory_id, to_memory_id, relation_type, note, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))",
      [id, params.userId, params.fromMemoryId, params.toMemoryId, params.relationType, params.note ?? null],
    );
  } else {
    const { error } = await (supabase.from("memory_associations") as any).insert({
      id,
      user_id: params.userId,
      from_memory_id: params.fromMemoryId,
      to_memory_id: params.toMemoryId,
      relation_type: params.relationType,
      note: params.note ?? null,
    });
    if (error) throw error;
  }
  return id;
}

export async function deleteAssociation(associationId: string) {
  const db = getPowerSyncDb();
  if (db) {
    await db.execute("DELETE FROM memory_associations WHERE id = ?", [associationId]);
  } else {
    const { error } = await (supabase.from("memory_associations") as any).delete().eq("id", associationId);
    if (error) throw error;
  }
}

// ---------------------------------------------------------------------------
// Job queries (for capture status tracking)
// ---------------------------------------------------------------------------

export function usePendingJobs(userId: string) {
  const supabaseQuery = useCallback(async () => {
    const { data, error } = await (supabase.from("jobs") as any)
      .select("id, type, status, input, error")
      .eq("user_id", userId)
      .in("status", ["pending", "processing", "failed"])
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return (data ?? []) as Job[];
  }, [userId]);

  return useDataQuery<Job>(
    "SELECT * FROM jobs WHERE user_id = ? AND status IN ('pending', 'processing', 'failed') ORDER BY created_at DESC LIMIT 200",
    [userId],
    supabaseQuery,
    [userId],
  );
}

// ---------------------------------------------------------------------------
// Dashboard stats
// ---------------------------------------------------------------------------

export function useDashboardStats(userId: string) {
  const db = getPowerSyncDb();

  // PowerSync path: reactive useQuery on each table. Safe to call
  // unconditionally — when db is null, useQuery no-ops inside the provider.
  const capturesCount = useQuery(
    "SELECT count(*) as count FROM captures WHERE user_id = ?",
    [userId],
  );
  const memoriesCount = useQuery(
    "SELECT count(*) as count FROM memories WHERE user_id = ?",
    [userId],
  );
  const projectsCount = useQuery(
    "SELECT count(*) as count FROM projects WHERE user_id = ? AND archived = 0",
    [userId],
  );
  const briefsCount = useQuery(
    "SELECT count(*) as count FROM briefs WHERE user_id = ?",
    [userId],
  );

  // Supabase fallback (used when PowerSync is not configured)
  const [fallbackStats, setFallbackStats] = useState({
    captures: 0,
    memories: 0,
    projects: 0,
    briefs: 0,
  });
  const [fallbackLoading, setFallbackLoading] = useState(true);

  const fetchCount = useCallback(
    async (table: string) => {
      const { count, error } = await (supabase.from(table) as any)
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);
      if (error) throw error;
      return count ?? 0;
    },
    [userId],
  );

  useEffect(() => {
    if (!userId || db) return;
    Promise.all([
      fetchCount("captures"),
      fetchCount("memories"),
      fetchCount("projects"),
      fetchCount("briefs"),
    ])
      .then(([captures, memories, projects, briefs]) => {
        setFallbackStats({ captures, memories, projects, briefs });
        setFallbackLoading(false);
      })
      .catch(() => setFallbackLoading(false));
  }, [userId, db, fetchCount]);

  if (db) {
    const readCount = (result: { data: unknown }): number => {
      const rows = (result.data ?? []) as Array<{ count: number | string }>;
      return Number(rows[0]?.count ?? 0);
    };
    return {
      captures: readCount(capturesCount),
      memories: readCount(memoriesCount),
      projects: readCount(projectsCount),
      briefs: readCount(briefsCount),
      isLoading:
        capturesCount.isLoading ||
        memoriesCount.isLoading ||
        projectsCount.isLoading ||
        briefsCount.isLoading,
    };
  }

  return { ...fallbackStats, isLoading: fallbackLoading };
}

// ---------------------------------------------------------------------------
// Recent items
// ---------------------------------------------------------------------------

export function useRecentCaptures(userId: string, limit: number = 5) {
  const supabaseQuery = useCallback(async () => {
    const { data, error } = await (supabase.from("captures") as any)
      .select("id, title, type, project_id, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as Capture[];
  }, [userId, limit]);

  return useDataQuery<Capture>(
    "SELECT * FROM captures WHERE user_id = ? ORDER BY created_at DESC LIMIT ?",
    [userId, limit],
    supabaseQuery,
    [userId, limit],
  );
}

export function useActiveProjects(userId: string, limit: number = 5) {
  const supabaseQuery = useCallback(async () => {
    const { data, error } = await (supabase.from("projects") as any)
      .select("id, title, description, color, updated_at")
      .eq("user_id", userId)
      .eq("archived", false)
      .order("updated_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as Project[];
  }, [userId, limit]);

  return useDataQuery<Project>(
    "SELECT * FROM projects WHERE user_id = ? AND archived = 0 ORDER BY updated_at DESC LIMIT ?",
    [userId, limit],
    supabaseQuery,
    [userId, limit],
  );
}

// ---------------------------------------------------------------------------
// Project mutations
// ---------------------------------------------------------------------------

export async function createProject(
  userId: string,
  title: string,
  description: string | null,
  color: string,
) {
  const id = crypto.randomUUID();
  const db = getPowerSyncDb();
  if (db) {
    await db.execute(
      "INSERT INTO projects (id, user_id, title, description, color, icon, archived, created_at, updated_at) VALUES (?, ?, ?, ?, ?, '', 0, datetime('now'), datetime('now'))",
      [id, userId, title, description || "", color],
    );
  } else {
    await (supabase.from("projects") as any).insert({
      id,
      user_id: userId,
      title,
      description,
      color,
    });
  }
  return id;
}

export async function updateProject(
  projectId: string,
  updates: { title?: string; description?: string | null; color?: string },
) {
  const db = getPowerSyncDb();
  if (db) {
    const sets: string[] = [];
    const params: any[] = [];
    if (updates.title !== undefined) {
      sets.push("title = ?");
      params.push(updates.title);
    }
    if (updates.description !== undefined) {
      sets.push("description = ?");
      params.push(updates.description ?? "");
    }
    if (updates.color !== undefined) {
      sets.push("color = ?");
      params.push(updates.color);
    }
    sets.push("updated_at = datetime('now')");
    params.push(projectId);
    await db.execute(
      `UPDATE projects SET ${sets.join(", ")} WHERE id = ?`,
      params,
    );
  } else {
    await (supabase.from("projects") as any)
      .update(updates)
      .eq("id", projectId);
  }
}

export async function archiveProject(projectId: string) {
  const db = getPowerSyncDb();
  if (db) {
    await db.execute(
      "UPDATE projects SET archived = 1, updated_at = datetime('now') WHERE id = ?",
      [projectId],
    );
  } else {
    await (supabase.from("projects") as any)
      .update({ archived: true })
      .eq("id", projectId);
  }
}

export async function deleteProject(projectId: string) {
  const db = getPowerSyncDb();
  if (db) {
    await db.execute("DELETE FROM projects WHERE id = ?", [projectId]);
  } else {
    await (supabase.from("projects") as any).delete().eq("id", projectId);
  }
}

// ---------------------------------------------------------------------------
// Brief queries & mutations
// ---------------------------------------------------------------------------

export function useProjectBriefs(projectId: string) {
  const supabaseQuery = useCallback(async () => {
    const { data, error } = await (supabase.from("briefs") as any)
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Brief[];
  }, [projectId]);

  return useDataQuery<Brief>(
    "SELECT * FROM briefs WHERE project_id = ? ORDER BY created_at DESC",
    [projectId],
    supabaseQuery,
    [projectId],
  );
}

export function useAllBriefs(userId: string) {
  const supabaseQuery = useCallback(async () => {
    const { data, error } = await (supabase.from("briefs") as any)
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Brief[];
  }, [userId]);

  return useDataQuery<Brief>(
    "SELECT * FROM briefs WHERE user_id = ? ORDER BY created_at DESC",
    [userId],
    supabaseQuery,
    [userId],
  );
}

export function useBrief(briefId: string) {
  const supabaseQuery = useCallback(async () => {
    const { data, error } = await (supabase.from("briefs") as any)
      .select("*")
      .eq("id", briefId);
    if (error) throw error;
    return (data ?? []) as Brief[];
  }, [briefId]);

  return useDataQuery<Brief>(
    "SELECT * FROM briefs WHERE id = ?",
    [briefId],
    supabaseQuery,
    [briefId],
  );
}

export function useBriefCitations(briefId: string) {
  const supabaseQuery = useCallback(async () => {
    const { data, error } = await (supabase.from("brief_memories") as any)
      .select("*")
      .eq("brief_id", briefId);
    if (error) throw error;
    return (data ?? []) as BriefMemory[];
  }, [briefId]);

  return useDataQuery<BriefMemory>(
    "SELECT * FROM brief_memories WHERE brief_id = ?",
    [briefId],
    supabaseQuery,
    [briefId],
  );
}

export async function createBriefJob(projectId: string, userId: string) {
  const briefId = crypto.randomUUID();
  const jobId = crypto.randomUUID();
  const now = new Date().toISOString();
  const db = getPowerSyncDb();

  const language = i18n.language || "zh";
  if (db) {
    await db.execute(
      "INSERT INTO briefs (id, user_id, project_id, title, content, type, status, metadata, created_at, updated_at) VALUES (?, ?, ?, ?, '', 'project', 'pending', '{}', ?, ?)",
      [briefId, userId, projectId, i18n.t("briefs.generatingTitle"), now, now],
    );
    await db.execute(
      "INSERT INTO jobs (id, user_id, type, status, input, output, error, created_at, updated_at) VALUES (?, ?, 'briefing', 'pending', ?, '', '', ?, ?)",
      [jobId, userId, JSON.stringify({ project_id: projectId, user_id: userId, brief_id: briefId, language }), now, now],
    );
  } else {
    const { error: briefError } = await (supabase.from("briefs") as any).insert({
      id: briefId,
      user_id: userId,
      project_id: projectId,
      title: i18n.t("briefs.generatingTitle"),
      content: "",
      type: "project",
      status: "pending",
    });
    if (briefError) throw briefError;
    const { error: jobError } = await (supabase.from("jobs") as any).insert({
      id: jobId,
      user_id: userId,
      type: "briefing",
      status: "pending",
      input: { project_id: projectId, user_id: userId, brief_id: briefId },
    });
    if (jobError) throw jobError;
  }

  return { briefId, jobId };
}

export async function deleteBrief(briefId: string) {
  const db = getPowerSyncDb();
  if (db) {
    await db.execute("DELETE FROM briefs WHERE id = ?", [briefId]);
  } else {
    const { error } = await (supabase.from("briefs") as any).delete().eq("id", briefId);
    if (error) throw error;
  }
}

// ---------------------------------------------------------------------------
// Signal queries & mutations
// ---------------------------------------------------------------------------

export function useSignalRules(projectId: string) {
  const supabaseQuery = useCallback(async () => {
    const { data, error } = await (supabase.from("signal_rules") as any)
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as SignalRule[];
  }, [projectId]);

  return useDataQuery<SignalRule>(
    "SELECT * FROM signal_rules WHERE project_id = ? ORDER BY created_at DESC",
    [projectId],
    supabaseQuery,
    [projectId],
  );
}

export function useUndismissedSignalMatches(userId: string) {
  const supabaseQuery = useCallback(async () => {
    const { data, error } = await (supabase.from("signal_matches") as any)
      .select("*")
      .eq("user_id", userId)
      .eq("is_dismissed", false)
      .order("matched_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return (data ?? []) as SignalMatch[];
  }, [userId]);

  return useDataQuery<SignalMatch>(
    "SELECT * FROM signal_matches WHERE user_id = ? AND is_dismissed = 0 ORDER BY matched_at DESC LIMIT 50",
    [userId],
    supabaseQuery,
    [userId],
  );
}

export function useUnreadSignalCount(userId: string) {
  const db = getPowerSyncDb();
  const countResult = useQuery(
    "SELECT count(*) as count FROM signal_matches WHERE user_id = ? AND is_dismissed = 0",
    [userId],
  );

  const [fallbackCount, setFallbackCount] = useState(0);
  const [fallbackLoading, setFallbackLoading] = useState(!db);

  useEffect(() => {
    if (db || !userId) return;
    let cancelled = false;
    (supabase.from("signal_matches") as any)
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_dismissed", false)
      .then(({ count, error }: any) => {
        if (!cancelled && !error) {
          setFallbackCount(count ?? 0);
          setFallbackLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [db, userId]);

  if (db) {
    const rows = (countResult.data ?? []) as Array<{ count: number | string }>;
    return { count: Number(rows[0]?.count ?? 0), isLoading: countResult.isLoading };
  }
  return { count: fallbackCount, isLoading: fallbackLoading };
}

export async function createSignalRule(params: {
  userId: string;
  projectId: string;
  name: string;
  query: string;
  matchType?: "keyword" | "regex";
  channelType?: ChannelType;
  channelConfig?: Record<string, string>;
}) {
  const id = crypto.randomUUID();
  const channelType = params.channelType ?? "internal";
  const channelConfigJson = JSON.stringify(params.channelConfig ?? {});
  const db = getPowerSyncDb();
  if (db) {
    await db.execute(
      "INSERT INTO signal_rules (id, user_id, project_id, name, query, match_type, channel_type, channel_config, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))",
      [id, params.userId, params.projectId, params.name, params.query, params.matchType ?? "keyword", channelType, channelConfigJson],
    );
  } else {
    const { error } = await (supabase.from("signal_rules") as any).insert({
      id,
      user_id: params.userId,
      project_id: params.projectId,
      name: params.name,
      query: params.query,
      match_type: params.matchType ?? "keyword",
      channel_type: channelType,
      channel_config: params.channelConfig ?? {},
    });
    if (error) throw error;
  }
  return id;
}

export async function deleteSignalRule(ruleId: string) {
  const db = getPowerSyncDb();
  if (db) {
    await db.execute("DELETE FROM signal_rules WHERE id = ?", [ruleId]);
  } else {
    const { error } = await (supabase.from("signal_rules") as any).delete().eq("id", ruleId);
    if (error) throw error;
  }
}

export async function toggleRuleActive(ruleId: string, isActive: boolean) {
  const db = getPowerSyncDb();
  if (db) {
    await db.execute(
      "UPDATE signal_rules SET is_active = ?, updated_at = datetime('now') WHERE id = ?",
      [isActive ? 1 : 0, ruleId],
    );
  } else {
    const { error } = await (supabase.from("signal_rules") as any).update({ is_active: isActive }).eq("id", ruleId);
    if (error) throw error;
  }
}

export async function createSignalJob(ruleId: string, userId: string) {
  const jobId = crypto.randomUUID();
  const now = new Date().toISOString();
  const language = i18n.language || "zh";
  const db = getPowerSyncDb();
  if (db) {
    await db.execute(
      "INSERT INTO jobs (id, user_id, type, status, input, output, error, created_at, updated_at) VALUES (?, ?, 'signal', 'pending', ?, '', '', ?, ?)",
      [jobId, userId, JSON.stringify({ signal_rule_id: ruleId, user_id: userId, language }), now, now],
    );
  } else {
    const { error } = await (supabase.from("jobs") as any).insert({
      id: jobId,
      user_id: userId,
      type: "signal",
      status: "pending",
      input: { signal_rule_id: ruleId, user_id: userId, language },
    });
    if (error) throw error;
  }
  return jobId;
}

export async function dismissMatch(matchId: string) {
  const db = getPowerSyncDb();
  if (db) {
    await db.execute("UPDATE signal_matches SET is_dismissed = 1 WHERE id = ?", [matchId]);
  } else {
    const { error } = await (supabase.from("signal_matches") as any).update({ is_dismissed: true }).eq("id", matchId);
    if (error) throw error;
  }
}

// ---------------------------------------------------------------------------
// Signal discovery queries & mutations
// ---------------------------------------------------------------------------

export function useDiscoveries(userId: string) {
  const supabaseQuery = useCallback(async () => {
    const { data, error } = await (supabase.from("signal_discoveries") as any)
      .select("*")
      .eq("user_id", userId)
      .eq("is_captured", false)
      .order("discovered_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    return (data ?? []) as SignalDiscovery[];
  }, [userId]);

  return useDataQuery<SignalDiscovery>(
    "SELECT * FROM signal_discoveries WHERE user_id = ? AND is_captured = 0 ORDER BY discovered_at DESC LIMIT 100",
    [userId],
    supabaseQuery,
    [userId],
  );
}

export async function captureDiscovery(params: {
  userId: string;
  discovery: SignalDiscovery;
  projectId?: string | null;
}) {
  const { userId, discovery, projectId } = params;
  const captureId = crypto.randomUUID();
  const now = new Date().toISOString();
  const db = getPowerSyncDb();

  // 1. Create pending capture
  if (db) {
    await db.execute(
      "INSERT INTO captures (id, user_id, project_id, type, title, url, content, metadata, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, '', '{}', 'pending', ?, ?)",
      [captureId, userId, projectId || discovery.project_id || null, "url", discovery.title, discovery.source_uri, now, now],
    );
  } else {
    const { error: captureError } = await (supabase.from("captures") as any).insert({
      id: captureId,
      user_id: userId,
      project_id: projectId || discovery.project_id,
      type: "url",
      title: discovery.title,
      url: discovery.source_uri,
      status: "pending",
    });
    if (captureError) throw captureError;
  }

  // 2. Create ingestion job
  const jobId = crypto.randomUUID();
  const jobInput = JSON.stringify({ capture_id: captureId, url: discovery.source_uri, user_id: userId });
  if (db) {
    await db.execute(
      "INSERT INTO jobs (id, user_id, type, status, input, output, error, created_at, updated_at) VALUES (?, ?, 'ingestion', 'pending', ?, '', '', ?, ?)",
      [jobId, userId, jobInput, now, now],
    );
  } else {
    const { error: jobError } = await (supabase.from("jobs") as any).insert({
      id: jobId,
      user_id: userId,
      type: "ingestion",
      status: "pending",
      input: { capture_id: captureId, url: discovery.source_uri, user_id: userId },
    });
    if (jobError) throw jobError;
  }

  // 3. Mark discovery as captured
  if (db) {
    await db.execute(
      "UPDATE signal_discoveries SET is_captured = 1, capture_id = ? WHERE id = ?",
      [captureId, discovery.id],
    );
  } else {
    const { error: updateError } = await (supabase.from("signal_discoveries") as any)
      .update({ is_captured: true, capture_id: captureId })
      .eq("id", discovery.id);
    if (updateError) throw updateError;
  }

  return captureId;
}

export async function createSignalScanJob(ruleId: string, userId: string) {
  const jobId = crypto.randomUUID();
  const now = new Date().toISOString();
  const language = i18n.language || "zh";
  const db = getPowerSyncDb();
  if (db) {
    await db.execute(
      "INSERT INTO jobs (id, user_id, type, status, input, output, error, created_at, updated_at) VALUES (?, ?, 'signal_scan', 'pending', ?, '', '', ?, ?)",
      [jobId, userId, JSON.stringify({ signal_rule_id: ruleId, user_id: userId, language }), now, now],
    );
  } else {
    const { error } = await (supabase.from("jobs") as any).insert({
      id: jobId,
      user_id: userId,
      type: "signal_scan",
      status: "pending",
      input: { signal_rule_id: ruleId, user_id: userId, language },
    });
    if (error) throw error;
  }
  return jobId;
}

// ---------------------------------------------------------------------------
// Recall queries & mutations
// ---------------------------------------------------------------------------

export function usePendingRecalls(userId: string) {
  const supabaseQuery = useCallback(async () => {
    const { data, error } = await (supabase.from("recalls") as any)
      .select("*")
      .eq("user_id", userId)
      .is_("dismissed_at", null)
      .is_("revisited_at", null)
      .order("priority", { ascending: false })
      .order("scheduled_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return (data ?? []) as Recall[];
  }, [userId]);

  return useDataQuery<Recall>(
    "SELECT * FROM recalls WHERE user_id = ? AND dismissed_at IS NULL AND revisited_at IS NULL ORDER BY CASE priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 WHEN 'low' THEN 2 END, scheduled_at DESC LIMIT 50",
    [userId],
    supabaseQuery,
    [userId],
  );
}

export function useRecallCount(userId: string) {
  const db = getPowerSyncDb();
  const countResult = useQuery(
    "SELECT count(*) as count FROM recalls WHERE user_id = ? AND dismissed_at IS NULL AND revisited_at IS NULL",
    [userId],
  );

  const [fallbackCount, setFallbackCount] = useState(0);
  const [fallbackLoading, setFallbackLoading] = useState(!db);

  useEffect(() => {
    if (db || !userId) return;
    let cancelled = false;
    (supabase.from("recalls") as any)
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .is_("dismissed_at", null)
      .is_("revisited_at", null)
      .then(({ count, error }: any) => {
        if (!cancelled && !error) {
          setFallbackCount(count ?? 0);
          setFallbackLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [db, userId]);

  if (db) {
    const rows = (countResult.data ?? []) as Array<{ count: number | string }>;
    return { count: Number(rows[0]?.count ?? 0), isLoading: countResult.isLoading };
  }
  return { count: fallbackCount, isLoading: fallbackLoading };
}

export async function revisitRecall(recallId: string) {
  const db = getPowerSyncDb();
  const now = new Date().toISOString();
  if (db) {
    await db.execute(
      "UPDATE recalls SET revisited_at = ? WHERE id = ?",
      [now, recallId],
    );
  } else {
    const { error } = await (supabase.from("recalls") as any)
      .update({ revisited_at: now })
      .eq("id", recallId);
    if (error) throw error;
  }
}

export async function dismissRecall(recallId: string) {
  const db = getPowerSyncDb();
  const now = new Date().toISOString();
  if (db) {
    await db.execute(
      "UPDATE recalls SET dismissed_at = ? WHERE id = ?",
      [now, recallId],
    );
  } else {
    const { error } = await (supabase.from("recalls") as any)
      .update({ dismissed_at: now })
      .eq("id", recallId);
    if (error) throw error;
  }
}

export async function createRecallJob(userId: string, projectId?: string) {
  const jobId = crypto.randomUUID();
  const now = new Date().toISOString();
  const language = i18n.language || "zh";
  const input: Record<string, string> = { user_id: userId, language };
  if (projectId) input.project_id = projectId;
  const db = getPowerSyncDb();
  if (db) {
    await db.execute(
      "INSERT INTO jobs (id, user_id, type, status, input, output, error, created_at, updated_at) VALUES (?, ?, 'recall', 'pending', ?, '', '', ?, ?)",
      [jobId, userId, JSON.stringify(input), now, now],
    );
  } else {
    const { error } = await (supabase.from("jobs") as any).insert({
      id: jobId,
      user_id: userId,
      type: "recall",
      status: "pending",
      input,
    });
    if (error) throw error;
  }
  return jobId;
}

// ---------------------------------------------------------------------------
// Internal: dual-path data hook
// ---------------------------------------------------------------------------

/**
 * useDataQuery: returns rows from PowerSync when configured, otherwise
 * falls back to a direct Supabase query. There is no cross-fallback:
 * when PowerSync is configured we trust its result (including empty
 * sets), so a just-deleted-last-row state doesn't try Supabase and
 * fail offline.
 *
 * useQuery must be called unconditionally to satisfy the React hooks
 * rule; its result is simply ignored when PowerSync is disabled.
 */
function useDataQuery<T>(
  powerSyncSql: string,
  psParams: any[],
  supabaseFetcher: () => Promise<T[]>,
  deps: any[],
) {
  const db = getPowerSyncDb();
  const psResult = useQuery(powerSyncSql, psParams);

  const [fallbackData, setFallbackData] = useState<T[]>([]);
  const [fallbackLoading, setFallbackLoading] = useState(!db);
  const [fallbackError, setFallbackError] = useState<string | null>(null);

  useEffect(() => {
    if (db) return; // PowerSync path — skip Supabase fallback
    let cancelled = false;
    setFallbackLoading(true);
    setFallbackError(null);
    supabaseFetcher()
      .then((data) => {
        if (!cancelled) {
          setFallbackData(data);
          setFallbackLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setFallbackError(err.message || i18n.t("common.fetchFailed"));
          setFallbackLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, ...deps]);

  if (db) {
    return {
      data: ((psResult.data ?? []) as T[]),
      isLoading: psResult.isLoading,
      error: null as string | null,
    };
  }

  return {
    data: fallbackData,
    isLoading: fallbackLoading,
    error: fallbackError,
  };
}
