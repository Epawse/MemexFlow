import { useState } from "react";

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          MemexFlow
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
          Phase 0: Foundation Setup
        </p>
        <button
          onClick={() => setCount((count) => count + 1)}
          className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
        >
          Count: {count}
        </button>
      </div>
    </div>
  );
}

export default App;
