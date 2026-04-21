import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../lib/AuthProvider";
import { useProjects, createProject } from "../../hooks/usePowerSyncQueries";
import { Modal } from "../../shared/components/Modal";
import { Button } from "../../shared/components/Button";
import { Input } from "../../shared/components/Input";
import { Card } from "../../shared/components/Card";
import { EmptyState } from "../../shared/components/EmptyState";
import { Spinner } from "../../shared/components/Spinner";
import { TOPIC_COLORS } from "../../shared/constants";
import { formatDate } from "../../lib/date";
export function ProjectsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: projects, isLoading, error } = useProjects(user?.id ?? "");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newColor, setNewColor] = useState<string>(TOPIC_COLORS[0]);

  const resetForm = () => {
    setNewTitle("");
    setNewDescription("");
    setNewColor(TOPIC_COLORS[0]);
  };

  const handleCreate = async () => {
    if (!user || !newTitle.trim()) return;
    setCreating(true);

    try {
      await createProject(
        user.id,
        newTitle.trim(),
        newDescription.trim() || null,
        newColor,
      );
      setShowCreateModal(false);
      resetForm();
      toast.success(t("topics.created"), {
        description: t("topics.ready", { title: newTitle.trim() }),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("common.error");
      toast.error(t("topics.createFailed"), {
        description: msg,
      });
    } finally {
      setCreating(false);
    }
  };

  const projectList = projects ?? [];

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t("topics.title")}
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {t("topics.description")}
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <svg
            className="w-4 h-4 mr-1.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          {t("topics.newTopic")}
        </Button>
      </div>

      {isLoading ? (
        <Spinner className="mt-12" />
      ) : error ? (
        <EmptyState
          className="mt-12"
          title={t("common.error")}
          description={error || t("common.retry")}
          action={
            <Button onClick={() => window.location.reload()}>{t("common.retry")}</Button>
          }
        />
      ) : projectList.length === 0 ? (
        <EmptyState
          title={t("topics.empty.title")}
          description={t("topics.empty.description")}
          action={
            <Button onClick={() => setShowCreateModal(true)} size="sm">
              {t("topics.createFirst")}
            </Button>
          }
        />
      ) : (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projectList.map((project) => (
            <Card
              key={project.id}
              hover
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  style={{ backgroundColor: project.color || "#6366f1" }}
                >
                  {project.title.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-white truncate">
                    {project.title}
                  </h3>
                  {project.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                      {project.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {t("common.updated")} {formatDate(project.updated_at)}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title={t("topics.newTopic")}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleCreate();
          }}
          className="space-y-4"
        >
          <Input
            label={t("topics.titleLabel")}
            placeholder={t("topics.titleLabel")}
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            required
          />
          <Input
            label={t("topics.descriptionLabel")}
            placeholder={t("topics.descriptionLabel")}
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t("topics.color")}
            </label>
            <div className="flex gap-2">
              {TOPIC_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewColor(color)}
                  className={`w-8 h-8 rounded-full cursor-pointer transition-transform ${
                    newColor === color
                      ? "scale-125 ring-2 ring-offset-2 ring-primary-500"
                      : "hover:scale-110"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => {
                setShowCreateModal(false);
                resetForm();
              }}
              type="button"
            >
              {t("common.cancel")}
            </Button>
            <Button loading={creating} disabled={!newTitle.trim()}>
              {t("topics.createTopic")}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
