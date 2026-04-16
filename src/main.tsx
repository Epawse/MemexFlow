import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { PowerSyncProvider } from "./lib/PowerSyncProvider";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <PowerSyncProvider>
      <App />
    </PowerSyncProvider>
  </React.StrictMode>,
);
