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

/** Supabase / fetch aborts that are expected cancellations — not all runtimes set `name` consistently. */
function shouldSuppressUnhandledAbort(reason: unknown): boolean {
  if (reason == null) return false;
  try {
    if (typeof DOMException !== "undefined" && reason instanceof DOMException && reason.name === "AbortError") {
      return true;
    }
  } catch {
    /* ignore */
  }
  if (typeof reason === "object" && reason !== null && "name" in reason) {
    const n = String((reason as { name: unknown }).name);
    if (n === "AbortError") return true;
  }
  const msg =
    typeof reason === "object" && reason !== null && "message" in reason
      ? String((reason as { message: unknown }).message)
      : "";
  const str = String(reason);
  return (
    msg.includes("signal is aborted") ||
    msg.includes("aborted without reason") ||
    msg.includes("The user aborted a request") ||
    msg.includes("The operation was aborted") ||
    str.includes("AbortError")
  );
}

/**
 * Chrome DevTools logs "[Violation] …" and extension content scripts via console.
 * We cannot remove true main-thread work; we only soften noisy, non-actionable lines in production.
 * Does not patch console.error (real failures should still surface).
 */
function installProdConsoleNoiseFilter(): void {
  if (import.meta.env.DEV) return;
  const isNoise = (s: string) =>
    s.includes("[Violation]") ||
    /content script:/i.test(s) ||
    (/\bcontent loaded\b/i.test(s) && (/\bindex\.js\b/i.test(s) || s.length < 48));

  const wrap = (method: "warn" | "info" | "debug" | "log") => {
    const orig = console[method].bind(console) as (...args: unknown[]) => void;
    (console as unknown as Record<string, unknown>)[method] = (...args: unknown[]) => {
      const flat = args.map((a) => (typeof a === "string" ? a : JSON.stringify(a))).join(" ");
      if (isNoise(flat)) return;
      if (args.some((a) => typeof a === "string" && isNoise(a))) return;
      orig(...args);
    };
  };
  wrap("warn");
  wrap("info");
  wrap("debug");
  wrap("log");
}

installProdConsoleNoiseFilter();

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

  // Expected cancellations (Supabase lock races, fetch timeouts, voice TTS abort) —
  // prevent noisy "Uncaught (in promise) AbortError" when the runtime does not attach .catch.
  if (shouldSuppressUnhandledAbort(e.reason)) {
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

// Boot observability after first paint so the landing page bundle stays under
// our Lighthouse perf budget (.cursor/rules/04-perf-seo-gate.mdc). Both
// modules are no-ops when their env keys (VITE_SENTRY_DSN / VITE_POSTHOG_KEY)
// are not configured, so this is safe in dev and CI.
if (typeof window !== "undefined") {
  const boot = () => {
    Promise.all([
      import("./observability/sentry").then((m) => m.bootSentryWeb()).catch(() => {}),
      import("./observability/analytics").then((m) => m.bootAnalytics()).catch(() => {}),
      // CWV listeners run after analytics so the very first metric event
      // emitted has the SDK ready and doesn't get queued. Lazy-imported so
      // the `web-vitals` library doesn't bloat the main bundle.
      import("./observability/web-vitals").then((m) => m.bootWebVitals()).catch(() => {}),
    ]);
  };
  if ("requestIdleCallback" in window) {
    (window as Window & { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(boot);
  } else {
    setTimeout(boot, 1500);
  }
}