import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/AuthProvider";
import { useAllBriefs } from "../../hooks/usePowerSyncQueries";
import type { Brief } from "../../lib/models";
import { Card } from "../../shared/components/Card";
import { EmptyState } from "../../shared/components/EmptyState";
import { Spinner } from "../../shared/components/Spinner";
import { StatusBadge } from "../../shared/components/StatusBadge";
import { Button } from "../../shared/components/Button";
import { Tabs } from "../../shared/components/Tabs";

type BriefFilter = "all" | "completed" | "processing" | "failed";

export function BriefsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<BriefFilter>("all");
  const {
    data: briefs,
    isLoading,
    error,
  } = useAllBriefs(user?.id ?? "");

  const filteredBriefs = useMemo(() => {
    if (!briefs) return [];
    if (activeFilter === "all") return briefs;
    return briefs.filter((b: Brief) => b.status === activeFilter);
  }, [briefs, activeFilter]);

  const completedCount = briefs?.filter((b: Brief) => b.status === "completed").length ?? 0;
  const processingCount = briefs?.filter((b: Brief) => b.status === "processing" || b.status === "pending").length ?? 0;
  const failedCount = briefs?.filter((b: Brief) => b.status === "failed").length ?? 0;

  if (isLoading) return <Spinner className="mt-12" />;

  if (error) {
    return (
      <EmptyState
        className="mt-12"
        title="Couldn't load briefs"
        description={error}
      />
    );
  }

  if (!briefs || briefs.length === 0) {
    return (
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Briefs
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              AI-generated research summaries and analysis
            </p>
          </div>
        </div>
        <EmptyState
          className="mt-8"
          icon={
            <svg
              className="h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          }
          title="No briefs yet"
          description="Generate a brief from a topic's memories to synthesize your research."
          action={<Button size="sm" onClick={() => navigate("/projects")}>View Topics</Button>}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Briefs
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            AI-generated research summaries and analysis
          </p>
        </div>
      </div>

      <Tabs
        className="mt-6"
        items={[
          { key: "all", label: "All" },
          { key: "completed", label: "Completed", badge: completedCount > 0 ? completedCount : undefined },
          { key: "processing", label: "In Progress", badge: processingCount > 0 ? processingCount : undefined },
          { key: "failed", label: "Failed", badge: failedCount > 0 ? failedCount : undefined },
        ]}
        activeKey={activeFilter}
        onChange={(key) => setActiveFilter(key as BriefFilter)}
      />

      {filteredBriefs.length === 0 ? (
        <EmptyState
          className="mt-8"
          title={`No ${activeFilter === "all" ? "" : activeFilter} briefs`}
          description={activeFilter === "all" ? "Generate a brief from a topic to synthesize your research." : "No briefs match this filter."}
        />
      ) : (
        <div className="mt-6 space-y-4">
          {filteredBriefs.map((brief: Brief) => (
            <Card
              key={brief.id}
              hover
              onClick={() => navigate(`/briefs/${brief.id}`)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {brief.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <StatusBadge status={brief.status} />
                    <span className="text-xs text-gray-400 dark:text-gray-500 capitalize">
                      {brief.type}
                    </span>
                  </div>
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                  {new Date(brief.created_at).toLocaleDateString()}
                </span>
              </div>
              {brief.status === "completed" && brief.content && (
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                  {brief.content.slice(0, 150)}...
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}