import { EmptyState } from "../../shared/components/EmptyState";

export function BriefsPage() {
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
        description="Briefs are generated automatically when you have enough captures in a project."
      />
    </div>
  );
}
