import { useQuery } from "@powersync/react";
import { useState, useEffect, useCallback } from "react";
import { getPowerSyncDb } from "../lib/powersync";
import { supabase } from "../lib/supabase";

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
    return data ?? [];
  }, [userId]);

  return useDataQuery(
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
    return data ? [data] : [];
  }, [projectId]);

  return useDataQuery(
    "SELECT * FROM projects WHERE id = ?",
    [projectId],
    supabaseQuery,
    [projectId],
  );
}

// ---------------------------------------------------------------------------
// Capture queries
// ---------------------------------------------------------------------------

export function useCaptures(userId: string) {
  const supabaseQuery = useCallback(async () => {
    const { data, error } = await (supabase.from("captures") as any)
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  }, [userId]);

  return useDataQuery(
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
    return data ?? [];
  }, [projectId]);

  return useDataQuery(
    "SELECT * FROM captures WHERE project_id = ? ORDER BY created_at DESC",
    [projectId],
    supabaseQuery,
    [projectId],
  );
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
    return data ?? [];
  }, [userId]);

  return useDataQuery(
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
    return data ?? [];
  }, [projectId]);

  return useDataQuery(
    "SELECT * FROM memories WHERE project_id = ? ORDER BY created_at DESC",
    [projectId],
    supabaseQuery,
    [projectId],
  );
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
    return data ?? [];
  }, [userId]);

  return useDataQuery(
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
    return data ?? [];
  }, [userId, limit]);

  return useDataQuery(
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
    return data ?? [];
  }, [userId, limit]);

  return useDataQuery(
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
// Internal: dual-path data hook
// ---------------------------------------------------------------------------
// Internal: dual-path data hook
// ---------------------------------------------------------------------------

/**
 * useDataQuery: Tries PowerSync reactive query first, falls back to Supabase.
 *
 * Always calls useQuery (React hooks rule: no conditional calls).
 * If PowerSync has data we use it reactively; otherwise we fall back to Supabase.
 */
function useDataQuery<T extends Record<string, unknown>>(
  powerSyncSql: string,
  psParams: any[],
  supabaseFetcher: () => Promise<T[]>,
  deps: any[],
) {
  // Always call useQuery — required by React hooks rules
  const psResult = useQuery(powerSyncSql, psParams);
  const [fallbackData, setFallbackData] = useState<T[]>([]);
  const [fallbackLoading, setFallbackLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const psData = psResult.data as T[] | undefined;
  const hasPsData = psData && psData.length > 0;

  useEffect(() => {
    // If PowerSync already has data, don't fetch from Supabase
    if (hasPsData) {
      setFallbackLoading(false);
      return;
    }

    // PowerSync empty or still loading — fetch from Supabase as fallback
    let cancelled = false;
    setFallbackLoading(true);
    supabaseFetcher()
      .then((data) => {
        if (!cancelled) {
          setFallbackData(data);
          setFallbackLoading(false);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || "Failed to fetch data");
          setFallbackLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPsData, ...deps]);

  // When PowerSync data arrives, switch to it
  useEffect(() => {
    if (hasPsData) {
      setFallbackLoading(false);
    }
  }, [hasPsData]);

  return {
    data: hasPsData ? psData! : fallbackData,
    isLoading: hasPsData ? psResult.isLoading : fallbackLoading,
    // Suppress fallback error once PowerSync is serving data — the error was
    // from a stale Supabase attempt while PS was still hydrating.
    error: hasPsData ? null : error,
  };
}
