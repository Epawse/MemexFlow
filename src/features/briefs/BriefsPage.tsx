export function BriefsPage() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Briefs</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            AI-generated research summaries and analysis
          </p>
        </div>
      </div>

      {/* Empty state */}
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
        <svg
          className="mx-auto h-16 w-16 text-gray-300 dark:text-gray-600"
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
        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No briefs yet</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Briefs are generated automatically when you have enough captures in a project.
        </p>
      </div>
    </div>
  );
}
