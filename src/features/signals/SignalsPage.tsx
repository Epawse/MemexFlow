import { useState } from "react";
import { useAuth } from "../../lib/AuthProvider";
import {
  useUndismissedSignalMatches,
  useDiscoveries,
  dismissMatch,
  captureDiscovery,
} from "../../hooks/usePowerSyncQueries";
import { useQuery, useStatus } from "@powersync/react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Card } from "../../shared/components/Card";
import { EmptyState } from "../../shared/components/EmptyState";
import { Spinner } from "../../shared/components/Spinner";
import { Button } from "../../shared/components/Button";
import { Tabs } from "../../shared/components/Tabs";
import { getPowerSyncDb, reconnectPowerSync, debugPowerSyncTables } from "../../lib/powersync";
import type { SignalDiscovery } from "../../lib/models";
import { formatDate } from "../../lib/date";
type Tab = "matches" | "discoveries";

export function SignalsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const [activeTab, setActiveTab] = useState<Tab>("matches");
  const [capturingId, setCapturingId] = useState<string | null>(null);

  const {
    data: matches,
    isLoading: matchesLoading,
    error: matchesError,
  } = useUndismissedSignalMatches(userId);

  const {
    data: discoveries,
    isLoading: discoveriesLoading,
    error: discoveriesError,
  } = useDiscoveries(userId);

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

  // Also fetch rule names for discoveries
  const discoveryRuleIds = [...new Set((discoveries ?? []).map((d) => d.signal_rule_id))];
  const discoveryRuleRows = useQuery(
    discoveryRuleIds.length > 0
      ? `SELECT id, name FROM signal_rules WHERE id IN (${discoveryRuleIds.map(() => "?").join(",")})`
      : "SELECT id, name FROM signal_rules WHERE 0",
    discoveryRuleIds.length > 0 ? discoveryRuleIds : [],
  );
  const discoveryRuleMap = new Map(
    ((discoveryRuleRows.data ?? []) as Array<{ id: string; name: string }>).map((r) => [r.id, r]),
  );

  const handleDismiss = async (matchId: string) => {
    try {
      await dismissMatch(matchId);
      toast.success(t("signals.dismissed"));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("common.error");
      toast.error(t("signals.dismissFailed"), { description: msg });
    }
  };

  const handleCapture = async (discovery: SignalDiscovery) => {
    if (!user) return;
    setCapturingId(discovery.id);
    try {
      await captureDiscovery({
        userId: user.id,
        discovery,
      });
      toast.success(t("signals.captured"), {
        description: t("signals.capturedDesc"),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("common.error");
      toast.error(t("signals.captureFailed"), { description: msg });
    } finally {
      setCapturingId(null);
    }
  };

  const matchesCount = (matches ?? []).length;
  const discoveriesCount = (discoveries ?? []).length;

  const tabItems = [
    { key: "matches", label: t("signals.matches"), badge: matchesCount },
    { key: "discoveries", label: t("signals.discoveries"), badge: discoveriesCount },
  ];

  const [reconnecting, setReconnecting] = useState(false);

  const handleReconnect = async () => {
    setReconnecting(true);
    try {
      await reconnectPowerSync();
      toast.success(t("common.reconnected"));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("common.error");
      toast.error(t("common.reconnectFailed"), { description: msg });
    } finally {
      setReconnecting(false);
    }
  };

  const handleDebug = async () => {
    const status = await debugPowerSyncTables();
    toast.info(t("common.debugInfo"), {
      description: `${t("common.connected")}: ${status?.connected ?? "N/A"}, ${t("common.lastSync")}: ${status?.lastSyncAt?.toLocaleTimeString() ?? "never"}`,
    });
  };

  const db = getPowerSyncDb();
  const syncStatus = useStatus();
  const showSyncWarning = db && (!syncStatus?.connected || (discoveriesCount === 0 && matchesCount === 0 && !matchesLoading && !discoveriesLoading));

  return (
    <div>
      {showSyncWarning && (
        <div className="mb-4 p-3 rounded-xl bg-amber-500/10 dark:bg-amber-500/10 border border-amber-200/60 dark:border-amber-800/60">
          <div className="flex items-center justify-between">
            <div className="text-sm text-amber-800 dark:text-amber-300">
              {!syncStatus?.connected
                ? t("common.powersyncDisconnected")
                : t("common.noDataFound")}
            </div>
            <div className="flex gap-2">
              <Button variant="text" size="sm" onClick={handleDebug}>
                {t("common.debug")}
              </Button>
              <Button variant="secondary" size="sm" onClick={handleReconnect} loading={reconnecting}>
                {t("common.reconnect")}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t("signals.title")}</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          {t("signals.description")}
        </p>
      </div>

      <Tabs
        items={tabItems}
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as Tab)}
        className="mt-6"
      />

      {activeTab === "matches" && (
        matchesLoading ? <Spinner className="mt-8" /> :
        matchesError ? <EmptyState className="mt-8" title={t("common.error")} description={matchesError} /> :
        matchesCount === 0 ? (
          <EmptyState
            className="mt-8"
            title={t("signals.noMatches")}
            description={t("signals.noMatchesDesc")}
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
                        {rule?.name || t("signals.unknownRule")}
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
                          {formatDate(match.matched_at)}
                        </span>
                      </div>
                    </div>
                    <Button variant="text" size="sm" onClick={() => handleDismiss(match.id)}>
                      {t("recall.dismiss")}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )
      )}

      {activeTab === "discoveries" && (
        discoveriesLoading ? <Spinner className="mt-8" /> :
        discoveriesError ? <EmptyState className="mt-8" title={t("common.error")} description={discoveriesError} /> :
        discoveriesCount === 0 ? (
          <EmptyState
            className="mt-8"
            title={t("signals.noDiscoveries")}
            description={t("signals.noDiscoveriesDesc")}
          />
        ) : (
          <div className="mt-6 space-y-3">
            {(discoveries ?? []).map((discovery) => {
              const rule = discoveryRuleMap.get(discovery.signal_rule_id);
              const isCapturing = capturingId === discovery.id;

              return (
                <Card key={discovery.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-purple-500/10 text-purple-700 dark:text-purple-400">
                          {discovery.source_type === "rss" ? "RSS" : "GitHub"}
                        </span>
                        {rule && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {rule.name}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                        {discovery.title}
                      </p>
                      {discovery.summary && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                          {discovery.summary}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <a href={discovery.source_uri} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-primary-600 dark:text-primary-400 hover:underline">
                          {t("signals.source")}
                        </a>
                        {discovery.published_at && (
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {formatDate(discovery.published_at)}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button variant="text" size="sm" onClick={() => handleCapture(discovery)}
                      loading={isCapturing}>
                      {t("captures.newCapture")}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
