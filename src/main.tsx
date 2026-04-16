import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { PowerSyncProvider } from "./lib/PowerSyncProvider";
import { AuthProvider } from "./lib/AuthProvider";
import { initDeepLinkHandler } from "./lib/deep-link";

// Initialize deep-link handler for OAuth callbacks
initDeepLinkHandler();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <AuthProvider>
      <PowerSyncProvider>
        <App />
      </PowerSyncProvider>
    </AuthProvider>
  </React.StrictMode>,
);
