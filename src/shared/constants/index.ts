/** Color palette for topic/project color pickers */
export const TOPIC_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#ef4444",
  "#f59e0b",
  "#22c55e",
  "#14b8a6",
  "#3b82f6",
] as const;

/** SVG path data for capture type icons */
export const TYPE_ICONS: Record<string, string> = {
  url: "M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.728-2.632a4.5 4.5 0 00-6.364-6.364L4.5 8.25a4.5 4.5 0 001.242 7.244",
  note: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
  file: "M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-19.5 0V18A2.25 2.25 0 004.5 20.25h15A2.25 2.25 0 0021.75 18v-5.75m-19.5 0h19.5",
};

/** Status badge styles for processing statuses */
export const STATUS_BADGE: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  processing: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  confirmed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  ignored: "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400",
};

/** Capture-specific status badge styles (with amber for pending) */
export const CAPTURE_STATUS_BADGE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  confirmed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  ignored: "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400",
};

/** Job status badge styles */
export const JOB_STATUS_BADGE: Record<string, string> = {
  pending: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
  processing: "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400",
  completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

/** Priority badge config */
export const PRIORITY_BADGES: Record<string, { cls: string }> = {
  high: { cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  medium: { cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  low: { cls: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400" },
};