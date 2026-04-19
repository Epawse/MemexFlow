import { useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/AuthProvider";
import { useAllBriefs } from "../../hooks/usePowerSyncQueries";
import type { Brief } from "../../lib/models";
import { Card } from "../../shared/components/Card";
import { EmptyState } from "../../shared/components/EmptyState";
import { Spinner } from "../../shared/components/Spinner";

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  processing: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export function BriefsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    data: briefs,
    isLoading,
    error,
  } = useAllBriefs(user?.id ?? "");

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
          description="Generate a brief from a project's memories to synthesize your research."
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

      <div className="mt-6 space-y-4">
        {briefs.map((brief: Brief) => (
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
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      STATUS_BADGE[brief.status] ?? STATUS_BADGE.pending
                    }`}
                  >
                    {brief.status}
                  </span>
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
    </div>
  );
}
