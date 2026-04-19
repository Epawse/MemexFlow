import { PRIORITY_BADGES } from "../constants";

interface PriorityBadgeProps {
  priority: string;
  className?: string;
}

export function PriorityBadge({ priority, className = "" }: PriorityBadgeProps) {
  const badge = PRIORITY_BADGES[priority] ?? PRIORITY_BADGES.medium;
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.cls} ${className}`}>
      {badge.label}
    </span>
  );
}