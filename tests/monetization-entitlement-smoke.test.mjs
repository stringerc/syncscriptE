import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
const protectedRoute = readFileSync(new URL('../src/components/ProtectedRoute.tsx', import.meta.url), 'utf8');
const subscriptionContext = readFileSync(new URL('../src/contexts/SubscriptionContext.tsx', import.meta.url), 'utf8');
const entitlementContract = readFileSync(new URL('../src/utils/entitlement-contract.ts', import.meta.url), 'utf8');
const scriptsRoutes = readFileSync(
  new URL('../supabase/functions/make-server-57781ad9/scripts-routes.tsx', import.meta.url),
  'utf8',
);
const stripeRoutes = readFileSync(
  new URL('../supabase/functions/make-server-57781ad9/stripe-routes.tsx', import.meta.url),
  'utf8',
);

test('EX-022 entitlement contract is centralized and normalized', () => {
  assert.match(entitlementContract, /normalizeAccessStatus/);
  assert.match(entitlementContract, /resolveEntitlementFeatures/);
  assert.match(entitlementContract, /marketplace/);
  assert.match(subscriptionContext, /normalizeAccessStatus/);
  assert.match(subscriptionContext, /LITE_TIER_LIMITS/);
});

test('EX-022 route-level entitlement gating is wired for marketplace surfaces', () => {
  assert.match(app, /SubscriptionProvider/);
  assert.match(app, /requiredEntitlement="marketplace"/);
  assert.match(app, /requiredEntitlement="integrations"/);
  assert.match(protectedRoute, /requiredEntitlement/);
  assert.match(protectedRoute, /hasEntitlementFeature/);
  assert.match(protectedRoute, /Navigate[\s\S]*\/pricing/);
});

test('EX-051 marketplace visibility + entitlement contract enforced server-side', () => {
  assert.match(scriptsRoutes, /hasMarketplaceEntitlement/);
  assert.match(scriptsRoutes, /deny_marketplace_entitlement_required/);
  assert.match(scriptsRoutes, /deny_marketplace_visibility_contract/);
  assert.match(scriptsRoutes, /\.from\('script_purchases'\)/);
  assert.match(stripeRoutes, /contractVersion/);
  assert.match(stripeRoutes, /accessType: 'free_lite'/);
  assert.match(stripeRoutes, /resolveRequestUserId/);
  assert.match(stripeRoutes, /deny_user_mismatch/);
});
