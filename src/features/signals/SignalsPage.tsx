import { useAuth } from "../../lib/AuthProvider";
import { useUndismissedSignalMatches, dismissMatch } from "../../hooks/usePowerSyncQueries";
import { useQuery } from "@powersync/react";
import { toast } from "sonner";
import { Card } from "../../shared/components/Card";
import { EmptyState } from "../../shared/components/EmptyState";
import { Spinner } from "../../shared/components/Spinner";
import { Button } from "../../shared/components/Button";

export function SignalsPage() {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const {
    data: matches,
    isLoading,
    error,
  } = useUndismissedSignalMatches(userId);

  // Fetch rule names for the matches
  const ruleIds = [...new Set((matches ?? []).map((m) => m.signal_rule_id))];
  const ruleRows = useQuery(
    ruleIds.length > 0
      ? `SELECT id, name, project_id FROM signal_rules WHERE id IN (${ruleIds.map(() => "?").join(",")})`
      : "SELECT id, name, project_id FROM signal_rules WHERE 0",
    ruleIds.length > 0 ? ruleIds : [],
  );
  const ruleMap = new Map(
    ((ruleRows.data ?? []) as Array<{ id: string; name: string; project_id: string }>).map((r) => [r.id, r]),
  );

  // Fetch project names
  const projectIds = [...new Set([...ruleMap.values()].map((r) => r.project_id).filter(Boolean))];
  const projectRows = useQuery(
    projectIds.length > 0
      ? `SELECT id, title FROM projects WHERE id IN (${projectIds.map(() => "?").join(",")})`
      : "SELECT id, title FROM projects WHERE 0",
    projectIds.length > 0 ? projectIds : [],
  );
  const projectMap = new Map(
    ((projectRows.data ?? []) as Array<{ id: string; title: string }>).map((p) => [p.id, p]),
  );

  const handleDismiss = async (matchId: string) => {
    try {
      await dismissMatch(matchId);
      toast.success("Match dismissed");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error("Failed to dismiss", { description: msg });
    }
  };

  if (isLoading) return <Spinner className="mt-12" />;

  if (error) {
    return <EmptyState className="mt-12" title="Couldn't load signals" description={error} />;
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Signals</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Keyword matches from your monitoring rules
          </p>
        </div>
      </div>

      {(matches ?? []).length === 0 ? (
        <EmptyState
          className="mt-8"
          title="No signal matches"
          description="Create a signal rule in a project to start monitoring for keyword matches."
        />
      ) : (
        <div className="mt-6 space-y-3">
          {(matches ?? []).map((match) => {
            const rule = ruleMap.get(match.signal_rule_id);
            const project = rule?.project_id ? projectMap.get(rule.project_id) : null;

            return (
              <Card key={match.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {rule?.name || "Unknown Rule"}
                    </p>
                    {match.matched_text && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                        {match.matched_text}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      {project && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">{project.title}</span>
                      )}
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {new Date(match.matched_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <Button variant="text" size="sm" onClick={() => handleDismiss(match.id)}>
                    Dismiss
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}