import { supabase } from './lib/supabase';
import { useState, useEffect } from 'react';

function App() {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Test Supabase connection
    const testConnection = async () => {
      try {
        const { data, error } = await supabase.from('projects').select('count');
        if (error) throw error;
        setConnected(true);
      } catch (error) {
        console.error('Supabase connection error:', error);
        setConnected(false);
      } finally {
        setLoading(false);
      }
    };

    testConnection();
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          MemexFlow
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
          Phase 0: Foundation Setup
        </p>

        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2">
            <div className={`w-3 h-3 rounded-full ${loading ? 'bg-yellow-500 animate-pulse' : connected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {loading ? 'Connecting to Supabase...' : connected ? 'Supabase Connected' : 'Supabase Connection Failed'}
            </span>
          </div>

          {connected && (
            <p className="text-sm text-green-600 dark:text-green-400">
              ✓ Database schema deployed
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
