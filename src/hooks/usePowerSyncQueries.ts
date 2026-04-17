import { useQuery } from "@powersync/react";

/**
 * Hook to fetch all projects for the current user
 */
export function useProjects(userId: string) {
  return useQuery(
    `SELECT * FROM projects WHERE user_id = ? ORDER BY updated_at DESC`,
    [userId],
  );
}

/**
 * Hook to fetch captures with optional filters
 */
export function useCaptures(
  userId: string,
  filters?: {
    projectId?: string;
    status?: string;
  },
) {
  let query = "SELECT * FROM captures WHERE user_id = ?";
  const params: string[] = [userId];

  if (filters?.projectId) {
    query += " AND project_id = ?";
    params.push(filters.projectId);
  }

  if (filters?.status) {
    query += " AND status = ?";
    params.push(filters.status);
  }

  query += " ORDER BY created_at DESC";

  return useQuery(query, params);
}

/**
 * Hook to fetch memories with optional filters
 */
export function useMemories(
  userId: string,
  filters?: {
    projectId?: string;
    type?: string;
  },
) {
  let query = "SELECT * FROM memories WHERE user_id = ?";
  const params: string[] = [userId];

  if (filters?.projectId) {
    query += " AND project_id = ?";
    params.push(filters.projectId);
  }

  if (filters?.type) {
    query += " AND type = ?";
    params.push(filters.type);
  }

  query += " ORDER BY created_at DESC";

  return useQuery(query, params);
}

/**
 * Hook to fetch briefs
 */
export function useBriefs(userId: string, projectId?: string) {
  const query = projectId
    ? "SELECT * FROM briefs WHERE user_id = ? AND project_id = ? ORDER BY created_at DESC"
    : "SELECT * FROM briefs WHERE user_id = ? ORDER BY created_at DESC";

  const params = projectId ? [userId, projectId] : [userId];

  return useQuery(query, params);
}

/**
 * Hook to fetch signals
 */
export function useSignals(userId: string, projectId?: string) {
  const query = projectId
    ? "SELECT * FROM signals WHERE user_id = ? AND project_id = ? ORDER BY created_at DESC"
    : "SELECT * FROM signals WHERE user_id = ? ORDER BY created_at DESC";

  const params = projectId ? [userId, projectId] : [userId];

  return useQuery(query, params);
}

/**
 * Hook to fetch jobs by status
 */
export function useJobs(userId: string, status?: string) {
  const query = status
    ? "SELECT * FROM jobs WHERE user_id = ? AND status = ? ORDER BY created_at DESC"
    : "SELECT * FROM jobs WHERE user_id = ? ORDER BY created_at DESC";

  const params = status ? [userId, status] : [userId];

  return useQuery(query, params);
}
