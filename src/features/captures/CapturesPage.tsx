import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/AuthProvider";
import { useCaptures, usePendingJobs } from "../../hooks/usePowerSyncQueries";
import { createCapture } from "../../lib/captures";
import { Button } from "../../shared/components/Button";
import { Card } from "../../shared/components/Card";
import { EmptyState } from "../../shared/components/EmptyState";
import { Spinner } from "../../shared/components/Spinner";

const TYPE_ICONS: Record<string, string> = {
  url: "M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.728-2.632a4.5 4.5 0 00-6.364-6.364L4.5 8.25a4.5 4.5 0 001.242 7.244",
  note: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
  file: "M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-19.5 0V18A2.25 2.25 0 004.5 20.25h15A2.25 2.25 0 0021.75 18v-5.75m-19.5 0h19.5",
};

export function CapturesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: capturesRaw, isLoading: capturesLoading } = useCaptures(
    user?.id ?? "",
  );
  const { data: jobsRaw } = usePendingJobs(user?.id ?? "");
  const [captureUrl, setCaptureUrl] = useState("");
  const [capturing, setCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const captures = (capturesRaw ?? []) as any[];
  const jobs = (jobsRaw ?? []) as any[];

  const getCaptureStatus = (captureId: string): string | null => {
    const job = jobs.find((j: any) => {
      let input: any;
      try {
        input = typeof j.input === "string" ? JSON.parse(j.input) : j.input;
      } catch {
        input = j.input;
      }
      return input?.capture_id === captureId;
    });
    return job?.status || null;
  };

  const handleCapture = async () => {
    if (!user || !captureUrl.trim()) return;
    setCapturing(true);
    setError(null);

    try {
      await createCapture({ userId: user.id, url: captureUrl.trim() });
      setCaptureUrl("");
    } catch (err: any) {
      setError(err.message || "Failed to capture URL");
    } finally {
      setCapturing(false);
    }
  };

  type ProjectRow = { id: string; title: string; color: string };

  const groupedCaptures = () => {
    const projectMap = new Map<string, ProjectRow>();

    for (const capture of captures) {
      if (capture.project_id && !projectMap.has(capture.project_id)) {
        projectMap.set(capture.project_id, {
          id: capture.project_id,
          title: capture.project_id,
          color: "#6366f1",
        });
      }
    }

    const groups: Record<
      string,
      { project: ProjectRow | null; captures: any[] }
    > = {};
    const unfiled: any[] = [];

    for (const capture of captures) {
      const enriched = { ...capture, status: getCaptureStatus(capture.id) };
      if (capture.project_id) {
        const project = projectMap.get(capture.project_id);
        if (!groups[capture.project_id]) {
          groups[capture.project_id] = {
            project: project ?? null,
            captures: [],
          };
        }
        groups[capture.project_id].captures.push(enriched);
      } else {
        unfiled.push(enriched);
      }
    }

    const result: { project: ProjectRow | null; captures: any[] }[] = [];
    Object.values(groups).forEach((group) => {
      if (group.project) result.push(group);
    });
    if (unfiled.length > 0) result.push({ project: null, captures: unfiled });
    return result;
  };

  const statusBadge = (status: string | null) => {
    if (!status) return null;
    const styles: Record<string, string> = {
      pending: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
      processing:
        "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400",
      completed:
        "bg-success-light text-success-dark dark:bg-green-900/30 dark:text-green-400",
      failed:
        "bg-danger-light text-danger-dark dark:bg-red-900/30 dark:text-red-400",
    };
    return (
      <span
        className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[status] || styles.pending}`}
      >
        {status === "processing" ? "Capturing..." : status}
      </span>
    );
  };

  if (capturesLoading) {
    return <Spinner className="mt-12" />;
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

      {error && <p className="mt-3 text-sm text-danger">{error}</p>}

      {captures.length === 0 ? (
        <EmptyState
          className="mt-8"
          title="No captures yet"
          description="Paste a URL above to start capturing content."
        />
      ) : (
        <div className="mt-6 space-y-8">
          {groupedCaptures().map((group) => (
            <div key={group.project?.id || "unfiled"}>
              <div className="flex items-center gap-2 mb-3">
                {group.project ? (
                  <>
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: group.project.color || "#6366f1",
                      }}
                    />
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      {group.project.title}
                    </h3>
                  </>
                ) : (
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                    Unfiled
                  </h3>
                )}
              </div>
              <div className="space-y-2">
                {group.captures.map((capture: any) => (
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
                          {statusBadge(capture.status)}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {new Date(capture.created_at).toLocaleDateString()} ·{" "}
                          {capture.type}
                        </p>
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
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
