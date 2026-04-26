# Quantum Adapter SDK (Q-011)

This SDK contract defines how to add a new optimization adapter to the provider rail while preserving fallback safety and replay evidence.

## Required Contract

Implement `OptimizationProviderContract` from `src/contracts/domains/optimization-provider-contract.ts`:

- `providerId`: one of `classical-local`, `classical-cloud`, `quantum-origin-pilot`
- `enabled`: runtime toggle
- `execute(request)`: returns deterministic `OptimizationResultContract`

Every result must include:

- `solverType`
- `solverVersion`
- `runtimeMs`
- `confidence`
- `reproducibilityToken`
- `recommendationSummary`
- `advisoryOnly`

## Safety Requirements

1. Keep quantum adapters advisory-first until production parity is verified.
2. Always run through `OptimizationProviderRail.executeWithFallback()` in production paths.
3. Enable shadow mode with:
   - `shadowBaselineProviderId=classical-local`
   - `shadowProviderId=quantum-origin-pilot`
4. Export shadow comparison artifacts for operator audit.

## Config Toggles

Use environment variables:

- `OPTIMIZER_CLASSICAL_LOCAL_ENABLED`
- `OPTIMIZER_CLASSICAL_CLOUD_ENABLED`
- `OPTIMIZER_QUANTUM_PILOT_ENABLED`
- `OPTIMIZER_CLOUD_CONFIDENCE_BIAS`
- `OPTIMIZER_QUANTUM_PILOT_LIVE_ENABLED`
- `OPTIMIZER_QUANTUM_PILOT_EXTERNAL_URL`
- `OPTIMIZER_QUANTUM_PILOT_API_KEY`
- `OPTIMIZER_QUANTUM_PILOT_TIMEOUT_MS`

## Live Endpoint Mode

When `OPTIMIZER_QUANTUM_PILOT_LIVE_ENABLED=true` and `OPTIMIZER_QUANTUM_PILOT_EXTERNAL_URL` is set,
the quantum-origin provider will POST the optimization request to your external solver endpoint.

Expected request payload:

- `requestId`
- `workspaceId`
- `objective`
- `constraints`
- `createdAt`

Expected response fields (best effort, with safe fallbacks if omitted):

- `resultId`
- `solverType`
- `solverVersion`
- `runtimeMs`
- `costEstimate`
- `confidence`
- `reproducibilityToken`
- `recommendationSummary`

Notes:

1. Live endpoint mode remains advisory-only (`advisoryOnly: true`).
2. If the endpoint errors or times out, rail fallback and shadow safety behavior remain unchanged.
3. `OPTIMIZER_QUANTUM_PILOT_TIMEOUT_MS` enforces request timeout.

The reference loader is in `src/orchestration/optimization-adapters.ts`.

## Reference Example

See `src/orchestration/examples/quantum-origin-pilot-adapter.example.ts`.
