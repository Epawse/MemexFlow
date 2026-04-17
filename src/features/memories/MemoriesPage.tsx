import { useState } from "react";
import { useAuth } from "../../lib/AuthProvider";
import { useMemories, useProjects } from "../../hooks/usePowerSyncQueries";
import { useQuery } from "@powersync/react";
import { EmptyState } from "../../shared/components/EmptyState";
import { Spinner } from "../../shared/components/Spinner";

export function MemoriesPage() {
  const { user } = useAuth();
  const { data: memoriesRaw, isLoading: memoriesLoading } = useMemories(
    user?.id ?? "",
  );
  const { data: projectsRaw, isLoading: projectsLoading } = useProjects(
    user?.id ?? "",
  );
  const { data: capturesRaw } = useQuery(
    "SELECT id, title FROM captures WHERE user_id = ?",
    [user?.id ?? ""],
  );

  const [selectedProject, setSelectedProject] = useState<string | "all">("all");
  const [expandedMemory, setExpandedMemory] = useState<string | null>(null);

  const memories = memoriesRaw ?? [];
  const projects = projectsRaw ?? [];
  const captures = capturesRaw ?? [];

  const capturesMap = new Map(
    (captures as any[]).map((c: any) => [c.id, c.title]),
  );

  const filteredMemories =
    selectedProject === "all"
      ? memories
      : (memories as any[]).filter(
          (m: any) => m.project_id === selectedProject,
        );

  const confidenceColor = (confidence: number) => {
    if (confidence >= 0.7)
      return "bg-success-light text-success-dark dark:bg-green-900/30 dark:text-green-400";
    if (confidence >= 0.4)
      return "bg-warning-light text-warning-dark dark:bg-amber-900/30 dark:text-amber-400";
    return "bg-danger-light text-danger-dark dark:bg-red-900/30 dark:text-red-400";
  };

  const confidenceBorder = (confidence: number) => {
    if (confidence >= 0.7) return "border-l-success dark:border-l-green-500";
    if (confidence >= 0.4) return "border-l-warning dark:border-l-amber-500";
    return "border-l-danger dark:border-l-red-500";
  };

  const projectMap = new Map((projects as any[]).map((p: any) => [p.id, p]));

  if (memoriesLoading || projectsLoading) {
    return <Spinner className="mt-12" />;
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Memories
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Structured knowledge extracted from your captures
          </p>
        </div>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedProject("all")}
          className={`px-3 py-1.5 text-sm rounded-full whitespace-nowrap transition-colors cursor-pointer ${
            selectedProject === "all"
              ? "bg-primary-600 text-white dark:bg-primary-500"
              : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
          }`}
        >
          All
        </button>
        {(projects as any[]).map((project: any) => (
          <button
            key={project.id}
            onClick={() => setSelectedProject(project.id)}
            className={`px-3 py-1.5 text-sm rounded-full whitespace-nowrap transition-colors cursor-pointer ${
              selectedProject === project.id
                ? "bg-primary-600 text-white dark:bg-primary-500"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            {project.title}
          </button>
        ))}
      </div>

      {filteredMemories.length === 0 ? (
        <EmptyState
          className="mt-8"
          title="No memories yet"
          description="Memories are extracted from your captures. Start by capturing some content."
        />
      ) : (
        <div className="mt-6 space-y-4">
          {filteredMemories.map((memoryRow: any) => {
            const metadata =
              typeof memoryRow.metadata === "string"
                ? JSON.parse(memoryRow.metadata || "{}")
                : memoryRow.metadata || {};
            const confidence = Number(metadata.confidence) || 0;
            const claims = (metadata.key_claims as string[]) || [];
            const isExpanded = expandedMemory === memoryRow.id;
            const project = memoryRow.project_id
              ? projectMap.get(memoryRow.project_id)
              : null;
            const sourceTitle = memoryRow.capture_id
              ? capturesMap.get(memoryRow.capture_id)
              : null;

            return (
              <div
                key={memoryRow.id}
                className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 border-l-4 ${confidenceBorder(confidence)} cursor-pointer transition-shadow hover:shadow-md`}
                onClick={() =>
                  setExpandedMemory(isExpanded ? null : memoryRow.id)
                }
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {memoryRow.summary || "Memory"}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {confidence > 0 && (
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${confidenceColor(confidence)}`}
                          >
                            {Math.round(confidence * 100)}%
                          </span>
                        )}
                        {project && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <span
                              className="w-2 h-2 rounded-full inline-block"
                              style={{
                                backgroundColor: project.color || "#6366f1",
                              }}
                            />
                            {project.title}
                          </span>
                        )}
                        {sourceTitle && (
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            from {sourceTitle}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                      {new Date(memoryRow.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {claims.length > 0 && (
                    <ul className="mt-3 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      {claims.slice(0, 3).map((claim, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-primary-500 mt-0.5">•</span>
                          {claim}
                        </li>
                      ))}
                    </ul>
                  )}

                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {memoryRow.content}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
