import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
  onClick?: () => void;
  glass?: boolean;
}

const paddingStyles = {
  none: "",
  sm: "p-3",
  md: "p-5",
  lg: "p-6",
};

export function Card({
  children,
  className = "",
  padding = "md",
  hover = false,
  onClick,
  glass = true,
}: CardProps) {
  const handleKeyDown = onClick
    ? (e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }
    : undefined;

  return (
    <div
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={[
        "rounded-2xl border transition-all duration-200",
        glass
          ? "bg-white/70 dark:bg-white/[0.08] backdrop-blur-xl border-white/40 dark:border-white/[0.08]"
          : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700",
        paddingStyles[padding],
        hover &&
          "cursor-pointer hover:shadow-[0_12px_40px_rgba(0,0,0,0.1),0_2px_6px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 hover:bg-white/80 dark:hover:bg-white/[0.12]",
        onClick && "cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:ring-offset-2",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

export function CardHeader({
  title,
  subtitle,
  action,
  className = "",
}: CardHeaderProps) {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
        {subtitle && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
