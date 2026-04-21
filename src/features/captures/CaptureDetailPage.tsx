import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../lib/AuthProvider";
import {
  useCapture,
  useCaptureMemories,
  usePendingJobs,
} from "../../hooks/usePowerSyncQueries";
import { confirmCapture, ignoreCapture, createIngestionJob } from "../../lib/captures";
import type { Capture, Job } from "../../lib/models";
import { Card } from "../../shared/components/Card";
import { EmptyState } from "../../shared/components/EmptyState";
import { Spinner } from "../../shared/components/Spinner";
import { Button } from "../../shared/components/Button";
import { CAPTURE_STATUS_BADGE } from "../../shared/constants";
import { renderContent } from "../../shared/utils/renderContent";
import { formatDate } from "../../lib/date";
function getCaptureJob(jobs: Job[], captureId: string): Job | null {
  return (
    jobs.find((j) => {
      let input: unknown = j.input;
      if (typeof input === "string") {
        try {
          input = JSON.parse(input);
          if (typeof input === "string") input = JSON.parse(input);
        } catch {
          /* leave as-is */
        }
      }
      return (
        typeof input === "object" &&
        input !== null &&
        (input as { capture_id?: string }).capture_id === captureId
      );
    }) ?? null
  );
}

function parseMetadata(metadata: string | null | number | boolean | object): Record<string, string> {
  if (!metadata || metadata === "{}") return {};
  if (typeof metadata === "string") {
    try {
      return JSON.parse(metadata);
    } catch {
      return {};
    }
  }
  if (typeof metadata === "object" && metadata !== null) {
    return metadata as Record<string, string>;
  }
  return {};
}

export function CaptureDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id ?? "";

  const {
    data: captureRows,
    isLoading,
    error,
  } = useCapture(id ?? "");
  const { data: memories } = useCaptureMemories(id ?? "");
  const { data: jobs } = usePendingJobs(userId);

  const capture: Capture | null = captureRows?.[0] ?? null;
  const captureMemories = memories ?? [];
  const job = capture ? getCaptureJob(jobs ?? [], capture.id) : null;
  const meta = parseMetadata(capture?.metadata ?? null);

  const [confirming, setConfirming] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const handleConfirm = async () => {
    if (!capture) return;
    setConfirming(true);
    try {
      await confirmCapture(capture);
      toast.success(t("captures.confirmed"), {
        description: t("captures.confirmedDesc"),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("common.error");
      toast.error(t("captures.confirmFailed"), { description: msg });
    } finally {
      setConfirming(false);
    }
  };

  const handleIgnore = async () => {
    if (!capture) return;
    try {
      await ignoreCapture(capture.id);
      toast.success(t("captures.ignored"));
      navigate("/captures");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("common.error");
      toast.error(t("captures.ignoreFailed"), { description: msg });
    }
  };

  const handleRetry = async () => {
    if (!capture?.url || !user) return;
    setRetrying(true);
    try {
      await createIngestionJob({
        userId: user.id,
        captureId: capture.id,
        url: capture.url,
      });
      toast.success(t("captures.retryQueued"), {
        description: t("captures.retryQueuedDesc"),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("common.error");
      toast.error(t("captures.retryFailed"), { description: msg });
    } finally {
      setRetrying(false);
    }
  };

  if (isLoading) return <Spinner className="mt-12" />;
  if (error || !capture) {
    return (
      <EmptyState
        className="mt-12"
        title={t("captures.notFound")}
        description={error || t("captures.notFoundDesc")}
        action={<Button onClick={() => navigate("/captures")}>{t("captures.backToCaptures")}</Button>}
      />
    );
  }

  const status = capture.status || "pending";
  const showConfirm = status === "pending" && !!capture.content?.trim();
  const showIgnore = status === "pending";
  const showRetry = job?.status === "failed";

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => navigate("/captures")}
        className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-6 cursor-pointer"
        aria-label={t("captures.backToCaptures")}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        {t("captures.backToCaptures")}
      </button>

      {/* Header */}
      <div className="flex items-start gap-3 mb-2">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex-1 min-w-0">
          {capture.title}
        </h1>
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${CAPTURE_STATUS_BADGE[status] || CAPTURE_STATUS_BADGE.pending}`}>
          {t(`captures.status.${status}`) || status}
        </span>
      </div>

      <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mb-6">
        <span>{formatDate(capture.created_at)}</span>
        <span>·</span>
        <span className="capitalize">{capture.type}</span>
        {job?.status === "processing" && (
          <>
            <span>·</span>
            <span className="text-primary-600 dark:text-primary-400">{t("captures.extracting")}</span>
          </>
        )}
        {showRetry && (
          <>
            <span>·</span>
            <button
              onClick={handleRetry}
              disabled={retrying}
              className="text-red-600 dark:text-red-400 hover:underline cursor-pointer disabled:opacity-50"
              aria-label={t("captures.retry")}
            >
              {retrying ? t("common.loading") : t("captures.retry")}
            </button>
          </>
        )}
      </div>

      {/* AI Summary */}
      {meta.summary && (
        <div className="mb-6 p-4 rounded-xl bg-primary-500/10 dark:bg-primary-500/10 border border-primary-200/60 dark:border-primary-800/60">
          <p className="text-xs font-medium text-primary-700 dark:text-primary-300 mb-1">{t("captures.aiSummary")}</p>
          <p className="text-sm text-primary-900 dark:text-primary-100">{meta.summary}</p>
        </div>
      )}

      {/* Source URL */}
      {capture.url && (
        <div className="mb-6">
          <h2 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{t("captures.source")}</h2>
          <a
            href={capture.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary-600 dark:text-primary-400 hover:underline break-all"
          >
            {capture.url}
          </a>
        </div>
      )}

      {/* Content */}
      {capture.content ? (
        <div className="mb-6">
          <h2 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{t("captures.content")}</h2>
          <div className="prose prose-sm dark:prose-invert max-w-none bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            {renderContent(capture.content, null, new Map())}
          </div>
        </div>
      ) : (
        <div className="mb-6 p-8 text-center bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {status === "pending" ? t("captures.contentPending") : t("captures.contentUnavailable")}
          </p>
        </div>
      )}

      {/* Extracted Memories */}
      {captureMemories.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            {t("captures.extractedMemories")} ({captureMemories.length})
          </h2>
          <div className="space-y-2">
            {captureMemories.map((memory) => {
              const memMeta = parseMetadata(memory.metadata);
              return (
                <Card key={memory.id}>
                  <p className="text-sm text-gray-900 dark:text-white">{memory.content}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {memMeta.memory_type && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-400">
                        {memMeta.memory_type}
                      </span>
                    )}
                    {memMeta.confidence && (
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {t("captures.confidence")}: {Math.round(Number(memMeta.confidence) * 100)}%
                      </span>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      {(showConfirm || showIgnore) && (
        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          {showConfirm && (
            <Button onClick={handleConfirm} loading={confirming}>
              {t("captures.confirmAndExtract")}
            </Button>
          )}
          {showIgnore && (
            <Button variant="secondary" onClick={handleIgnore}>
              {t("captures.ignore")}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
