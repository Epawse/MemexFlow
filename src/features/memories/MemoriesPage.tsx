import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
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
import { Card } from "../../shared/components/Card";
import { EmptyState } from "../../shared/components/EmptyState";
import { Spinner } from "../../shared/components/Spinner";
import { Button } from "../../shared/components/Button";
import { Modal } from "../../shared/components/Modal";
import { Input } from "../../shared/components/Input";
import { formatDate } from "../../lib/date";

type CaptureTitleRow = { id: string; title: string | null };
type ViewMode = "grid" | "list";

const RELATION_COLORS: Record<RelationType, string> = {
  supports:
    "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-500/20",
  contradicts:
    "bg-red-500/10 text-red-700 dark:text-red-400 ring-1 ring-red-500/20",
  elaborates:
    "bg-sky-500/10 text-sky-700 dark:text-sky-400 ring-1 ring-sky-500/20",
  related:
    "bg-gray-500/10 text-gray-700 dark:text-gray-300 ring-1 ring-gray-500/20",
};

const RELATION_DOT_COLORS: Record<RelationType, string> = {
  supports: "bg-emerald-500",
  contradicts: "bg-red-500",
  elaborates: "bg-sky-500",
  related: "bg-gray-400",
};

export function MemoriesPage() {
  const { t } = useTranslation();
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
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [expandedMemory, setExpandedMemory] = useState<string | null>(null);
  const [linkModalMemoryId, setLinkModalMemoryId] = useState<string | null>(
    null,
  );
  const [linkTargetId, setLinkTargetId] = useState("");
  const [linkRelationType, setLinkRelationType] =
    useState<RelationType>("supports");
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
  const captures = useMemo(
    () => (capturesRaw ?? []) as CaptureTitleRow[],
    [capturesRaw],
  );

  const capturesMap = useMemo(
    () => new Map(captures.map((c) => [c.id, c.title])),
    [captures],
  );
  const projectMap = useMemo(
    () => new Map(projects.map((p) => [p.id, p])),
    [projects],
  );

  // Build association count map: memoryId → { supports: N, contradicts: N, ... }
  const associationCounts = useMemo(() => {
    const map = new Map<string, Map<RelationType, number>>();
    for (const assoc of allAssociations ?? []) {
      for (const mid of [assoc.from_memory_id, assoc.to_memory_id]) {
        const counts =
          map.get(mid) ?? new Map<RelationType, number>();
        counts.set(
          assoc.relation_type as RelationType,
          (counts.get(assoc.relation_type as RelationType) ?? 0) + 1,
        );
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
      return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-500/20";
    if (confidence >= 0.4)
      return "bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-1 ring-amber-500/20";
    return "bg-red-500/10 text-red-700 dark:text-red-400 ring-1 ring-red-500/20";
  };

  if (memoriesLoading || projectsLoading) {
    return <Spinner className="mt-12" />;
  }

  const queryError = memoriesError || projectsError;
  if (queryError) {
    return (
      <EmptyState
        className="mt-12"
        title={t("common.error")}
        description={queryError || t("common.retry")}
        action={
          <Button onClick={() => window.location.reload()}>{t("common.retry")}</Button>
        }
      />
    );
  }

  const handleCreateAssociation = async () => {
    if (!user || !linkModalMemoryId || !linkTargetId) return;
    if (linkModalMemoryId === linkTargetId) {
      toast.error(t("memories.cannotLinkSelf"));
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
      toast.success(t("memories.created"));
      setLinkModalMemoryId(null);
      setLinkTargetId("");
      setLinkRelationType("supports");
      setLinkNote("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("common.error");
      toast.error(t("memories.createFailed"), { description: msg });
    } finally {
      setLinking(false);
    }
  };

  const handleDeleteAssociation = async (assocId: string) => {
    try {
      await deleteAssociation(assocId);
      toast.success(t("memories.removed"));
      setDetailAssociation(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("common.error");
      toast.error(t("memories.deleteFailed"), { description: msg });
    }
  };

  const renderAssociationPills = (memoryId: string) => {
    const counts = associationCounts.get(memoryId);
    if (!counts || counts.size === 0) return null;

    return (
      <div className="flex flex-wrap gap-1.5">
        {Array.from(counts.entries()).map(([type, count]) => (
          <button
            key={type}
            onClick={(e) => {
              e.stopPropagation();
              const assocs = (allAssociations ?? []).filter(
                (a) =>
                  (a.from_memory_id === memoryId ||
                    a.to_memory_id === memoryId) &&
                  a.relation_type === type,
              );
              setDetailAssociation({ memoryId, associations: assocs });
            }}
            className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium transition-all duration-150 hover:scale-105 cursor-pointer ${RELATION_COLORS[type]}`}
            aria-label={`${t("memories.associations")} ${type}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${RELATION_DOT_COLORS[type]}`}></span>
            {count}
            <span className="opacity-70">{t(`memories.relations.${type}`)}</span>
          </button>
        ))}
      </div>
    );
  };

  const MemoryCard = ({ memoryRow }: { memoryRow: Memory }) => {
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
      <Card
        hover={!isExpanded}
        onClick={() => setExpandedMemory(isExpanded ? null : memoryRow.id)}
        padding={isExpanded ? "lg" : "md"}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white leading-snug">
              {memoryRow.summary || t("memories.title")}
            </h3>

            {!isExpanded && (
              <p className="mt-1.5 text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
                {memoryRow.content?.slice(0, 200)}
                {memoryRow.content && memoryRow.content.length > 200 ? "..." : ""}
              </p>
            )}

            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {confidence > 0 && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${confidenceColor(confidence)}`}
                >
                  {Math.round(confidence * 100)}%
                </span>
              )}
              {project && (
                <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
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
                  {t("memories.fromSource", { title: sourceTitle })}
                </span>
              )}
            </div>

            {renderAssociationPills(memoryRow.id)}
          </div>

          <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap flex-shrink-0 mt-0.5">
            {formatDate(memoryRow.created_at)}
          </span>
        </div>

        {isExpanded && (
          <div className="mt-5 pt-5 border-t border-gray-200/60 dark:border-white/[0.08]">
            {claims.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  关键主张
                </p>
                <ul className="space-y-2">
                  {claims.slice(0, 5).map((claim, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-400 mt-1.5 flex-shrink-0"></span>
                      {claim}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="bg-gray-50/50 dark:bg-white/[0.03] rounded-xl p-4">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                内容
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {memoryRow.content}
              </p>
            </div>

            <div className="mt-4 flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  setLinkModalMemoryId(memoryRow.id);
                }}
              >
                {t("memories.linkMemory")}
              </Button>
            </div>
          </div>
        )}
      </Card>
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t("memories.title")}
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {t("memories.empty.description")}
          </p>
        </div>
      </div>

      {/* Search + View Toggle */}
      <div className="mt-5 flex items-center gap-3">
        <div className="flex-1">
          <Input
            type="text"
            placeholder={t("memories.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label={t("memories.searchPlaceholder")}
          />
        </div>
        <div className="flex bg-gray-100/80 dark:bg-white/[0.06] rounded-xl p-0.5">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-xl transition-all duration-150 cursor-pointer ${
              viewMode === "grid"
                ? "bg-white dark:bg-white/[0.12] shadow-sm text-primary-600 dark:text-primary-400"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
            aria-label="Grid view"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-xl transition-all duration-150 cursor-pointer ${
              viewMode === "list"
                ? "bg-white dark:bg-white/[0.12] shadow-sm text-primary-600 dark:text-primary-400"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
            aria-label="List view"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Project filter pills (hide when searching) */}
      {!searchQuery.trim() && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedProject("all")}
            className={`px-3.5 py-1.5 text-sm rounded-full whitespace-nowrap transition-all duration-150 cursor-pointer ${
              selectedProject === "all"
                ? "bg-primary-600 text-white dark:bg-primary-500 shadow-sm"
                : "bg-white/60 dark:bg-white/[0.06] text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-white/[0.1] ring-1 ring-gray-200/60 dark:ring-white/[0.08]"
            }`}
          >
            {t("common.all")}
          </button>
          {projects.map((project) => (
            <button
              key={project.id}
              onClick={() => setSelectedProject(project.id)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm rounded-full whitespace-nowrap transition-all duration-150 cursor-pointer ${
                selectedProject === project.id
                  ? "bg-primary-600 text-white dark:bg-primary-500 shadow-sm"
                  : "bg-white/60 dark:bg-white/[0.06] text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-white/[0.1] ring-1 ring-gray-200/60 dark:ring-white/[0.08]"
              }`}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: project.color || "#6366f1" }}
              />
              {project.title}
            </button>
          ))}
        </div>
      )}

      {displayedMemories.length === 0 ? (
        <EmptyState
          className="mt-8"
          title={
            searchQuery.trim()
              ? t("memories.empty.noMatch")
              : t("memories.empty.title")
          }
          description={
            searchQuery.trim()
              ? t("memories.empty.tryDifferent")
              : t("memories.empty.description")
          }
        />
      ) : viewMode === "grid" ? (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedMemories.map((memoryRow) => (
            <MemoryCard key={memoryRow.id} memoryRow={memoryRow} />
          ))}
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {displayedMemories.map((memoryRow) => (
            <MemoryCard key={memoryRow.id} memoryRow={memoryRow} />
          ))}
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
        title={t("memories.linkMemory")}
        size="md"
      >
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {t("memories.targetMemory")}
            </label>
            <select
              value={linkTargetId}
              onChange={(e) => setLinkTargetId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300/80 dark:border-gray-600/80 bg-white/60 dark:bg-white/[0.06] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
              aria-label={t("memories.targetMemory")}
            >
              <option value="">{t("memories.selectMemory")}</option>
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {t("memories.relationType")}
            </label>
            <select
              value={linkRelationType}
              onChange={(e) =>
                setLinkRelationType(e.target.value as RelationType)
              }
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300/80 dark:border-gray-600/80 bg-white/60 dark:bg-white/[0.06] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
              aria-label={t("memories.relationType")}
            >
              {(
                ["supports", "contradicts", "elaborates", "related"] as RelationType[]
              ).map((key) => (
                <option key={key} value={key}>
                  {t(`memories.relations.${key}`)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {t("memories.noteOptional")}
            </label>
            <Input
              type="text"
              value={linkNote}
              onChange={(e) => setLinkNote(e.target.value)}
              placeholder={t("memories.noteOptional")}
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
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleCreateAssociation}
              loading={linking}
              disabled={!linkTargetId}
            >
              {t("memories.link")}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Association Detail Modal */}
      <Modal
        open={detailAssociation !== null}
        onClose={() => setDetailAssociation(null)}
        title={t("memories.associations")}
        size="lg"
      >
        {detailAssociation && (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {detailAssociation.associations.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("memories.noAssociations")}
              </p>
            ) : (
              detailAssociation.associations.map((assoc) => {
                const otherId =
                  assoc.from_memory_id === detailAssociation.memoryId
                    ? assoc.to_memory_id
                    : assoc.from_memory_id;
                const otherMemory = memories.find((m) => m.id === otherId);
                const colorCls = RELATION_COLORS[assoc.relation_type as RelationType];

                return (
                  <div
                    key={assoc.id}
                    className="flex items-start justify-between gap-3 p-4 bg-gray-50/60 dark:bg-white/[0.04] rounded-xl"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {otherMemory?.summary ||
                          otherMemory?.content?.slice(0, 80) ||
                          t("memories.unknown")}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colorCls}`}>
                          {t(`memories.relations.${assoc.relation_type}`)}
                        </span>
                        {assoc.note && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {assoc.note}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteAssociation(assoc.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors cursor-pointer rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10"
                      aria-label={t("common.delete")}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18L18 6M6 6l12 12"
                        />
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
