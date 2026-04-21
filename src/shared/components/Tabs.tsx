export interface TabItem {
  key: string;
  label: string;
  badge?: number;
}

interface TabsProps {
  items: TabItem[];
  activeKey: string;
  onChange: (key: string) => void;
  className?: string;
}

export function Tabs({ items, activeKey, onChange, className = "" }: TabsProps) {
  return (
    <div className={`border-b border-gray-200/60 dark:border-white/[0.08] ${className}`}>
      <nav className="-mb-px flex gap-1">
        {items.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`pb-3 pt-2 px-4 text-sm font-medium rounded-t-lg border-b-2 transition-all duration-150 cursor-pointer ${
              activeKey === tab.key
                ? "border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50/50 dark:hover:bg-white/[0.03]"
            }`}
          >
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="ml-1.5 text-xs bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 px-1.5 py-0.5 rounded-full">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}
