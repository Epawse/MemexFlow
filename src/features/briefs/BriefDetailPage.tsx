import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@powersync/react";
import {
  useAllBriefs,
  useBriefCitations,
  deleteBrief,
} from "../../hooks/usePowerSyncQueries";
import { Card } from "../../shared/components/Card";
import { EmptyState } from "../../shared/components/EmptyState";
import { Spinner } from "../../shared/components/Spinner";
import { Button } from "../../shared/components/Button";
import { toast } from "sonner";

export function BriefDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    data: briefRows,
    isLoading,
    error,
  } = useAllBriefs("");
  const brief = briefRows?.find((b) => b.id === id) ?? null;

  if (isLoading) return <Spinner className="mt-12" />;
  if (error || !brief) {
    return (
      <EmptyState
        className="mt-12"
        title="Brief not found"
        description={error || "This brief does not exist or has been deleted."}
        action={<Button onClick={() => navigate("/briefs")}>Back to Briefs</Button>}
      />
    );
  }

  return <BriefDetail brief={brief} onBack={() => navigate("/briefs")} />;
}

function BriefDetail({
  brief,
  onBack,
}: {
  brief: { id: string; title: string; content: string; status: string; created_at: string; project_id: string | null };
  onBack: () => void;
}) {
  const { data: citations } = useBriefCitations(brief.id);

  const citedMemoryIds = (citations ?? []).map((c) => c.memory_id);
  const citedMemoryRows = useQuery(
    citedMemoryIds.length > 0
      ? `SELECT id, summary, content FROM memories WHERE id IN (${citedMemoryIds.map(() => "?").join(",")})`
      : "SELECT id, summary, content FROM memories WHERE 0",
    citedMemoryIds.length > 0 ? citedMemoryIds : [],
  );
  const citedMemories = new Map(
    ((citedMemoryRows.data ?? []) as Array<{ id: string; summary: string; content: string }>).map((m) => [m.id, m]),
  );

  const handleDelete = async () => {
    try {
      await deleteBrief(brief.id);
      toast.success("Brief deleted");
      onBack();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error("Failed to delete brief", { description: msg });
    }
  };

  const renderContent = (content: string) => {
    if (!content) return null;
    const parts = content.split(/(\[M\d+\])/g);
    return parts.map((part, i) => {
      const match = part.match(/^\[M(\d+)\]$/);
      if (match) {
        const idx = parseInt(match[1], 10) - 1;
        const citation = (citations ?? [])[idx];
        const memory = citation ? citedMemories.get(citation.memory_id) : null;
        return (
          <span
            key={i}
            className="text-primary-600 dark:text-primary-400 font-medium cursor-help"
            title={memory?.summary || "Cited memory"}
          >
            {part}
          </span>
        );
      }
      const lines = part.split("\n");
      return lines.map((line, j) => {
        if (line.startsWith("### "))
          return <h4 key={`${i}-${j}`} className="text-base font-semibold text-gray-900 dark:text-white mt-4 mb-2">{line.slice(4)}</h4>;
        if (line.startsWith("## "))
          return <h3 key={`${i}-${j}`} className="text-lg font-semibold text-gray-900 dark:text-white mt-5 mb-2">{line.slice(3)}</h3>;
        if (line.startsWith("# "))
          return <h2 key={`${i}-${j}`} className="text-xl font-bold text-gray-900 dark:text-white mt-6 mb-3">{line.slice(2)}</h2>;
        if (line.startsWith("- ") || line.startsWith("* "))
          return <li key={`${i}-${j}`} className="text-sm text-gray-700 dark:text-gray-300 ml-4">{line.slice(2)}</li>;
        if (line.trim() === "")
          return <br key={`${i}-${j}`} />;
        return <p key={`${i}-${j}`} className="text-sm text-gray-700 dark:text-gray-300">{line}</p>;
      });
    });
  };

  if (brief.status === "pending" || brief.status === "processing") {
    return (
      <div>
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-6 cursor-pointer" aria-label="Back to briefs">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to Briefs
        </button>
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mb-4" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {brief.status === "pending" ? "Waiting to generate..." : "Generating brief..."}
          </p>
        </div>
      </div>
    );
  }

  if (brief.status === "failed") {
    return (
      <div>
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-6 cursor-pointer" aria-label="Back to briefs">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to Briefs
        </button>
        <EmptyState title="Brief generation failed" description="Something went wrong. Try generating a new brief." />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer" aria-label="Back to briefs">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to Briefs
        </button>
        <Button variant="danger" size="sm" onClick={handleDelete}>Delete</Button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{brief.title}</h2>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          {renderContent(brief.content)}
        </div>
      </div>

      {(citations ?? []).length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Cited Memories ({citations.length})
          </h3>
          <div className="space-y-2">
            {(citations ?? []).map((citation: { memory_id: string; relevance: string | null }, idx: number) => {
              const memory = citedMemories.get(citation.memory_id);
              return (
                <Card key={citation.memory_id}>
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-medium text-primary-600 dark:text-primary-400 flex-shrink-0">[M{idx + 1}]</span>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {memory?.summary || memory?.content?.slice(0, 150) || "Memory not found"}
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
        Generated {new Date(brief.created_at).toLocaleDateString()}
      </p>
    </div>
  );
}