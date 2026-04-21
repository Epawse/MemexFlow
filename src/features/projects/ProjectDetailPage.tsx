import { useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
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
  createSignalScanJob,
  updateProject,
  archiveProject,
  deleteProject,
  createBriefJob,
  deleteBrief,
} from "../../hooks/usePowerSyncQueries";
import type { Brief, SignalRule, ChannelType } from "../../lib/models";
import { createCapture } from "../../lib/captures";
import { Button } from "../../shared/components/Button";
import { Input } from "../../shared/components/Input";
import { Card } from "../../shared/components/Card";
import { EmptyState } from "../../shared/components/EmptyState";
import { Spinner } from "../../shared/components/Spinner";
import { Modal } from "../../shared/components/Modal";
import { TOPIC_COLORS, TYPE_ICONS } from "../../shared/constants";
import { Tabs } from "../../shared/components/Tabs";
import { StatusBadge } from "../../shared/components/StatusBadge";
import { renderContent } from "../../shared/utils/renderContent";

type Tab = "captures" | "memories" | "briefs" | "signals" | "settings";

export function ProjectDetailPage() {
  const { t } = useTranslation();
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
  const [editColor, setEditColor] = useState<string>(TOPIC_COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteBriefModal, setShowDeleteBriefModal] = useState(false);

  // Signal state
  const [signalName, setSignalName] = useState("");
  const [signalQuery, setSignalQuery] = useState("");
  const [channelType, setChannelType] = useState<ChannelType>("internal");
  const [feedUrl, setFeedUrl] = useState("");
  const [githubOwner, setGithubOwner] = useState("");
  const [githubRepo, setGithubRepo] = useState("");
  const [creatingSignal, setCreatingSignal] = useState(false);
  const [runningSignalId, setRunningSignalId] = useState<string | null>(null);

  const handleCapture = async () => {
    if (!user || !captureUrl.trim()) return;
    setCapturing(true);
    try {
      await createCapture({ userId: user.id, url: captureUrl.trim(), projectId: id });
      setCaptureUrl("");
      toast.success(t("toast.captureCreated"), { description: t("captures.confirmedDesc") });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("common.error");
      toast.error(t("captures.confirmFailed"), { description: msg });
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
      toast.success(t("briefs.generationStarted"), { description: t("briefs.generationStartedDesc") });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("common.error");
      toast.error(t("briefs.generateFailed"), { description: msg });
    } finally {
      setGeneratingBrief(false);
    }
  };

  const handleDeleteBrief = async () => {
    if (!selectedBriefId) return;
    try {
      await deleteBrief(selectedBriefId);
      toast.success(t("briefs.deleted"));
      setSelectedBriefId(null);
      setShowDeleteBriefModal(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("common.error");
      toast.error(t("briefs.deleteFailed"), { description: msg });
    }
  };

  const handleCreateSignal = async () => {
    if (!user || !id || !signalName.trim() || !signalQuery.trim()) return;
    if (channelType === "rss" && !feedUrl.trim()) return;
    if (channelType === "github_release" && (!githubOwner.trim() || !githubRepo.trim())) return;
    setCreatingSignal(true);
    try {
      const channelConfig: Record<string, string> = channelType === "rss"
        ? { feed_url: feedUrl.trim() }
        : channelType === "github_release"
          ? { owner: githubOwner.trim(), repo: githubRepo.trim() }
          : {};
      await createSignalRule({
        userId: user.id,
        projectId: id,
        name: signalName.trim(),
        query: signalQuery.trim(),
        channelType,
        channelConfig,
      });
      setSignalName("");
      setSignalQuery("");
      setChannelType("internal");
      setFeedUrl("");
      setGithubOwner("");
      setGithubRepo("");
      toast.success(t("signals.ruleCreated"));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("common.error");
      toast.error(t("signals.ruleCreateFailed"), { description: msg });
    } finally {
      setCreatingSignal(false);
    }
  };

  const handleRunSignal = async (rule: SignalRule) => {
    if (!user) return;
    setRunningSignalId(rule.id);
    try {
      const ruleChannelType = rule.channel_type || "internal";
      if (ruleChannelType === "internal") {
        await createSignalJob(rule.id, user.id);
        toast.success(t("signals.checkStarted"), { description: t("signals.checkStartedDesc") });
      } else {
        await createSignalScanJob(rule.id, user.id);
        toast.success(t("signals.scanStarted"), { description: t("signals.scanStartedDesc") });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("common.error");
      toast.error(t("signals.runFailed"), { description: msg });
    } finally {
      setRunningSignalId(null);
    }
  };

  const handleDeleteSignal = async (ruleId: string) => {
    try {
      await deleteSignalRule(ruleId);
      toast.success(t("signals.ruleDeleted"));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("common.error");
      toast.error(t("signals.ruleDeleteFailed"), { description: msg });
    }
  };

  const handleToggleSignal = async (ruleId: string, isActive: boolean) => {
    try {
      await toggleRuleActive(ruleId, !isActive);
      toast.success(isActive ? t("signals.toggledPaused") : t("signals.toggledActive"));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("common.error");
      toast.error(t("signals.toggleFailed"), { description: msg });
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
      toast.success(t("topics.updated"));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("common.error");
      toast.error(t("topics.updateFailed"), { description: msg });
    }
    setSaving(false);
  };

  const handleArchive = async () => {
    if (!id) return;
    try {
      await archiveProject(id);
      toast.success(t("topics.archived"));
      navigate("/projects");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("common.error");
      toast.error(t("topics.archiveFailed"), { description: msg });
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await deleteProject(id);
      toast.success(t("topics.deleted"));
      navigate("/projects");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("common.error");
      toast.error(t("topics.deleteFailed"), { description: msg });
      setDeleting(false);
    }
  };

  if (projectLoading) return <Spinner className="mt-12" />;

  if (projectError) {
    return (
      <EmptyState className="mt-12" title={t("topics.loadError")} description={projectError || t("common.retry")}
        action={<Button onClick={() => navigate("/projects")}>{t("topics.backToTopics")}</Button>} />
    );
  }

  if (!project) {
    return (
      <EmptyState className="mt-12" title={t("topics.notFound")} description={t("topics.notFoundDesc")}
        action={<Button onClick={() => navigate("/projects")}>{t("topics.backToTopics")}</Button>} />
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "captures", label: t("topics.capturesTab") },
    { key: "memories", label: t("topics.memoriesTab") },
    { key: "briefs", label: t("topics.briefsTab") },
    { key: "signals", label: t("topics.signalsTab") },
    { key: "settings", label: t("topics.settingsTab") },
  ];

  const captureList = captures ?? [];
  const memoryList = memories ?? [];
  const briefList = briefs ?? [];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate("/projects")} aria-label={t("topics.backToTopics")}
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

      <Tabs
        items={tabs}
        activeKey={activeTab}
        onChange={(key) => { setActiveTab(key as Tab); setSelectedBriefId(null); }}
        className="mb-6"
      />

      {/* Captures tab */}
      {activeTab === "captures" && (
        <div>
          <div className="flex gap-2 mb-6">
            <input type="url" placeholder={t("topics.capturePlaceholder")} value={captureUrl}
              onChange={(e) => setCaptureUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCapture()}
              className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
            <Button onClick={handleCapture} loading={capturing} disabled={!captureUrl.trim()}>{t("topics.captureButton")}</Button>
          </div>
          {capturesError ? (
            <EmptyState title={t("common.error")} description={capturesError || t("common.retry")} />
          ) : captureList.length === 0 ? (
            <EmptyState title={t("topics.noCaptures")} description={t("topics.noCapturesDesc")} />
          ) : (
            <div className="space-y-3">
              {captureList.map((capture) => (
                <Card key={capture.id} hover onClick={() => navigate(`/captures/${capture.id}`)}>
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
            <EmptyState title={t("common.error")} description={memoriesError || t("common.retry")} />
          ) : memoryList.length === 0 ? (
            <EmptyState title={t("topics.noMemories")} description={t("topics.noMemoriesDesc")} />
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
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{memory.summary || t("memories.title")}</p>
                      {confidence > 0 && (
                        <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${confidenceColor}`}>
                          {Math.round(confidence * 100)}%
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
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">{t("topics.newSignalRule")}</h3>
            <div className="flex gap-3 mb-3">
              <input type="text" placeholder={t("signals.ruleNamePlaceholder")}
                value={signalName} onChange={(e) => setSignalName(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" />
              <input type="text" placeholder={t("signals.keywordPlaceholder")}
                value={signalQuery} onChange={(e) => setSignalQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateSignal()}
                className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" />
            </div>
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">{t("topics.sourceLabel")}</label>
              <div className="flex gap-4">
                {([["internal", t("topics.internal")], ["rss", t("topics.rss")], ["github_release", t("topics.github")]] as const).map(([value, label]) => (
                  <label key={value} className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input type="radio" name="channelType" value={value} checked={channelType === value}
                      onChange={() => setChannelType(value as ChannelType)}
                      className="text-primary-600 focus:ring-primary-500" />
                    <span className="text-gray-700 dark:text-gray-300">{label}</span>
                  </label>
                ))}
              </div>
            </div>
            {channelType === "rss" && (
              <div className="mb-3">
                <input type="url" placeholder={t("topics.feedUrlPlaceholder")} value={feedUrl}
                  onChange={(e) => setFeedUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" />
              </div>
            )}
            {channelType === "github_release" && (
              <div className="flex gap-2 mb-3">
                <input type="text" placeholder={t("topics.ownerPlaceholder")} value={githubOwner}
                  onChange={(e) => setGithubOwner(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" />
                <input type="text" placeholder={t("topics.repoPlaceholder")} value={githubRepo}
                  onChange={(e) => setGithubRepo(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" />
              </div>
            )}
            <Button size="sm" onClick={handleCreateSignal} loading={creatingSignal}
              disabled={!signalName.trim() || !signalQuery.trim() || (channelType === "rss" && !feedUrl.trim()) || (channelType === "github_release" && (!githubOwner.trim() || !githubRepo.trim()))}>
              {t("topics.addRule")}
            </Button>
          </div>

          {(signalRules ?? []).length === 0 ? (
            <EmptyState title={t("topics.noRules")} description={t("topics.noRulesDesc")} />
          ) : (
            <div className="space-y-3">
              {(signalRules ?? []).map((rule: SignalRule) => (
                <Card key={rule.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{rule.name}</p>
                        {rule.channel_type !== "internal" && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                            {rule.channel_type === "rss" ? "RSS" : "GitHub"}
                          </span>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          rule.is_active
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                        }`}>
                          {rule.is_active ? t("topics.active") : t("topics.paused")}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-mono">
                        {rule.query}
                      </p>
                      {rule.last_checked_at && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {t("topics.lastChecked")}: {new Date(rule.last_checked_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="text" size="sm" onClick={() => handleToggleSignal(rule.id, !!rule.is_active)}>
                        {rule.is_active ? t("topics.pause") : t("topics.activate")}
                      </Button>
                      <Button size="sm" onClick={() => handleRunSignal(rule)}
                        loading={runningSignalId === rule.id}>
                        {t("topics.runNow")}
                      </Button>
                      <button onClick={() => handleDeleteSignal(rule.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors cursor-pointer"
                        aria-label={t("topics.deleteRule")}>
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
            <Input label={t("topics.titleLabel")} value={editTitle || project.title} onChange={(e) => setEditTitle(e.target.value)} />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("topics.descriptionLabel")}</label>
              <textarea value={editDescription || (project.description ?? "")} onChange={(e) => setEditDescription(e.target.value)}
                rows={3} className="block w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t("topics.color")}</label>
              <div className="flex gap-2">
                {TOPIC_COLORS.map((color) => (
                  <button key={color} type="button" onClick={() => setEditColor(color)} aria-label={`${t("topics.color")} ${color}`}
                    className={`w-8 h-8 rounded-full cursor-pointer transition-transform ${
                      (editColor || project.color) === color ? "scale-125 ring-2 ring-offset-2 ring-primary-500" : "hover:scale-110"
                    }`} style={{ backgroundColor: color }} />
                ))}
              </div>
            </div>
            <div className="pt-4 flex gap-3">
              <Button onClick={handleSaveSettings} loading={saving} disabled={!editTitle.trim()}>{t("topics.saveChanges")}</Button>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">{t("topics.dangerZone")}</h3>
            <div className="space-y-3">
              <Button variant="secondary" onClick={handleArchive}>{t("topics.archiveTopic")}</Button>
              <div><Button variant="danger" onClick={() => setShowDeleteModal(true)}>{t("topics.deleteTopic")}</Button></div>
            </div>
          </div>
          <Modal open={showDeleteModal} onClose={() => setShowDeleteModal(false)} title={t("topics.deleteConfirmTitle")}>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t("topics.deleteConfirmDesc")}
            </p>
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>{t("common.cancel")}</Button>
              <Button variant="danger" loading={deleting} onClick={handleDelete}>{t("common.delete")}</Button>
            </div>
          </Modal>
        </div>
      )}

      {/* Delete Brief Modal */}
      <Modal open={showDeleteBriefModal} onClose={() => setShowDeleteBriefModal(false)} title={t("topics.deleteBriefTitle")}>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t("topics.deleteBriefDesc")}
        </p>
        <div className="flex justify-end gap-3 mt-4">
          <Button variant="secondary" onClick={() => setShowDeleteBriefModal(false)}>{t("common.cancel")}</Button>
          <Button variant="danger" onClick={handleDeleteBrief}>{t("common.delete")}</Button>
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
  const { t } = useTranslation();
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
          {briefs.length === 1 ? t("briefs.countOne") : t("briefs.countOther", { count: briefs.length })}
        </p>
        <Button onClick={onGenerate} loading={generating}>{t("briefs.generate")}</Button>
      </div>

      {error ? (
        <EmptyState title={t("common.error")} description={error} />
      ) : briefs.length === 0 ? (
        <EmptyState
          title={t("topics.noBriefs")}
          description={t("topics.noBriefsDesc")}
          action={<Button onClick={onGenerate} loading={generating}>{t("briefs.generate")}</Button>}
        />
      ) : (
        <div className="space-y-3">
          {briefs.map((brief) => (
            <Card key={brief.id} hover onClick={() => onSelectBrief(brief.id)}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{brief.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <StatusBadge status={brief.status} />
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
  const { t } = useTranslation();
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

  if (brief.status === "pending" || brief.status === "processing") {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Spinner size="lg" className="mb-4" />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {brief.status === "pending" ? t("topics.briefWaiting") : t("topics.briefGenerating")}
        </p>
      </div>
    );
  }

  if (brief.status === "failed") {
    return (
      <div>
        <button onClick={onBack} aria-label={t("topics.backToBriefs")} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          {t("topics.backToBriefs")}
        </button>
        <EmptyState title={t("topics.briefFailedTitle")} description={t("topics.briefFailedDesc")} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          {t("topics.backToBriefs")}
        </button>
        <Button variant="danger" size="sm" onClick={onDelete}>{t("common.delete")}</Button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{brief.title}</h2>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          {renderContent(brief.content, citations ?? null, citedMemories)}
        </div>
      </div>

      {/* Cited memories sidebar */}
      {(citations ?? []).length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            {t("topics.citedMemories")} ({citations.length})
          </h3>
          <div className="space-y-2">
            {(citations ?? []).map((citation: { memory_id: string; relevance: string | null }, idx: number) => {
              const memory = citedMemories.get(citation.memory_id);
              return (
                <div key={citation.memory_id}
                  className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-sm">
                  <span className="text-xs font-medium text-primary-600 dark:text-primary-400">[M{idx + 1}]</span>
                  <p className="text-gray-700 dark:text-gray-300 mt-0.5">
                    {memory?.summary || memory?.content?.slice(0, 100) || t("topics.memoryNotFound")}
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
