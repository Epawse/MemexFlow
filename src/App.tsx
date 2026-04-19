import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { useAuth } from "./lib/AuthProvider";
import { LoginPage } from "./features/auth/LoginPage";
import { DashboardLayout } from "./shared/components/DashboardLayout";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { CapturesPage } from "./features/captures/CapturesPage";
import { CaptureDetailPage } from "./features/captures/CaptureDetailPage";
import { ProjectsPage } from "./features/projects/ProjectsPage";
import { ProjectDetailPage } from "./features/projects/ProjectDetailPage";
import { MemoriesPage } from "./features/memories/MemoriesPage";
import { BriefsPage } from "./features/briefs/BriefsPage";
import { BriefDetailPage } from "./features/briefs/BriefDetailPage";
import { SignalsPage } from "./features/signals/SignalsPage";
import { RecallPage } from "./features/recall/RecallPage";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="bottom-right"
        richColors
        closeButton
        toastOptions={{ duration: 4000 }}
      />
      <Routes>
        <Route
          element={
            <AuthGuard>
              <DashboardLayout />
            </AuthGuard>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="captures" element={<CapturesPage />} />
          <Route path="captures/:id" element={<CaptureDetailPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/:id" element={<ProjectDetailPage />} />
          <Route path="memories" element={<MemoriesPage />} />
          <Route path="briefs" element={<BriefsPage />} />
          <Route path="briefs/:id" element={<BriefDetailPage />} />
          <Route path="signals" element={<SignalsPage />} />
          <Route path="recall" element={<RecallPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
