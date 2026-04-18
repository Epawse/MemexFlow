import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useAuth } from "../../lib/AuthProvider";
import {
  useMemories,
  useProjects,
  useMemorySearch,
  useProjectAssociations,
  createAssociation,
  deleteAssociation,
} from "../../hooks/usePowerSyncQueries";
import { useQuery } from "@powersync/react";
import type { Memory, Project, MemoryAssociation, RelationType } from "../../lib/models";
import { Button } from "../../shared/components/Button";
import { EmptyState } from "../../shared/components/EmptyState";
import { Spinner } from "../../shared/components/Spinner";
import { Modal } from "../../shared/components/Modal";

type CaptureTitleRow = { id: string; title: string | null };

const RELATION_LABELS: Record<RelationType, { label: string; color: string }> = {
  supports: { label: "Supports", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  contradicts: { label: "Contradicts", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  elaborates: { label: "Elaborates", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  related: { label: "Related", color: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300" },
};

export function MemoriesPage() {
  const { user } = useAuth();
  const userId = user?.id ?? "";

  const {
    data: memoriesRaw,
    isLoading: memoriesLoading,
    error: memoriesError,
  } = useMemories(userId);
  const {
    data: projectsRaw,
    isLoading: projectsLoading,
    error: projectsError,
  } = useProjects(userId);
  const { data: capturesRaw } = useQuery(
    "SELECT id, title FROM captures WHERE user_id = ?",
    [userId],
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState<string | "all">("all");
  const [expandedMemory, setExpandedMemory] = useState<string | null>(null);
  const [linkModalMemoryId, setLinkModalMemoryId] = useState<string | null>(null);
  const [linkTargetId, setLinkTargetId] = useState("");
  const [linkRelationType, setLinkRelationType] = useState<RelationType>("supports");
  const [linkNote, setLinkNote] = useState("");
  const [linking, setLinking] = useState(false);
  const [detailAssociation, setDetailAssociation] = useState<{
    memoryId: string;
    associations: MemoryAssociation[];
  } | null>(null);

  const searchResult = useMemorySearch(searchQuery, userId);
  const { data: allAssociations } = useProjectAssociations(userId);

  const memories: Memory[] = memoriesRaw ?? [];
  const projects = useMemo(() => (projectsRaw ?? []) as Project[], [projectsRaw]);
  const captures = useMemo(() => (capturesRaw ?? []) as CaptureTitleRow[], [capturesRaw]);

  const capturesMap = useMemo(() => new Map(captures.map((c) => [c.id, c.title])), [captures]);
  const projectMap = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);

  // Build association count map: memoryId → { supports: N, contradicts: N, ... }
  const associationCounts = useMemo(() => {
    const map = new Map<string, Map<RelationType, number>>();
    for (const assoc of allAssociations ?? []) {
      for (const mid of [assoc.from_memory_id, assoc.to_memory_id]) {
        const counts = map.get(mid) ?? new Map<RelationType, number>();
        counts.set(assoc.relation_type as RelationType, (counts.get(assoc.relation_type as RelationType) ?? 0) + 1);
        map.set(mid, counts);
      }
    }
    return map;
  }, [allAssociations]);

  // Use search results when query is active, otherwise project-filtered memories
  const displayedMemories = searchQuery.trim()
    ? searchResult.data
    : selectedProject === "all"
      ? memories
      : memories.filter((m) => m.project_id === selectedProject);

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

  if (memoriesLoading || projectsLoading) {
    return <Spinner className="mt-12" />;
  }

  const queryError = memoriesError || projectsError;
  if (queryError) {
    return (
      <EmptyState
        className="mt-12"
        title="Couldn't load memories"
        description={queryError || "Please try again."}
        action={
          <Button onClick={() => window.location.reload()}>Reload</Button>
        }
      />
    );
  }

  const handleCreateAssociation = async () => {
    if (!user || !linkModalMemoryId || !linkTargetId) return;
    if (linkModalMemoryId === linkTargetId) {
      toast.error("Cannot link a memory to itself");
      return;
    }
    setLinking(true);
    try {
      await createAssociation({
        userId: user.id,
        fromMemoryId: linkModalMemoryId,
        toMemoryId: linkTargetId,
        relationType: linkRelationType,
        note: linkNote || undefined,
      });
      toast.success("Association created");
      setLinkModalMemoryId(null);
      setLinkTargetId("");
      setLinkRelationType("supports");
      setLinkNote("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error("Failed to create association", { description: msg });
    } finally {
      setLinking(false);
    }
  };

  const handleDeleteAssociation = async (assocId: string) => {
    try {
      await deleteAssociation(assocId);
      toast.success("Association removed");
      setDetailAssociation(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error("Failed to delete association", { description: msg });
    }
  };

  const renderAssociationBadges = (memoryId: string) => {
    const counts = associationCounts.get(memoryId);
    if (!counts || counts.size === 0) return null;

    return (
      <div className="flex flex-wrap gap-1 mt-2">
        {Array.from(counts.entries()).map(([type, count]) => {
          const info = RELATION_LABELS[type];
          return (
            <button
              key={type}
              onClick={(e) => {
                e.stopPropagation();
                const assocs = (allAssociations ?? []).filter(
                  (a) =>
                    (a.from_memory_id === memoryId || a.to_memory_id === memoryId) &&
                    a.relation_type === type,
                );
                setDetailAssociation({ memoryId, associations: assocs });
              }}
              className={`text-xs px-2 py-0.5 rounded-full font-medium cursor-pointer hover:opacity-80 ${info.color}`}
              aria-label={`View ${type} associations`}
            >
              {count} {info.label}
            </button>
          );
        })}
      </div>
    );
  };

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

      {/* Search bar */}
      <div className="mt-4">
        <input
          type="text"
          placeholder="Search memories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          aria-label="Search memories"
        />
      </div>

      {/* Project filter pills (hide when searching) */}
      {!searchQuery.trim() && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
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
          {projects.map((project) => (
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
      )}

      {displayedMemories.length === 0 ? (
        <EmptyState
          className="mt-8"
          title={searchQuery.trim() ? "No matching memories" : "No memories yet"}
          description={
            searchQuery.trim()
              ? "Try a different search term."
              : "Memories are extracted from your captures. Start by capturing some content."
          }
        />
      ) : (
        <div className="mt-6 space-y-4">
          {displayedMemories.map((memoryRow) => {
            const rawMetadata: unknown =
              typeof memoryRow.metadata === "string"
                ? JSON.parse(memoryRow.metadata || "{}")
                : (memoryRow.metadata ?? {});
            const metadata = (rawMetadata ?? {}) as {
              confidence?: number | string;
              key_claims?: string[];
            };
            const confidence = Number(metadata.confidence) || 0;
            const claims = metadata.key_claims ?? [];
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
                      {renderAssociationBadges(memoryRow.id)}
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
                      <div className="mt-3 flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            setLinkModalMemoryId(memoryRow.id);
                          }}
                        >
                          Link Memory
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Link Memory Modal */}
      <Modal
        open={linkModalMemoryId !== null}
        onClose={() => {
          setLinkModalMemoryId(null);
          setLinkTargetId("");
          setLinkRelationType("supports");
          setLinkNote("");
        }}
        title="Link Memory"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Target Memory
            </label>
            <select
              value={linkTargetId}
              onChange={(e) => setLinkTargetId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label="Select target memory"
            >
              <option value="">Select a memory...</option>
              {memories
                .filter((m) => m.id !== linkModalMemoryId)
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {(m.summary || m.content).slice(0, 80)}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Relation Type
            </label>
            <select
              value={linkRelationType}
              onChange={(e) => setLinkRelationType(e.target.value as RelationType)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label="Select relation type"
            >
              {Object.entries(RELATION_LABELS).map(([key, info]) => (
                <option key={key} value={key}>
                  {info.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Note (optional)
            </label>
            <input
              type="text"
              value={linkNote}
              onChange={(e) => setLinkNote(e.target.value)}
              placeholder="Why are these related?"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => {
                setLinkModalMemoryId(null);
                setLinkTargetId("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateAssociation}
              loading={linking}
              disabled={!linkTargetId}
            >
              Link
            </Button>
          </div>
        </div>
      </Modal>

      {/* Association Detail Modal */}
      <Modal
        open={detailAssociation !== null}
        onClose={() => setDetailAssociation(null)}
        title="Memory Associations"
        size="lg"
      >
        {detailAssociation && (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {detailAssociation.associations.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No associations found.</p>
            ) : (
              detailAssociation.associations.map((assoc) => {
                const otherId =
                  assoc.from_memory_id === detailAssociation.memoryId
                    ? assoc.to_memory_id
                    : assoc.from_memory_id;
                const otherMemory = memories.find((m) => m.id === otherId);
                const info = RELATION_LABELS[assoc.relation_type as RelationType];

                return (
                  <div
                    key={assoc.id}
                    className="flex items-start justify-between gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-900 dark:text-white">
                        {otherMemory?.summary || otherMemory?.content?.slice(0, 80) || "Unknown memory"}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${info.color}`}>
                          {info.label}
                        </span>
                        {assoc.note && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">{assoc.note}</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteAssociation(assoc.id)}
                      className="p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors cursor-pointer"
                      aria-label="Delete association"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
