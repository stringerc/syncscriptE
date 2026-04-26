import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const aiRouteUtil = readFileSync(new URL('../src/utils/ai-route.ts', import.meta.url), 'utf8');
const aiPanel = readFileSync(new URL('../src/components/AIAssistantPanel.tsx', import.meta.url), 'utf8');
const aiPage = readFileSync(new URL('../src/components/pages/AIAssistantPage.tsx', import.meta.url), 'utf8');
const emailPage = readFileSync(new URL('../src/components/pages/EmailHubPage.tsx', import.meta.url), 'utf8');
const financialsPage = readFileSync(new URL('../src/components/pages/FinancialsPage.tsx', import.meta.url), 'utf8');
const integrationsPage = readFileSync(new URL('../src/components/pages/IntegrationsPage.tsx', import.meta.url), 'utf8');
const floatingWidget = readFileSync(new URL('../src/components/FloatingAIChatWidget.tsx', import.meta.url), 'utf8');
const discordRoutes = readFileSync(
  new URL('../supabase/functions/make-server-57781ad9/discord-routes.tsx', import.meta.url),
  'utf8'
);

test('canonical route utility defines domain tabs and prefix builder', () => {
  assert.match(aiRouteUtil, /export type DomainTab/);
  assert.match(aiRouteUtil, /buildRoutePrefix/);
  assert.match(aiRouteUtil, /routeContextFromPath/);
  assert.match(aiRouteUtil, /goalId\?: string/);
  assert.match(aiRouteUtil, /taskId\?: string/);
  assert.match(aiRouteUtil, /workstreamId\?: string/);
  assert.match(aiRouteUtil, /contextType\?: ThreadContextType/);
  assert.match(aiRouteUtil, /buildThreadContextBindingContract/);
});

test('in-app surfaces include canonical route metadata', () => {
  assert.match(aiPanel, /buildRoutePrefix/);
  assert.match(aiPage, /routeContext/);
  assert.match(emailPage, /domainTab: 'email'/);
  assert.match(financialsPage, /domainTab: 'financials'/);
  assert.match(floatingWidget, /routeContextFromUrl/);
  assert.match(floatingWidget, /buildAgentDeepLink/);
  assert.match(floatingWidget, /navigate\(buildAgentDeepLink/);
});

test('discord routing supports hybrid commands and thread mapping', () => {
  assert.match(discordRoutes, /commandName === 'nexus'/);
  assert.match(discordRoutes, /commandName === 'tab'/);
  assert.match(discordRoutes, /commandName === 'enterprise'/);
  assert.match(discordRoutes, /commandName === 'agent'/);
  assert.match(discordRoutes, /commandName === 'agents'/);
  assert.match(discordRoutes, /ensureThreadForRoute/);
  assert.match(discordRoutes, /toDiscordInteractionKey/);
  assert.match(discordRoutes, /logDiscordTelemetry/);
});

test('integrations page includes discord onboarding guidance', () => {
  assert.match(integrationsPage, /Discord Agent Bridge/);
  assert.match(integrationsPage, /POST \/discord\/sync-commands/);
  assert.match(integrationsPage, /\/nexus prompt/);
});
