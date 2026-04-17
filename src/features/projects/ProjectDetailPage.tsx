import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/AuthProvider";
import {
  useProject,
  useProjectCaptures,
  useProjectMemories,
  updateProject,
  archiveProject,
  deleteProject,
} from "../../hooks/usePowerSyncQueries";
import { createCapture } from "../../lib/captures";
import { Button } from "../../shared/components/Button";
import { Input } from "../../shared/components/Input";
import { Card } from "../../shared/components/Card";
import { EmptyState } from "../../shared/components/EmptyState";
import { Spinner } from "../../shared/components/Spinner";
import { Modal } from "../../shared/components/Modal";

type Tab = "captures" | "memories" | "settings";

const PROJECT_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#ef4444",
  "#f59e0b",
  "#22c55e",
  "#14b8a6",
  "#3b82f6",
];

const TYPE_ICONS: Record<string, string> = {
  url: "M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.728-2.632a4.5 4.5 0 00-6.364-6.364L4.5 8.25a4.5 4.5 0 001.242 7.244",
  note: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
  file: "M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-19.5 0V18A2.25 2.25 0 004.5 20.25h15A2.25 2.25 0 0021.75 18v-5.75m-19.5 0h19.5",
};

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: projectRows } = useProject(id ?? "");
  const { data: captures } = useProjectCaptures(id ?? "");
  const { data: memories } = useProjectMemories(id ?? "");

  const project = projectRows?.[0] ?? null;

  const [activeTab, setActiveTab] = useState<Tab>("captures");
  const [captureUrl, setCaptureUrl] = useState("");
  const [capturing, setCapturing] = useState(false);
  const [expandedMemory, setExpandedMemory] = useState<string | null>(null);

  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editColor, setEditColor] = useState(PROJECT_COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCapture = async () => {
    if (!user || !captureUrl.trim()) return;
    setCapturing(true);
    setError(null);

    try {
      await createCapture({
        userId: user.id,
        url: captureUrl.trim(),
        projectId: id,
      });
      setCaptureUrl("");
    } catch (err: any) {
      setError(err.message || "Failed to capture URL");
    } finally {
      setCapturing(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!id) return;
    setSaving(true);
    setError(null);
    try {
      await updateProject(id, {
        title: editTitle.trim(),
        description: editDescription.trim() || null,
        color: editColor,
      });
    } catch (err: any) {
      setError(err.message || "Failed to save");
    }
    setSaving(false);
  };

  const handleArchive = async () => {
    if (!id) return;
    await archiveProject(id);
    navigate("/projects");
  };

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    await deleteProject(id);
    setDeleting(false);
    navigate("/projects");
  };

  if (!project) {
    return <Spinner className="mt-12" />;
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "captures", label: "Captures" },
    { key: "memories", label: "Memories" },
    { key: "settings", label: "Settings" },
  ];

  const captureList = captures ?? [];
  const memoryList = memories ?? [];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate("/projects")}
          className="p-1.5 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
            />
          </svg>
        </button>
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
          style={{ backgroundColor: project.color || "#6366f1" }}
        >
          {project.title.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white truncate">
            {project.title}
          </h2>
          {project.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {project.description}
            </p>
          )}
        </div>
      </div>

      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
                activeTab === tab.key
                  ? "border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === "captures" && (
        <div>
          <div className="flex gap-2 mb-6">
            <input
              type="url"
              placeholder="Paste a URL to capture..."
              value={captureUrl}
              onChange={(e) => setCaptureUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCapture()}
              className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <Button
              onClick={handleCapture}
              loading={capturing}
              disabled={!captureUrl.trim()}
            >
              Capture
            </Button>
          </div>

          {error && <p className="text-sm text-danger mb-4">{error}</p>}

          {captureList.length === 0 ? (
            <EmptyState
              title="No captures yet"
              description="Paste a URL above to start capturing content for this project."
            />
          ) : (
            <div className="space-y-3">
              {captureList.map((capture: any) => (
                <Card key={capture.id} hover>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-4 h-4 text-primary-600 dark:text-primary-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d={TYPE_ICONS[capture.type] || TYPE_ICONS.url}
                        />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {capture.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {new Date(capture.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "memories" && (
        <div>
          {memoryList.length === 0 ? (
            <EmptyState
              title="No memories yet"
              description="Memories are extracted from your captures. Capture some content first."
            />
          ) : (
            <div className="space-y-4">
              {memoryList.map((memory: any) => {
                const metadata =
                  (typeof memory.metadata === "string"
                    ? JSON.parse(memory.metadata || "{}")
                    : memory.metadata) || {};
                const confidence = Number(metadata.confidence) || 0;
                const claims = (metadata.key_claims as string[]) || [];
                const isExpanded = expandedMemory === memory.id;

                const confidenceColor =
                  confidence >= 0.7
                    ? "bg-success-light text-success-dark dark:bg-green-900/30 dark:text-green-400"
                    : confidence >= 0.4
                      ? "bg-warning-light text-warning-dark dark:bg-amber-900/30 dark:text-amber-400"
                      : "bg-danger-light text-danger-dark dark:bg-red-900/30 dark:text-red-400";

                return (
                  <Card
                    key={memory.id}
                    hover
                    onClick={() =>
                      setExpandedMemory(isExpanded ? null : memory.id)
                    }
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {memory.summary || "Memory"}
                      </p>
                      {confidence > 0 && (
                        <span
                          className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${confidenceColor}`}
                        >
                          {Math.round(confidence * 100)}% confidence
                        </span>
                      )}
                      {claims.length > 0 && (
                        <ul className="mt-2 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          {claims.slice(0, 3).map((claim, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-primary-500 mt-0.5">•</span>
                              {claim}
                            </li>
                          ))}
                        </ul>
                      )}
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                        {new Date(memory.created_at).toLocaleDateString()}
                      </p>
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                            {memory.content}
                          </p>
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

      {activeTab === "settings" && project && (
        <div className="max-w-lg">
          <div className="space-y-4">
            <Input
              label="Title"
              value={editTitle || project.title}
              onChange={(e) => setEditTitle(e.target.value)}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={editDescription || (project.description ?? "")}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
                className="block w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Color
              </label>
              <div className="flex gap-2">
                {PROJECT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setEditColor(color)}
                    className={`w-8 h-8 rounded-full cursor-pointer transition-transform ${
                      (editColor || project.color) === color
                        ? "scale-125 ring-2 ring-offset-2 ring-primary-500"
                        : "hover:scale-110"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <div className="pt-4 flex gap-3">
              <Button
                onClick={handleSaveSettings}
                loading={saving}
                disabled={!editTitle.trim()}
              >
                Save Changes
              </Button>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Danger Zone
            </h3>
            <div className="space-y-3">
              <Button variant="secondary" onClick={handleArchive}>
                Archive Project
              </Button>
              <div>
                <Button
                  variant="danger"
                  onClick={() => setShowDeleteModal(true)}
                >
                  Delete Project
                </Button>
              </div>
            </div>
          </div>

          <Modal
            open={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            title="Delete Project"
          >
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Are you sure you want to delete this project? This will also
              delete all captures and memories within it. This action cannot be
              undone.
            </p>
            <div className="flex justify-end gap-3 mt-4">
              <Button
                variant="secondary"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                loading={deleting}
                onClick={handleDelete}
              >
                Delete
              </Button>
            </div>
          </Modal>
        </div>
      )}
    </div>
  );
}
