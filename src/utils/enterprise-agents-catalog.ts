export type EnterpriseAgentCatalogEntry = {
  id: string;
  name: string;
  role: string;
  team: string;
};

export const ENTERPRISE_CORE_AGENTS: EnterpriseAgentCatalogEntry[] = [
  { id: 'ceo', name: 'CEO', role: 'Strategic direction and portfolio prioritization', team: 'Leadership' },
  { id: 'coo', name: 'COO', role: 'Operational systems and execution cadence', team: 'Operations' },
  { id: 'cfo', name: 'CFO', role: 'Financial planning, unit economics, and runway', team: 'Finance' },
  { id: 'cro', name: 'CRO', role: 'Revenue architecture and pipeline governance', team: 'Revenue' },
  { id: 'cmo', name: 'CMO', role: 'Demand generation and market positioning', team: 'Marketing' },
  { id: 'cto', name: 'CTO', role: 'Technical roadmap and architecture quality', team: 'Technology' },
  { id: 'ciso', name: 'CISO', role: 'Security controls and incident readiness', team: 'Security' },
  { id: 'chief_strategy_officer', name: 'Chief Strategy Officer', role: 'Cross-functional strategy synthesis', team: 'Advisory' },
  { id: 'chief_counsel', name: 'Chief Counsel', role: 'Governance, legal, and compliance strategy', team: 'Legal' },
  { id: 'atlas', name: 'Atlas', role: 'Research intelligence and signal synthesis', team: 'Research' },
  { id: 'clawd', name: 'Clawd', role: 'Engineering execution and delivery unblock', team: 'Development' },
  { id: 'scribe', name: 'Scribe', role: 'Executive communications and messaging', team: 'Content' },
  { id: 'sage', name: 'Sage', role: 'Sales strategy and close planning', team: 'Sales' },
];
