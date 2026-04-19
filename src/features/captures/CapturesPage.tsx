import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../../lib/AuthProvider";
import { useCaptures, useCapturesByStatus, usePendingJobs, usePendingCaptureCount } from "../../hooks/usePowerSyncQueries";
import { createCapture, createIngestionJob, confirmCapture, ignoreCapture, reactivateCapture } from "../../lib/captures";
import type { Capture, Job } from "../../lib/models";
import { Button } from "../../shared/components/Button";
import { Card } from "../../shared/components/Card";
import { EmptyState } from "../../shared/components/EmptyState";
import { Spinner } from "../../shared/components/Spinner";
import { Input } from "../../shared/components/Input";
import { TYPE_ICONS, CAPTURE_STATUS_BADGE, JOB_STATUS_BADGE } from "../../shared/constants";
import { Tabs } from "../../shared/components/Tabs";

type CaptureTab = "all" | "pending" | "confirmed" | "ignored";

export function CapturesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<CaptureTab>("pending");
  const [captureUrl, setCaptureUrl] = useState("");
  const [capturing, setCapturing] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const userId = user?.id ?? "";

  const { data: allCaptures, isLoading: allLoading, error: allError } = useCaptures(userId);
  const { data: statusFiltered, isLoading: filteredLoading, error: filteredError } = useCapturesByStatus(userId, activeTab === "all" ? null : activeTab);
  const { data: jobsRaw } = usePendingJobs(userId);
  const { count: pendingCount } = usePendingCaptureCount(userId);

  const captures: Capture[] = activeTab === "all" ? (allCaptures ?? []) : (statusFiltered ?? []);
  const loading = activeTab === "all" ? allLoading : filteredLoading;
  const error = activeTab === "all" ? allError : filteredError;
  const jobs: Job[] = jobsRaw ?? [];

  const filteredCaptures = useMemo(() => {
    if (!search.trim()) return captures;
    const q = search.toLowerCase();
    return captures.filter((c) =>
      c.title.toLowerCase().includes(q) || c.status.toLowerCase().includes(q),
    );
  }, [captures, search]);

  const getCaptureJob = (captureId: string): Job | null => {
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
  };

  const handleCapture = async () => {
    if (!user || !captureUrl.trim()) return;
    setCapturing(true);

    try {
      await createCapture({ userId: user.id, url: captureUrl.trim() });
      setCaptureUrl("");
      toast.success("Capture queued", {
        description: "Review and confirm to extract memories.",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error("Failed to capture URL", { description: msg });
    } finally {
      setCapturing(false);
    }
  };

  const handleRetry = async (
    captureId: string,
    capture: { url: string | null },
  ) => {
    if (!user) return;
    const existing = getCaptureJob(captureId);
    if (
      existing &&
      (existing.status === "pending" || existing.status === "processing")
    ) {
      toast.info("Already queued", {
        description: "This capture is already being processed.",
      });
      return;
    }
    if (!capture.url) {
      toast.error("Cannot retry", { description: "Capture has no URL." });
      return;
    }

    setRetryingId(captureId);
    try {
      await createIngestionJob({
        userId: user.id,
        captureId,
        url: capture.url,
      });
      toast.success("Retry queued", {
        description: "The capture will be re-processed.",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error("Retry failed", { description: msg });
    } finally {
      setRetryingId(null);
    }
  };

  const handleConfirm = async (capture: Capture) => {
    setConfirmingId(capture.id);
    try {
      await confirmCapture(capture);
      toast.success("Capture confirmed", {
        description: "Memories will be extracted shortly.",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error("Failed to confirm", { description: msg });
    } finally {
      setConfirmingId(null);
    }
  };

  const handleIgnore = async (captureId: string) => {
    try {
      await ignoreCapture(captureId);
      toast.success("Capture ignored");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error("Failed to ignore", { description: msg });
    }
  };

  const handleReactivate = async (captureId: string) => {
    try {
      await reactivateCapture(captureId);
      toast.success("Capture reactivated");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error("Failed to reactivate", { description: msg });
    }
  };

  const captureStatusBadge = (capture: Capture) => {
    const s = capture.status || "pending";
    return (
      <span
        className={`text-xs px-2 py-0.5 rounded-full font-medium ${CAPTURE_STATUS_BADGE[s] || CAPTURE_STATUS_BADGE.pending}`}
      >
        {s.charAt(0).toUpperCase() + s.slice(1)}
      </span>
    );
  };

  const jobStatusBadge = (job: Job | null) => {
    if (!job) return null;
    const s = job.status;
    return (
      <span
        className={`text-xs px-2 py-0.5 rounded-full font-medium ${JOB_STATUS_BADGE[s] || JOB_STATUS_BADGE.pending}`}
      >
        {s === "processing" ? "Extracting..." : s}
      </span>
    );
  };

  if (loading) {
    return <Spinner className="mt-12" />;
  }

  if (error) {
    return (
      <EmptyState
        className="mt-12"
        title="Couldn't load captures"
        description={error || "Please try again."}
        action={
          <Button onClick={() => window.location.reload()}>Reload</Button>
        }
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Captures
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Saved URLs, notes, and highlights from your research
          </p>
        </div>
      </div>

      <div className="mt-6 flex gap-2">
        <input
          type="url"
          placeholder="Paste a URL to capture..."
          aria-label="Capture URL"
          value={captureUrl}
          onChange={(e) => setCaptureUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCapture()}
          className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
        <Button
          onClick={handleCapture}
          loading={capturing}
          disabled={!captureUrl.trim()}
        >
          <svg
            className="w-4 h-4 mr-1.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          Capture
        </Button>
      </div>

      {/* Search */}
      {captures.length > 0 && (
        <div className="mt-4">
          <Input
            placeholder="Search captures..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}

      {/* Status tabs */}
      <Tabs
        className="mt-6"
        items={[
          { key: "pending", label: "Pending", badge: pendingCount > 0 ? pendingCount : undefined },
          { key: "all", label: "All" },
          { key: "confirmed", label: "Confirmed" },
          { key: "ignored", label: "Ignored" },
        ]}
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as CaptureTab)}
      />

      {filteredCaptures.length === 0 && search.trim() ? (
        <EmptyState className="mt-8" title="No matches" description="No captures match your search." />
      ) : captures.length === 0 ? (
        <EmptyState
          className="mt-8"
          title={activeTab === "pending" ? "No pending captures" : "No captures yet"}
          description={
            activeTab === "pending"
              ? "Captures you save will appear here for review."
              : "Paste a URL above to start capturing content."
          }
        />
      ) : (
        <div className="mt-4 space-y-2">
          {filteredCaptures.map((capture) => {
            const job = getCaptureJob(capture.id);
            const showConfirm = capture.status === "pending" && !!capture.content?.trim();
            const showIgnore = capture.status === "pending";
            const showReactivate = capture.status === "ignored";

            return (
              <Card
                key={capture.id}
                hover
                onClick={() => navigate(`/captures/${capture.id}`)}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-4 h-4 text-primary-600 dark:text-primary-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d={TYPE_ICONS[capture.type] || TYPE_ICONS.url}
                      />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {capture.title}
                      </p>
                      {captureStatusBadge(capture)}
                      {job && capture.status === "confirmed" && jobStatusBadge(job)}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {new Date(capture.created_at).toLocaleDateString()} · {capture.type}
                    </p>
                    {job?.status === "failed" && (
                      <div className="mt-2 flex items-center gap-2">
                        {job.error && (
                          <span className="text-xs text-red-500 truncate max-w-xs">
                            {job.error}
                          </span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRetry(capture.id, capture);
                          }}
                          disabled={retryingId === capture.id}
                          className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline disabled:opacity-50 cursor-pointer"
                        >
                          {retryingId === capture.id ? "Retrying..." : "Retry"}
                        </button>
                      </div>
                    )}
                    {(showConfirm || showIgnore || showReactivate) && (
                      <div className="mt-2 flex items-center gap-2">
                        {showConfirm && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleConfirm(capture);
                            }}
                            disabled={confirmingId === capture.id}
                            className="text-xs font-medium text-green-600 dark:text-green-400 hover:underline disabled:opacity-50 cursor-pointer"
                            aria-label={`Confirm capture: ${capture.title}`}
                          >
                            {confirmingId === capture.id ? "Confirming..." : "Confirm"}
                          </button>
                        )}
                        {showIgnore && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleIgnore(capture.id);
                            }}
                            className="text-xs font-medium text-gray-500 dark:text-gray-400 hover:underline cursor-pointer"
                            aria-label={`Ignore capture: ${capture.title}`}
                          >
                            Ignore
                          </button>
                        )}
                        {showReactivate && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReactivate(capture.id);
                            }}
                            className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline cursor-pointer"
                            aria-label={`Reactivate capture: ${capture.title}`}
                          >
                            Reactivate
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  {capture.url && (
                    <a
                      href={capture.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 flex-shrink-0"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                        />
                      </svg>
                    </a>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}