import { useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useQuery } from "@powersync/react";
import { useAuth } from "../../lib/AuthProvider";
import {
  useProject,
  useProjectCaptures,
  useProjectMemories,
  useProjectBriefs,
  useBriefCitations,
  useSignalRules,
  createSignalRule,
  deleteSignalRule,
  toggleRuleActive,
  createSignalJob,
  updateProject,
  archiveProject,
  deleteProject,
  createBriefJob,
  deleteBrief,
} from "../../hooks/usePowerSyncQueries";
import type { Brief, SignalRule } from "../../lib/models";
import { createCapture } from "../../lib/captures";
import { Button } from "../../shared/components/Button";
import { Input } from "../../shared/components/Input";
import { Card } from "../../shared/components/Card";
import { EmptyState } from "../../shared/components/EmptyState";
import { Spinner } from "../../shared/components/Spinner";
import { Modal } from "../../shared/components/Modal";

type Tab = "captures" | "memories" | "briefs" | "signals" | "settings";

const PROJECT_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
  "#f59e0b", "#22c55e", "#14b8a6", "#3b82f6",
];

const TYPE_ICONS: Record<string, string> = {
  url: "M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.728-2.632a4.5 4.5 0 00-6.364-6.364L4.5 8.25a4.5 4.5 0 001.242 7.244",
  note: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
  file: "M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-19.5 0V18A2.25 2.25 0 004.5 20.25h15A2.25 2.25 0 0021.75 18v-5.75m-19.5 0h19.5",
};

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  processing: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const {
    data: projectRows,
    isLoading: projectLoading,
    error: projectError,
  } = useProject(id ?? "");
  const { data: captures, error: capturesError } = useProjectCaptures(id ?? "");
  const { data: memories, error: memoriesError } = useProjectMemories(id ?? "");
  const { data: briefs, error: briefsError } = useProjectBriefs(id ?? "");
  const { data: signalRules } = useSignalRules(id ?? "");

  const project = projectRows?.[0] ?? null;

  // Auto-select briefs tab if URL has ?tab=briefs
  const initialTab = (searchParams.get("tab") as Tab) || "captures";
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [captureUrl, setCaptureUrl] = useState("");
  const [capturing, setCapturing] = useState(false);
  const [generatingBrief, setGeneratingBrief] = useState(false);
  const [expandedMemory, setExpandedMemory] = useState<string | null>(null);
  const [selectedBriefId, setSelectedBriefId] = useState<string | null>(
    searchParams.get("brief") || null,
  );

  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editColor, setEditColor] = useState(PROJECT_COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteBriefModal, setShowDeleteBriefModal] = useState(false);

  // Signal state
  const [signalName, setSignalName] = useState("");
  const [signalQuery, setSignalQuery] = useState("");
  const [creatingSignal, setCreatingSignal] = useState(false);
  const [runningSignalId, setRunningSignalId] = useState<string | null>(null);

  const handleCapture = async () => {
    if (!user || !captureUrl.trim()) return;
    setCapturing(true);
    try {
      await createCapture({ userId: user.id, url: captureUrl.trim(), projectId: id });
      setCaptureUrl("");
      toast.success("Capture queued", { description: "Content will be extracted shortly." });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error("Failed to capture URL", { description: msg });
    } finally {
      setCapturing(false);
    }
  };

  const handleGenerateBrief = async () => {
    if (!user || !id) return;
    setGeneratingBrief(true);
    try {
      const { briefId } = await createBriefJob(id, user.id);
      setSelectedBriefId(briefId);
      toast.success("Brief generation started", { description: "This may take a minute or two." });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error("Failed to generate brief", { description: msg });
    } finally {
      setGeneratingBrief(false);
    }
  };

  const handleDeleteBrief = async () => {
    if (!selectedBriefId) return;
    try {
      await deleteBrief(selectedBriefId);
      toast.success("Brief deleted");
      setSelectedBriefId(null);
      setShowDeleteBriefModal(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error("Failed to delete brief", { description: msg });
    }
  };

  const handleCreateSignal = async () => {
    if (!user || !id || !signalName.trim() || !signalQuery.trim()) return;
    setCreatingSignal(true);
    try {
      await createSignalRule({
        userId: user.id,
        projectId: id,
        name: signalName.trim(),
        query: signalQuery.trim(),
      });
      setSignalName("");
      setSignalQuery("");
      toast.success("Signal rule created");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error("Failed to create signal rule", { description: msg });
    } finally {
      setCreatingSignal(false);
    }
  };

  const handleRunSignal = async (ruleId: string) => {
    if (!user) return;
    setRunningSignalId(ruleId);
    try {
      await createSignalJob(ruleId, user.id);
      toast.success("Signal check started", { description: "Matches will appear shortly." });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error("Failed to run signal", { description: msg });
    } finally {
      setRunningSignalId(null);
    }
  };

  const handleDeleteSignal = async (ruleId: string) => {
    try {
      await deleteSignalRule(ruleId);
      toast.success("Signal rule deleted");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error("Failed to delete signal rule", { description: msg });
    }
  };

  const handleToggleSignal = async (ruleId: string, isActive: boolean) => {
    try {
      await toggleRuleActive(ruleId, !isActive);
      toast.success(isActive ? "Rule paused" : "Rule activated");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error("Failed to toggle rule", { description: msg });
    }
  };

  const handleSaveSettings = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await updateProject(id, {
        title: editTitle.trim(),
        description: editDescription.trim() || null,
        color: editColor,
      });
      toast.success("Project updated");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error("Failed to save", { description: msg });
    }
    setSaving(false);
  };

  const handleArchive = async () => {
    if (!id) return;
    try {
      await archiveProject(id);
      toast.success("Project archived");
      navigate("/projects");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error("Failed to archive project", { description: msg });
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await deleteProject(id);
      toast.success("Project deleted");
      navigate("/projects");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error("Failed to delete project", { description: msg });
      setDeleting(false);
    }
  };

  if (projectLoading) return <Spinner className="mt-12" />;

  if (projectError) {
    return (
      <EmptyState className="mt-12" title="Couldn't load project" description={projectError || "Please try again."}
        action={<Button onClick={() => navigate("/projects")}>Back to projects</Button>} />
    );
  }

  if (!project) {
    return (
      <EmptyState className="mt-12" title="Project not found" description="This project may have been deleted."
        action={<Button onClick={() => navigate("/projects")}>Back to projects</Button>} />
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "captures", label: "Captures" },
    { key: "memories", label: "Memories" },
    { key: "briefs", label: "Briefs" },
    { key: "signals", label: "Signals" },
    { key: "settings", label: "Settings" },
  ];

  const captureList = captures ?? [];
  const memoryList = memories ?? [];
  const briefList = briefs ?? [];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate("/projects")} aria-label="Back to projects"
          className="p-1.5 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </button>
        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
          style={{ backgroundColor: project.color || "#6366f1" }}>
          {project.title.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white truncate">{project.title}</h2>
          {project.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400">{project.description}</p>
          )}
        </div>
      </div>

      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex gap-6">
          {tabs.map((tab) => (
            <button key={tab.key} onClick={() => { setActiveTab(tab.key); setSelectedBriefId(null); }} aria-label={`${tab.label} tab`}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
                activeTab === tab.key
                  ? "border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Captures tab */}
      {activeTab === "captures" && (
        <div>
          <div className="flex gap-2 mb-6">
            <input type="url" placeholder="Paste a URL to capture..." value={captureUrl}
              onChange={(e) => setCaptureUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCapture()}
              className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
            <Button onClick={handleCapture} loading={capturing} disabled={!captureUrl.trim()}>Capture</Button>
          </div>
          {capturesError ? (
            <EmptyState title="Couldn't load captures" description={capturesError || "Please try again."} />
          ) : captureList.length === 0 ? (
            <EmptyState title="No captures yet" description="Paste a URL above to start capturing content for this project." />
          ) : (
            <div className="space-y-3">
              {captureList.map((capture) => (
                <Card key={capture.id} hover>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={TYPE_ICONS[capture.type] || TYPE_ICONS.url} />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{capture.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{new Date(capture.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Memories tab */}
      {activeTab === "memories" && (
        <div>
          {memoriesError ? (
            <EmptyState title="Couldn't load memories" description={memoriesError || "Please try again."} />
          ) : memoryList.length === 0 ? (
            <EmptyState title="No memories yet" description="Memories are extracted from your captures. Capture some content first." />
          ) : (
            <div className="space-y-4">
              {memoryList.map((memory) => {
                const rawMetadata: unknown = typeof memory.metadata === "string" ? JSON.parse(memory.metadata || "{}") : (memory.metadata ?? {});
                const metadata = (rawMetadata ?? {}) as { confidence?: number | string; key_claims?: string[] };
                const confidence = Number(metadata.confidence) || 0;
                const claims = metadata.key_claims ?? [];
                const isExpanded = expandedMemory === memory.id;
                const confidenceColor = confidence >= 0.7
                  ? "bg-success-light text-success-dark dark:bg-green-900/30 dark:text-green-400"
                  : confidence >= 0.4
                    ? "bg-warning-light text-warning-dark dark:bg-amber-900/30 dark:text-amber-400"
                    : "bg-danger-light text-danger-dark dark:bg-red-900/30 dark:text-red-400";
                return (
                  <Card key={memory.id} hover onClick={() => setExpandedMemory(isExpanded ? null : memory.id)}>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{memory.summary || "Memory"}</p>
                      {confidence > 0 && (
                        <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${confidenceColor}`}>
                          {Math.round(confidence * 100)}% confidence
                        </span>
                      )}
                      {claims.length > 0 && (
                        <ul className="mt-2 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          {claims.slice(0, 3).map((claim, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-primary-500 mt-0.5">•</span>{claim}
                            </li>
                          ))}
                        </ul>
                      )}
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{new Date(memory.created_at).toLocaleDateString()}</p>
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{memory.content}</p>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Briefs tab */}
      {activeTab === "briefs" && (
        <BriefsTab
          briefs={briefList}
          error={briefsError}
          selectedBriefId={selectedBriefId}
          onSelectBrief={setSelectedBriefId}
          onGenerate={handleGenerateBrief}
          generating={generatingBrief}
          onDeleteBrief={() => setShowDeleteBriefModal(true)}
        />
      )}

      {/* Signals tab */}
      {activeTab === "signals" && (
        <div>
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">New Signal Rule</h3>
            <div className="flex gap-3">
              <input type="text" placeholder="Rule name (e.g., 'RAG mentions')"
                value={signalName} onChange={(e) => setSignalName(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" />
              <input type="text" placeholder="Keyword (e.g., 'retrieval-augmented')"
                value={signalQuery} onChange={(e) => setSignalQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateSignal()}
                className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" />
              <Button size="sm" onClick={handleCreateSignal} loading={creatingSignal}
                disabled={!signalName.trim() || !signalQuery.trim()}>
                Add
              </Button>
            </div>
          </div>

          {(signalRules ?? []).length === 0 ? (
            <EmptyState title="No signal rules" description="Create a rule above to monitor for keyword matches in your memories." />
          ) : (
            <div className="space-y-3">
              {(signalRules ?? []).map((rule: SignalRule) => (
                <Card key={rule.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{rule.name}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          rule.is_active
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                        }`}>
                          {rule.is_active ? "Active" : "Paused"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-mono">
                        {rule.query}
                      </p>
                      {rule.last_checked_at && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          Last checked: {new Date(rule.last_checked_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="text" size="sm" onClick={() => handleToggleSignal(rule.id, !!rule.is_active)}>
                        {rule.is_active ? "Pause" : "Activate"}
                      </Button>
                      <Button size="sm" onClick={() => handleRunSignal(rule.id)}
                        loading={runningSignalId === rule.id}>
                        Run Now
                      </Button>
                      <button onClick={() => handleDeleteSignal(rule.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors cursor-pointer"
                        aria-label="Delete rule">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Settings tab */}
      {activeTab === "settings" && project && (
        <div className="max-w-lg">
          <div className="space-y-4">
            <Input label="Title" value={editTitle || project.title} onChange={(e) => setEditTitle(e.target.value)} />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <textarea value={editDescription || (project.description ?? "")} onChange={(e) => setEditDescription(e.target.value)}
                rows={3} className="block w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Color</label>
              <div className="flex gap-2">
                {PROJECT_COLORS.map((color) => (
                  <button key={color} type="button" onClick={() => setEditColor(color)} aria-label={`Select color ${color}`}
                    className={`w-8 h-8 rounded-full cursor-pointer transition-transform ${
                      (editColor || project.color) === color ? "scale-125 ring-2 ring-offset-2 ring-primary-500" : "hover:scale-110"
                    }`} style={{ backgroundColor: color }} />
                ))}
              </div>
            </div>
            <div className="pt-4 flex gap-3">
              <Button onClick={handleSaveSettings} loading={saving} disabled={!editTitle.trim()}>Save Changes</Button>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Danger Zone</h3>
            <div className="space-y-3">
              <Button variant="secondary" onClick={handleArchive}>Archive Project</Button>
              <div><Button variant="danger" onClick={() => setShowDeleteModal(true)}>Delete Project</Button></div>
            </div>
          </div>
          <Modal open={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Project">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Are you sure you want to delete this project? This will also delete all captures and memories within it. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
              <Button variant="danger" loading={deleting} onClick={handleDelete}>Delete</Button>
            </div>
          </Modal>
        </div>
      )}

      {/* Delete Brief Modal */}
      <Modal open={showDeleteBriefModal} onClose={() => setShowDeleteBriefModal(false)} title="Delete Brief">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Are you sure you want to delete this brief? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3 mt-4">
          <Button variant="secondary" onClick={() => setShowDeleteBriefModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleDeleteBrief}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Briefs tab component
// ---------------------------------------------------------------------------

function BriefsTab({
  briefs,
  error,
  selectedBriefId,
  onSelectBrief,
  onGenerate,
  generating,
  onDeleteBrief,
}: {
  briefs: Brief[];
  error: string | null;
  selectedBriefId: string | null;
  onSelectBrief: (id: string | null) => void;
  onGenerate: () => void;
  generating: boolean;
  onDeleteBrief: () => void;
}) {
  const selectedBrief = selectedBriefId ? briefs.find((b) => b.id === selectedBriefId) : null;

  if (selectedBrief) {
    return (
      <BriefDetail
        brief={selectedBrief}
        onBack={() => onSelectBrief(null)}
        onDelete={onDeleteBrief}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {briefs.length} brief{briefs.length !== 1 ? "s" : ""} generated
        </p>
        <Button onClick={onGenerate} loading={generating}>Generate Brief</Button>
      </div>

      {error ? (
        <EmptyState title="Couldn't load briefs" description={error} />
      ) : briefs.length === 0 ? (
        <EmptyState
          title="No briefs yet"
          description="Generate a brief to synthesize your project's memories into a research report."
          action={<Button onClick={onGenerate} loading={generating}>Generate Brief</Button>}
        />
      ) : (
        <div className="space-y-3">
          {briefs.map((brief) => (
            <Card key={brief.id} hover onClick={() => onSelectBrief(brief.id)}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{brief.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[brief.status] ?? STATUS_BADGE.pending}`}>
                      {brief.status}
                    </span>
                  </div>
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                  {new Date(brief.created_at).toLocaleDateString()}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Brief detail view with rendered markdown + citations
// ---------------------------------------------------------------------------

function BriefDetail({
  brief,
  onBack,
  onDelete,
}: {
  brief: Brief;
  onBack: () => void;
  onDelete: () => void;
}) {
  const { data: citations } = useBriefCitations(brief.id);

  // Fetch cited memories
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

  // Simple markdown rendering: replace [Mn] with clickable links
  const renderContent = (content: string) => {
    if (!content) return null;
    // Split on citation markers [M1], [M2], etc.
    const parts = content.split(/(\[M\d+\])/g);
    return parts.map((part, i) => {
      const match = part.match(/^\[M(\d+)\]$/);
      if (match) {
        const idx = parseInt(match[1], 10) - 1;
        const citation = (citations ?? [])[idx];
        const memory = citation ? citedMemories.get(citation.memory_id) : null;
        return (
          <button
            key={i}
            onClick={() => {
              if (memory) {
                // Navigate to the memory (scroll to it in memories tab)
                onBack();
              }
            }}
            className="text-primary-600 dark:text-primary-400 hover:underline font-medium cursor-pointer"
            title={memory?.summary || "Cited memory"}
          >
            {part}
          </button>
        );
      }
      // Render markdown-ish: headers, bullets, line breaks
      const lines = part.split("\n");
      return lines.map((line, j) => {
        if (line.startsWith("### ")) {
          return <h4 key={`${i}-${j}`} className="text-base font-semibold text-gray-900 dark:text-white mt-4 mb-2">{line.slice(4)}</h4>;
        }
        if (line.startsWith("## ")) {
          return <h3 key={`${i}-${j}`} className="text-lg font-semibold text-gray-900 dark:text-white mt-5 mb-2">{line.slice(3)}</h3>;
        }
        if (line.startsWith("# ")) {
          return <h2 key={`${i}-${j}`} className="text-xl font-bold text-gray-900 dark:text-white mt-6 mb-3">{line.slice(2)}</h2>;
        }
        if (line.startsWith("- ") || line.startsWith("* ")) {
          return <li key={`${i}-${j}`} className="text-sm text-gray-700 dark:text-gray-300 ml-4">{line.slice(2)}</li>;
        }
        if (line.trim() === "") {
          return <br key={`${i}-${j}`} />;
        }
        return <p key={`${i}-${j}`} className="text-sm text-gray-700 dark:text-gray-300">{line}</p>;
      });
    });
  };

  if (brief.status === "pending" || brief.status === "processing") {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mb-4" />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {brief.status === "pending" ? "Waiting to generate..." : "Generating brief..."}
        </p>
      </div>
    );
  }

  if (brief.status === "failed") {
    return (
      <div>
        <button onClick={onBack} aria-label="Back to briefs" className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 cursor-pointer">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to briefs
        </button>
        <EmptyState title="Brief generation failed" description="Something went wrong. Try generating a new brief." />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white cursor-pointer">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to briefs
        </button>
        <Button variant="danger" size="sm" onClick={onDelete}>Delete</Button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{brief.title}</h2>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          {renderContent(brief.content)}
        </div>
      </div>

      {/* Cited memories sidebar */}
      {(citations ?? []).length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Cited Memories ({citations.length})
          </h3>
          <div className="space-y-2">
            {(citations ?? []).map((citation: { memory_id: string; relevance: string | null }, idx: number) => {
              const memory = citedMemories.get(citation.memory_id);
              return (
                <div key={citation.memory_id}
                  className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-sm">
                  <span className="text-xs font-medium text-primary-600 dark:text-primary-400">[M{idx + 1}]</span>
                  <p className="text-gray-700 dark:text-gray-300 mt-0.5">
                    {memory?.summary || memory?.content?.slice(0, 100) || "Memory not found"}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}