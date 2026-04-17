import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { PowerSyncProvider } from "./lib/PowerSyncProvider";
import { AuthProvider } from "./lib/AuthProvider";
import { ThemeProvider } from "./shared/hooks/useTheme";
import { ErrorBoundary } from "./shared/components/ErrorBoundary";
import { initDeepLinkHandler } from "./lib/deep-link";

initDeepLinkHandler();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <PowerSyncProvider>
            <App />
          </PowerSyncProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
