import { PowerSyncContext } from "@powersync/react";
import type { AbstractPowerSyncDatabase } from "@powersync/common";
import { ReactNode, useEffect, useRef, useState } from "react";
import { getPowerSyncDb, initPowerSync } from "./powersync";

interface PowerSyncProviderProps {
  children: ReactNode;
}

export function PowerSyncProvider({ children }: PowerSyncProviderProps) {
  const [db, setDb] = useState<AbstractPowerSyncDatabase | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    const powersyncUrl = import.meta.env.VITE_POWERSYNC_URL;
    if (!powersyncUrl) {
      console.warn(
        "[PowerSync] VITE_POWERSYNC_URL not configured, skipping initialization",
      );
      return;
    }

    if (initialized.current) return;
    initialized.current = true;

    initPowerSync()
      .then(() => {
        const powerSyncDb = getPowerSyncDb();
        setDb(powerSyncDb);
      })
      .catch((err) => {
        console.error("[PowerSync] Initialization error:", err);
        setError(err);
      });
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-50">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-900 mb-2">
            PowerSync Error
          </h2>
          <p className="text-red-700">{error.message}</p>
          <p className="text-sm text-red-600 mt-2">Check console for details</p>
        </div>
      </div>
    );
  }

  if (!db && import.meta.env.VITE_POWERSYNC_URL) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Initializing local database...</p>
        </div>
      </div>
    );
  }

  return (
    <PowerSyncContext.Provider value={db as AbstractPowerSyncDatabase}>
      {children}
    </PowerSyncContext.Provider>
  );
}
