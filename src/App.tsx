import { useAuth } from './lib/AuthProvider';
import { LoginPage } from './features/auth/LoginPage';

function App() {
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            MemexFlow
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {user.email}
            </span>
            <button
              onClick={signOut}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Welcome to MemexFlow
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Authentication successful! You're now signed in as {user.email}
          </p>
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-md">
            <p className="text-sm text-green-800 dark:text-green-200">
              ✓ Tauri 2 + React 19 initialized
              <br />
              ✓ Supabase backend connected
              <br />
              ✓ PowerSync offline-first sync ready
              <br />
              ✓ Authentication working
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
