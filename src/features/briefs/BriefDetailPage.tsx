import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@powersync/react";
import {
  useBrief,
  useBriefCitations,
  deleteBrief,
} from "../../hooks/usePowerSyncQueries";
import { Card } from "../../shared/components/Card";
import { EmptyState } from "../../shared/components/EmptyState";
import { Spinner } from "../../shared/components/Spinner";
import { Button } from "../../shared/components/Button";
import { toast } from "sonner";
import { renderContent } from "../../shared/utils/renderContent";
import { formatDate } from "../../lib/date";
export function BriefDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    data: briefRows,
    isLoading,
    error,
  } = useBrief(id ?? "");
  const brief = briefRows?.[0] ?? null;

  if (isLoading) return <Spinner className="mt-12" />;
  if (error || !brief) {
    return (
      <EmptyState
        className="mt-12"
        title={t("briefs.notFound")}
        description={error || t("briefs.notFoundDesc")}
        action={<Button onClick={() => navigate("/briefs")}>{t("briefs.backToBriefs")}</Button>}
      />
    );
  }

  return <BriefDetail brief={brief} onBack={() => navigate("/briefs")} />;
}

function BriefDetail({
  brief,
  onBack,
}: {
  brief: { id: string; title: string; content: string; status: string; created_at: string; project_id: string | null };
  onBack: () => void;
}) {
  const { t } = useTranslation();
  const { data: citations } = useBriefCitations(brief.id);

  const citedMemoryIds = (citations ?? []).map((c) => c.memory_id);
  const citedMemoryRows = useQuery(
    citedMemoryIds.length > 0
      ? `SELECT id, summary, content FROM memories WHERE id IN (${citedMemoryIds.map(() => "?").join(",")})`
      : "SELECT id, summary, content FROM memories WHERE 0",
    citedMemoryIds.length > 0 ? citedMemoryIds : [],
  );
  const citedMemories = new Map(
    ((citedMemoryRows.data ?? []) as Array<{ id: string; summary: string; content: string }>).map((m) => [m.id, m]),
  );

  const handleDelete = async () => {
    try {
      await deleteBrief(brief.id);
      toast.success(t("briefs.deleted"));
      onBack();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("common.error");
      toast.error(t("briefs.deleteFailed"), { description: msg });
    }
  };

  if (brief.status === "pending" || brief.status === "processing") {
    return (
      <div>
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-6 cursor-pointer" aria-label={t("briefs.backToBriefs")}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          {t("briefs.backToBriefs")}
        </button>
        <div className="flex flex-col items-center justify-center py-12">
          <Spinner size="lg" className="mb-4" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {brief.status === "pending" ? t("briefs.waiting") : t("briefs.generating")}
          </p>
        </div>
      </div>
    );
  }

  if (brief.status === "failed") {
    return (
      <div>
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-6 cursor-pointer" aria-label={t("briefs.backToBriefs")}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          {t("briefs.backToBriefs")}
        </button>
        <EmptyState title={t("briefs.failedTitle")} description={t("briefs.failedDesc")} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer" aria-label={t("briefs.backToBriefs")}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          {t("briefs.backToBriefs")}
        </button>
        <Button variant="danger" size="sm" onClick={handleDelete}>{t("common.delete")}</Button>
      </div>

      <div className="bg-white/70 dark:bg-white/[0.08] backdrop-blur-xl rounded-2xl border border-white/50 dark:border-white/[0.1] p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{brief.title}</h2>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          {renderContent(brief.content, citations ?? null, citedMemories)}
        </div>
      </div>

      {(citations ?? []).length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            {t("briefs.citedMemories")} ({citations.length})
          </h3>
          <div className="space-y-2">
            {(citations ?? []).map((citation: { memory_id: string; relevance: string | null }, idx: number) => {
              const memory = citedMemories.get(citation.memory_id);
              return (
                <Card key={citation.memory_id}>
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-medium text-primary-600 dark:text-primary-400 flex-shrink-0">[M{idx + 1}]</span>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {memory?.summary || memory?.content?.slice(0, 150) || t("briefs.memoryNotFound")}
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
        {t("briefs.generatedAt")} {formatDate(brief.created_at)}
      </p>
    </div>
  );
}
