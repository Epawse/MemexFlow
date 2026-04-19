import { useState } from "react";
import { useAuth } from "../../lib/AuthProvider";
import {
  usePendingRecalls,
  useMemories,
  revisitRecall,
  dismissRecall,
  createRecallJob,
} from "../../hooks/usePowerSyncQueries";
import { toast } from "sonner";
import { Card } from "../../shared/components/Card";
import { EmptyState } from "../../shared/components/EmptyState";
import { Spinner } from "../../shared/components/Spinner";
import { Button } from "../../shared/components/Button";
import type { Recall } from "../../lib/models";
import { REASON_LABELS } from "../../shared/constants";
import { PriorityBadge } from "../../shared/components/PriorityBadge";

export function RecallPage() {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const {
    data: recalls,
    isLoading,
    error,
  } = usePendingRecalls(userId);
  const { data: memories } = useMemories(userId);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [triggering, setTriggering] = useState(false);

  const memoryMap = new Map(
    (memories ?? []).map((m) => [m.id, m]),
  );

  const handleRevisit = async (recall: Recall) => {
    setActioningId(recall.id);
    try {
      await revisitRecall(recall.id);
      toast.success("Marked as revisited");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error("Failed to mark as revisited", { description: msg });
    } finally {
      setActioningId(null);
    }
  };

  const handleDismiss = async (recall: Recall) => {
    setActioningId(recall.id);
    try {
      await dismissRecall(recall.id);
      toast.success("Dismissed");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error("Failed to dismiss", { description: msg });
    } finally {
      setActioningId(null);
    }
  };

  const handleFindMemories = async () => {
    if (!user) return;
    setTriggering(true);
    try {
      await createRecallJob(user.id);
      toast.success("Recall job created", {
        description: "We'll find memories worth revisiting. Check back soon.",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error("Failed to create recall job", { description: msg });
    } finally {
      setTriggering(false);
    }
  };

  const recallList = recalls ?? [];

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Recall
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Memories worth revisiting
          </p>
        </div>
        <Button onClick={handleFindMemories} loading={triggering}>
          Find memories to revisit
        </Button>
      </div>

      {error ? (
        <EmptyState
          className="mt-8"
          title="Couldn't load recalls"
          description={error}
          action={
            <Button onClick={() => window.location.reload()}>Reload</Button>
          }
        />
      ) : isLoading ? (
        <Spinner className="mt-8" />
      ) : recallList.length === 0 ? (
        <EmptyState
          className="mt-12"
          title="No recall suggestions"
          description='Click "Find memories to revisit" to discover memories worth reviewing.'
          action={
            <Button onClick={handleFindMemories} loading={triggering}>
              Find memories to revisit
            </Button>
          }
        />
      ) : (
        <div className="mt-6 space-y-3">
          {recallList.map((recall) => {
            const memory = memoryMap.get(recall.memory_id);
            return (
              <Card key={recall.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <PriorityBadge priority={recall.priority} />
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {REASON_LABELS[recall.reason] ?? recall.reason}
                      </span>
                    </div>
                    {memory ? (
                      <>
                        <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                          {memory.summary || memory.content.slice(0, 150)}
                        </p>
                        {recall.reason_detail && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {recall.reason_detail}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Memory {recall.memory_id.slice(0, 8)}...
                      </p>
                    )}
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      Suggested {new Date(recall.scheduled_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleRevisit(recall)}
                      loading={actioningId === recall.id}
                    >
                      Revisit
                    </Button>
                    <Button
                      variant="text"
                      size="sm"
                      onClick={() => handleDismiss(recall)}
                      loading={actioningId === recall.id}
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}