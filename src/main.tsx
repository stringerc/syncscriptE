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
    return;
  }

  // Supabase JS can surface lock-queue aborts as unhandled rejections when multiple
  // clients compete for the same auth storage lock. Prefer a single `createClient`
  // (see `utils/supabase/client.ts`). Until duplicate clients are removed, avoid
  // spamming the console for this expected cancellation.
  const r = e.reason;
  const name = r?.name ?? (r instanceof DOMException ? r.name : "");
  if (
    name === "AbortError" ||
    msg.includes("signal is aborted") ||
    msg.includes("The user aborted a request")
  ) {
    e.preventDefault();
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