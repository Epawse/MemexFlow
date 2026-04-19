import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../../lib/AuthProvider";
import {
  useDashboardStats,
  useRecentCaptures,
  useActiveProjects,
  useUnreadSignalCount,
  usePendingCaptureCount,
  usePendingRecalls,
  useRecallCount,
  revisitRecall,
  dismissRecall,
} from "../../hooks/usePowerSyncQueries";
import { createCapture } from "../../lib/captures";
import { Card } from "../../shared/components/Card";
import { EmptyState } from "../../shared/components/EmptyState";
import { Spinner } from "../../shared/components/Spinner";
import { Button } from "../../shared/components/Button";
import { TYPE_ICONS, REASON_LABELS } from "../../shared/constants";
import { PriorityBadge } from "../../shared/components/PriorityBadge";

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const stats = useDashboardStats(user?.id ?? "");
  const {
    data: recentCapturesRaw,
    isLoading: capturesLoading,
    error: capturesError,
  } = useRecentCaptures(user?.id ?? "", 5);
  const {
    data: activeProjectsRaw,
    isLoading: projectsLoading,
    error: projectsError,
  } = useActiveProjects(user?.id ?? "", 5);
  const [captureUrl, setCaptureUrl] = useState("");
  const [capturing, setCapturing] = useState(false);

  const recentCaptures = recentCapturesRaw ?? [];
  const activeProjects = activeProjectsRaw ?? [];

  const handleQuickCapture = async () => {
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
      toast.error("Failed to capture URL", {
        description: msg,
      });
    } finally {
      setCapturing(false);
    }
  };

  const signalCount = useUnreadSignalCount(user?.id ?? "");
  const pendingCaptureCount = usePendingCaptureCount(user?.id ?? "");
  const recallCount = useRecallCount(user?.id ?? "");
  const { data: recallSuggestions } = usePendingRecalls(user?.id ?? "");
  const topRecalls = (recallSuggestions ?? []).slice(0, 3);

  const statCards = [
    {
      label: "Captures",
      value: stats.captures,
      color: "text-primary-600 dark:text-primary-400",
      bg: "bg-primary-50 dark:bg-primary-900/20",
      href: "/captures",
    },
    {
      label: "Memories",
      value: stats.memories,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-50 dark:bg-purple-900/20",
      href: "/memories",
    },
    {
      label: "Topics",
      value: stats.projects,
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-50 dark:bg-green-900/20",
      href: "/projects",
    },
    {
      label: "Briefs",
      value: stats.briefs,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-900/20",
      href: "/briefs",
    },
  ];

  const loading = stats.isLoading || capturesLoading || projectsLoading;
  const queryError = capturesError || projectsError;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
        Dashboard
      </h2>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
        Overview of your research activity
      </p>

      <div className="mt-6 flex gap-2">
        <input
          type="url"
          placeholder="Quick capture — paste a URL..."
          aria-label="Capture URL"
          value={captureUrl}
          onChange={(e) => setCaptureUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleQuickCapture()}
          className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
        <Button
          onClick={handleQuickCapture}
          loading={capturing}
          disabled={!captureUrl.trim()}
        >
          Capture
        </Button>
      </div>

      {queryError ? (
        <EmptyState
          className="mt-12"
          title="Couldn't load dashboard"
          description={queryError || "Please try again."}
          action={
            <Button onClick={() => window.location.reload()}>Reload</Button>
          }
        />
      ) : loading ? (
        <Spinner className="mt-12" />
      ) : (
        <>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((stat) => (
              <div
                key={stat.label}
                onClick={() => navigate(stat.href)}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 cursor-pointer hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-shadow"
              >
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {stat.label}
                </p>
                <p className={`mt-1 text-3xl font-bold ${stat.color}`}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          {/* Signal badge */}
          {signalCount.count > 0 && (
            <div className="mt-6">
              <button onClick={() => navigate("/signals")} aria-label="View signal matches"
                className="flex items-center gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors w-full text-left">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                  <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                    {signalCount.count} unread signal match{signalCount.count !== 1 ? "es" : ""}
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-400">Click to view</p>
                </div>
              </button>
            </div>
          )}

          {/* Pending captures banner */}
          {pendingCaptureCount.count > 0 && (
            <div className={signalCount.count > 0 ? "mt-4" : "mt-6"}>
              <button onClick={() => navigate("/captures")} aria-label="Review pending captures"
                className="flex items-center gap-3 px-4 py-3 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl cursor-pointer hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors w-full text-left">
                <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center">
                  <svg className="w-4 h-4 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-3.848 0c-1.131.094-1.976 1.057-1.976 2.192V16.5c0 1.108.845 2.046 1.976 2.192" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-primary-800 dark:text-primary-300">
                    {pendingCaptureCount.count} capture{pendingCaptureCount.count !== 1 ? "s" : ""} awaiting review
                  </p>
                  <p className="text-xs text-primary-600 dark:text-primary-400">Confirm to extract memories</p>
                </div>
              </button>
            </div>
          )}

          {/* Recall suggestions */}
          {recallCount.count > 0 && (
            <div className={(signalCount.count > 0 || pendingCaptureCount.count > 0) ? "mt-4" : "mt-6"}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Memories to revisit
                </h3>
                <Button variant="text" size="sm" onClick={() => navigate("/recall")}>
                  View all
                </Button>
              </div>
              <div className="space-y-2">
                {topRecalls.map((recall) => (
                  <Card key={recall.id}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <PriorityBadge priority={recall.priority} />
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {REASON_LABELS[recall.reason] ?? recall.reason}
                          </span>
                        </div>
                        {recall.reason_detail && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {recall.reason_detail}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0">
                        <Button variant="primary" size="sm" onClick={async () => { await revisitRecall(recall.id); }}>
                          Revisit
                        </Button>
                        <Button variant="text" size="sm" onClick={async () => { await dismissRecall(recall.id); }}>
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Recent Captures
                </h3>
                <Button
                  variant="text"
                  size="sm"
                  onClick={() => navigate("/captures")}
                >
                  View all
                </Button>
              </div>
              {recentCaptures.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No captures yet. Paste a URL above to start.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentCaptures.map((capture) => (
                    <Card
                      key={capture.id}
                      hover
                      onClick={() => navigate(`/captures/${capture.id}`)}
                    >
                      <div className="flex items-center gap-3">
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
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {capture.title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(capture.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Active Topics
                </h3>
                <Button
                  variant="text"
                  size="sm"
                  onClick={() => navigate("/projects")}
                >
                  View all
                </Button>
              </div>
              {activeProjects.length === 0 ? (
                <EmptyState
                  title="No topics yet"
                  description="Create a topic to organize your research."
                  action={
                    <Button size="sm" onClick={() => navigate("/projects")}>
                      Create topic
                    </Button>
                  }
                />
              ) : (
                <div className="space-y-2">
                  {activeProjects.map((project) => (
                    <Card
                      key={project.id}
                      hover
                      onClick={() => navigate(`/projects/${project.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                          style={{
                            backgroundColor: project.color || "#6366f1",
                          }}
                        >
                          {project.title.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {project.title}
                          </p>
                          {project.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {project.description}
                            </p>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                          {new Date(project.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
