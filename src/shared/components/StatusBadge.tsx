import { STATUS_BADGE } from "../constants";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const cls = STATUS_BADGE[status] ?? STATUS_BADGE.pending;
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls} ${className}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}