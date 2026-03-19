export type IntegrationProvider = 'native' | 'universal' | 'community';

export interface IntegrationConnector {
  id: string;
  name: string;
  provider: IntegrationProvider;
  authType?: 'oauth2' | 'api_key' | 'none';
  defaultScopes?: string[];
  category: 'communication' | 'productivity' | 'engineering' | 'crm' | 'finance' | 'data' | 'automation' | 'ai' | 'support';
  description: string;
  popular?: boolean;
}

export interface IntegrationRecipe {
  id: string;
  name: string;
  description: string;
  connectorIds: string[];
}

export const INTEGRATION_CONNECTORS: IntegrationConnector[] = [
  { id: 'gmail', name: 'Gmail', provider: 'native', authType: 'oauth2', defaultScopes: ['mail.read', 'mail.send'], category: 'communication', description: 'Send and triage task emails.', popular: true },
  { id: 'outlook', name: 'Outlook', provider: 'native', authType: 'oauth2', defaultScopes: ['mail.read', 'mail.send', 'calendar.read'], category: 'communication', description: 'Route task communication through Microsoft 365.' },
  { id: 'slack', name: 'Slack', provider: 'native', authType: 'oauth2', defaultScopes: ['channels:read', 'chat:write'], category: 'communication', description: 'Post updates, blockers, and approvals.', popular: true },
  { id: 'discord', name: 'Discord', provider: 'native', authType: 'oauth2', defaultScopes: ['guilds', 'messages.write'], category: 'communication', description: 'Notify channels and capture feedback.' },
  { id: 'twilio', name: 'Twilio', provider: 'native', authType: 'api_key', defaultScopes: ['sms.send', 'voice.call'], category: 'communication', description: 'Send SMS and voice alerts for urgent tasks.' },
  { id: 'google-calendar', name: 'Google Calendar', provider: 'native', authType: 'oauth2', defaultScopes: ['calendar.read', 'calendar.write'], category: 'productivity', description: 'Convert due dates into schedule events.', popular: true },
  { id: 'notion', name: 'Notion', provider: 'native', authType: 'oauth2', defaultScopes: ['pages.read', 'pages.write'], category: 'productivity', description: 'Sync task context with docs and wikis.', popular: true },
  { id: 'airtable', name: 'Airtable', provider: 'native', authType: 'oauth2', defaultScopes: ['records.read', 'records.write'], category: 'productivity', description: 'Mirror tasks in structured tables.' },
  { id: 'google-sheets', name: 'Google Sheets', provider: 'native', authType: 'oauth2', defaultScopes: ['sheets.read', 'sheets.write'], category: 'data', description: 'Export and analyze task metrics.' },
  { id: 'linear', name: 'Linear', provider: 'native', authType: 'oauth2', defaultScopes: ['issues.read', 'issues.write'], category: 'engineering', description: 'Track linked issues and execution status.' },
  { id: 'jira', name: 'Jira', provider: 'native', authType: 'oauth2', defaultScopes: ['issues.read', 'issues.write'], category: 'engineering', description: 'Create tickets from project nodes.', popular: true },
  { id: 'github', name: 'GitHub', provider: 'native', authType: 'oauth2', defaultScopes: ['repo.read', 'repo.write', 'checks.read'], category: 'engineering', description: 'Track PRs, CI, and issue velocity.', popular: true },
  { id: 'gitlab', name: 'GitLab', provider: 'native', authType: 'oauth2', defaultScopes: ['api.read', 'api.write'], category: 'engineering', description: 'Trigger pipelines and track MRs.' },
  { id: 'bitbucket', name: 'Bitbucket', provider: 'native', authType: 'oauth2', defaultScopes: ['repository.read', 'repository.write'], category: 'engineering', description: 'Sync repo tasks with pipelines.' },
  { id: 'hubspot', name: 'HubSpot', provider: 'native', authType: 'oauth2', defaultScopes: ['crm.read', 'crm.write'], category: 'crm', description: 'Bridge delivery work with deals.', popular: true },
  { id: 'salesforce', name: 'Salesforce', provider: 'native', authType: 'oauth2', defaultScopes: ['sobjects.read', 'sobjects.write'], category: 'crm', description: 'Sync account-level execution plans.' },
  { id: 'pipedrive', name: 'Pipedrive', provider: 'native', authType: 'oauth2', defaultScopes: ['deals.read', 'deals.write'], category: 'crm', description: 'Connect task outcomes to pipeline stage.' },
  { id: 'zendesk', name: 'Zendesk', provider: 'native', authType: 'oauth2', defaultScopes: ['tickets.read', 'tickets.write'], category: 'support', description: 'Link customer tickets to remediation tasks.' },
  { id: 'intercom', name: 'Intercom', provider: 'native', authType: 'oauth2', defaultScopes: ['conversations.read', 'conversations.write'], category: 'support', description: 'Push task updates to customer threads.' },
  { id: 'stripe', name: 'Stripe', provider: 'native', authType: 'api_key', defaultScopes: ['payments.read', 'customers.read'], category: 'finance', description: 'Trigger finance workflows from billing events.', popular: true },
  { id: 'quickbooks', name: 'QuickBooks', provider: 'native', authType: 'oauth2', defaultScopes: ['accounting.read', 'accounting.write'], category: 'finance', description: 'Sync accounting follow-ups automatically.' },
  { id: 'xero', name: 'Xero', provider: 'native', authType: 'oauth2', defaultScopes: ['accounting.transactions', 'contacts.read'], category: 'finance', description: 'Track invoicing tasks and reconciliations.' },
  { id: 'supabase', name: 'Supabase', provider: 'native', authType: 'api_key', defaultScopes: ['db.read', 'db.write'], category: 'data', description: 'Read and write operational data quickly.' },
  { id: 'postgresql', name: 'PostgreSQL', provider: 'universal', authType: 'api_key', defaultScopes: ['sql.read', 'sql.write'], category: 'data', description: 'Run SQL-backed task automations.' },
  { id: 'mysql', name: 'MySQL', provider: 'universal', authType: 'api_key', defaultScopes: ['sql.read', 'sql.write'], category: 'data', description: 'Connect existing systems with SQL triggers.' },
  { id: 's3', name: 'S3 Storage', provider: 'universal', authType: 'api_key', defaultScopes: ['objects.read', 'objects.write'], category: 'data', description: 'Archive artifacts and generated outputs.' },
  { id: 'webhook', name: 'Webhook', provider: 'universal', authType: 'none', defaultScopes: ['invoke'], category: 'automation', description: 'Call any external service endpoint.', popular: true },
  { id: 'http-api', name: 'HTTP API', provider: 'universal', authType: 'api_key', defaultScopes: ['request.send'], category: 'automation', description: 'Universal REST connector for any tool.', popular: true },
  { id: 'email-parser', name: 'Email Parser', provider: 'universal', authType: 'none', defaultScopes: ['parse'], category: 'automation', description: 'Turn inbound emails into task updates.' },
  { id: 'csv-import', name: 'CSV Import', provider: 'universal', authType: 'none', defaultScopes: ['import'], category: 'automation', description: 'Bulk ingest tasks and mappings from CSV.' },
  { id: 'zapier', name: 'Zapier', provider: 'community', authType: 'oauth2', defaultScopes: ['zaps.execute'], category: 'automation', description: 'Access long-tail apps via Zapier.', popular: true },
  { id: 'make', name: 'Make', provider: 'community', authType: 'oauth2', defaultScopes: ['scenarios.execute'], category: 'automation', description: 'Use advanced visual automations.' },
  { id: 'n8n', name: 'n8n', provider: 'community', authType: 'api_key', defaultScopes: ['workflows.execute'], category: 'automation', description: 'Bridge existing n8n flows into SyncScript.' },
  { id: 'openai', name: 'OpenAI', provider: 'native', authType: 'api_key', defaultScopes: ['responses.create'], category: 'ai', description: 'Apply language and tool-calling tasks.' },
  { id: 'claude', name: 'Claude', provider: 'native', authType: 'api_key', defaultScopes: ['messages.create'], category: 'ai', description: 'Use long-context reasoning for workflows.' },
  { id: 'openclaw-agent', name: 'OpenClaw Agent Runtime', provider: 'native', authType: 'oauth2', defaultScopes: ['agent.invoke', 'agent.monitor'], category: 'ai', description: 'Attach OpenClaw agent actions to tasks.', popular: true },
];

export const INTEGRATION_RECIPES: IntegrationRecipe[] = [
  {
    id: 'recipe-launch-ops',
    name: 'Launch Ops',
    description: 'Coordinate launch tasks with comms, issues, and release checkpoints.',
    connectorIds: ['slack', 'github', 'google-calendar', 'notion'],
  },
  {
    id: 'recipe-sales-followup',
    name: 'Sales Follow-Up',
    description: 'Keep deal execution synced between pipeline and delivery.',
    connectorIds: ['hubspot', 'gmail', 'google-calendar', 'slack'],
  },
  {
    id: 'recipe-finance-control',
    name: 'Finance Control',
    description: 'Monitor revenue events, accounting actions, and alerts.',
    connectorIds: ['stripe', 'quickbooks', 'slack', 'google-sheets'],
  },
  {
    id: 'recipe-support-escalation',
    name: 'Support Escalation',
    description: 'Route customer incidents into engineering execution fast.',
    connectorIds: ['zendesk', 'slack', 'jira', 'discord'],
  },
  {
    id: 'recipe-agent-automation',
    name: 'Agent Automation',
    description: 'OpenClaw-style autonomous runbook actions and callbacks.',
    connectorIds: ['openclaw-agent', 'webhook', 'http-api', 'notion'],
  },
];

export function filterIntegrationConnectors(
  connectors: IntegrationConnector[],
  query: string,
  category: string,
  provider: string,
): IntegrationConnector[] {
  const clean = query.trim().toLowerCase();
  return connectors.filter((connector) => {
    if (category !== 'all' && connector.category !== category) return false;
    if (provider !== 'all' && connector.provider !== provider) return false;
    if (!clean) return true;
    return (
      connector.name.toLowerCase().includes(clean) ||
      connector.description.toLowerCase().includes(clean) ||
      connector.id.toLowerCase().includes(clean)
    );
  });
}

