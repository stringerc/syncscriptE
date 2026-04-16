import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App.tsx";
import "./index.css";
import { registerSyncScriptServiceWorker } from "./pwa/register-sw";

declare global {
  interface Window {
    __SYNCSCRIPT_BUILD__?: { sha: string };
  }
}

if (typeof window !== "undefined") {
  window.__SYNCSCRIPT_BUILD__ = {
    sha: String(import.meta.env.VITE_BUILD_SHA || ""),
  };
}

registerSyncScriptServiceWorker();

// Auto-recover from stale chunk errors after a new deployment.
// When Vercel deploys new code, old chunk filenames are invalidated.
// A cached index.html may still reference them, causing MIME-type errors.
window.addEventListener("vite:preloadError", () => {
  window.location.reload();
});
window.addEventListener("error", (e) => {
  if (
    e.message?.includes("Failed to fetch dynamically imported module") ||
    e.message?.includes("Failed to load module script")
  ) {
    if (!sessionStorage.getItem("chunk_reload")) {
      sessionStorage.setItem("chunk_reload", "1");
      window.location.reload();
    }
  }
});
window.addEventListener("unhandledrejection", (e) => {
  const msg = e.reason?.message || String(e.reason);
  if (
    msg.includes("Failed to fetch dynamically imported module") ||
    msg.includes("Importing a module script failed")
  ) {
    if (!sessionStorage.getItem("chunk_reload")) {
      sessionStorage.setItem("chunk_reload", "1");
      window.location.reload();
    }
  }
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);