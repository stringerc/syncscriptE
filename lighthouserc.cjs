/**
 * Lighthouse CI — landing `/` ritual (see `.github/workflows/lighthouse-monthly.yml`).
 * Targets align with `.cursor/rules/04-perf-seo-gate.mdc` (Perf warn ≥0.95 in CI — perf is noisy).
 */
const landingUrl = process.env.LHCI_URL || 'https://www.syncscript.app/';

module.exports = {
  ci: {
    collect: {
      url: [landingUrl],
      numberOfRuns: 3,
      settings: {
        preset: 'desktop',
        ...(process.env.LHCI_CHROME_PATH || process.env.CHROME_PATH
          ? { chromePath: process.env.LHCI_CHROME_PATH || process.env.CHROME_PATH }
          : {}),
      },
    },
    assert: {
      assertions: {
        'categories:accessibility': ['error', { minScore: 1 }],
        'categories:best-practices': ['error', { minScore: 1 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        // Tier 0 C fix: was `warn` (never blocked anything). Now `error` so a
        // perf regression below 95 fails the LHCI run. Threshold matches
        // `.cursor/rules/04-perf-seo-gate.mdc` policy. If this becomes too
        // flaky on the monthly run, raise `numberOfRuns` and use `aggregationMethod: 'optimistic'`
        // before lowering the gate.
        'categories:performance': ['error', { minScore: 0.95 }],
      },
    },
  },
};
