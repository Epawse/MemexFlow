import { PowerSyncContext } from '@powersync/react';
import { ReactNode, useEffect, useState } from 'react';
import { powerSyncDb, initPowerSync } from './powersync';

interface PowerSyncProviderProps {
  children: ReactNode;
}

export function PowerSyncProvider({ children }: PowerSyncProviderProps) {
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Skip PowerSync initialization if URL not configured
    const powersyncUrl = import.meta.env.VITE_POWERSYNC_URL;
    if (!powersyncUrl) {
      console.warn('VITE_POWERSYNC_URL not configured, skipping PowerSync initialization');
      setInitialized(true);
      return;
    }

    initPowerSync()
      .then(() => setInitialized(true))
      .catch((err) => {
        console.error('PowerSync initialization error:', err);
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
          <p className="text-sm text-red-600 mt-2">
            Check console for details
          </p>
        </div>
      </div>
    );
  }

  if (!initialized) {
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
    <PowerSyncContext.Provider value={powerSyncDb}>
      {children}
    </PowerSyncContext.Provider>
  );
}
