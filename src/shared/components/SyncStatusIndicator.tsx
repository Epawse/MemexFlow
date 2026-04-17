import { useStatus } from "@powersync/react";
import { getPowerSyncDb } from "../../lib/powersync";

export function SyncStatusIndicator() {
  const db = getPowerSyncDb();
  if (!db) return null;

  return <SyncStatusInner />;
}

function SyncStatusInner() {
  const status = useStatus();

  // Connecting: PowerSync is trying to establish a connection
  if (status.connecting || (!status.connected && !status.hasSynced)) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-amber-600 dark:text-amber-400">
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        Connecting...
      </div>
    );
  }

  // Was connected before, now disconnected
  if (!status.connected) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400">
        <span className="w-2 h-2 rounded-full bg-gray-400" />
        Offline
      </div>
    );
  }

  // Connected and actively syncing
  if (status.dataFlowStatus?.uploading || status.dataFlowStatus?.downloading) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-primary-600 dark:text-primary-400">
        <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
        Syncing...
      </div>
    );
  }

  // Connected and synced
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-green-700 dark:text-green-400">
      <span className="w-2 h-2 rounded-full bg-green-500" />
      Synced
    </div>
  );
}
