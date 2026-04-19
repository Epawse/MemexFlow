import { useState } from "react";
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

const TYPE_ICONS: Record<string, string> = {
  url: "M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.728-2.632a4.5 4.5 0 00-6.364-6.364L4.5 8.25a4.5 4.5 0 001.242 7.244",
  note: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
  file: "M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-19.5 0V18A2.25 2.25 0 004.5 20.25h15A2.25 2.25 0 0021.75 18v-5.75m-19.5 0h19.5",
};

type CaptureTab = "all" | "pending" | "confirmed" | "ignored";

const TABS: { key: CaptureTab; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "all", label: "All" },
  { key: "confirmed", label: "Confirmed" },
  { key: "ignored", label: "Ignored" },
];

export function CapturesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<CaptureTab>("pending");
  const [captureUrl, setCaptureUrl] = useState("");
  const [capturing, setCapturing] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const userId = user?.id ?? "";

  const { data: allCaptures, isLoading: allLoading, error: allError } = useCaptures(userId);
  const { data: filteredCaptures, isLoading: filteredLoading, error: filteredError } = useCapturesByStatus(userId, activeTab === "all" ? null : activeTab);
  const { data: jobsRaw } = usePendingJobs(userId);
  const { count: pendingCount } = usePendingCaptureCount(userId);

  const captures: Capture[] = activeTab === "all" ? (allCaptures ?? []) : (filteredCaptures ?? []);
  const loading = activeTab === "all" ? allLoading : filteredLoading;
  const error = activeTab === "all" ? allError : filteredError;
  const jobs: Job[] = jobsRaw ?? [];

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
    const styles: Record<string, string> = {
      pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      confirmed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      ignored: "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400",
    };
    const labels: Record<string, string> = {
      pending: "Pending",
      confirmed: "Confirmed",
      ignored: "Ignored",
    };
    const s = capture.status || "pending";
    return (
      <span
        className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[s] || styles.pending}`}
      >
        {labels[s] || s}
      </span>
    );
  };

  const jobStatusBadge = (job: Job | null) => {
    if (!job) return null;
    const styles: Record<string, string> = {
      pending: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
      processing:
        "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400",
      completed:
        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      failed:
        "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    };
    const s = job.status;
    return (
      <span
        className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[s] || styles.pending}`}
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

      {/* Status tabs */}
      <div className="mt-6 flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? "border-primary-600 text-primary-600 dark:text-primary-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
            aria-label={`Show ${tab.label} captures`}
          >
            {tab.label}
            {tab.key === "pending" && pendingCount > 0 && (
              <span className="ml-1.5 bg-amber-500 text-white text-xs rounded-full px-1.5 py-0.5">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {captures.length === 0 ? (
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
          {captures.map((capture) => {
            const job = getCaptureJob(capture.id);
            const showConfirm = capture.status === "pending" && !!capture.content?.trim();
            const showIgnore = capture.status === "pending";
            const showReactivate = capture.status === "ignored";

            return (
              <Card
                key={capture.id}
                hover
                onClick={() => {
                  if (capture.project_id) {
                    navigate(`/projects/${capture.project_id}`);
                  }
                }}
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