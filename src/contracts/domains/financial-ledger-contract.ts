import type { ContractEntityIdentity } from '../core/entity-contract';

export type FinancialLedgerDirection = 'debit' | 'credit';

export interface FinancialLedgerPostingContract extends ContractEntityIdentity {
  entityKind: 'financial_posting';
  postingId: string;
  accountId: string;
  amountMinor: number;
  currency: string;
  direction: FinancialLedgerDirection;
  category: string;
  externalReference: string;
  occurredAt: string;
  immutableHash: string;
}

export interface FinancialLedgerBatchContract {
  batchId: string;
  workspaceId: string;
  generatedAt: string;
  postings: FinancialLedgerPostingContract[];
}

export function assertFinancialLedgerPosting(posting: FinancialLedgerPostingContract): string[] {
  const errors: string[] = [];
  if (!posting.postingId?.trim()) errors.push('Missing postingId');
  if (!posting.accountId?.trim()) errors.push('Missing accountId');
  if (!Number.isInteger(posting.amountMinor) || posting.amountMinor <= 0) errors.push('Invalid amountMinor');
  if (!posting.currency?.trim()) errors.push('Missing currency');
  if (posting.direction !== 'debit' && posting.direction !== 'credit') errors.push('Invalid direction');
  if (!posting.externalReference?.trim()) errors.push('Missing externalReference');
  if (!posting.immutableHash?.trim()) errors.push('Missing immutableHash');
  return errors;
}

export function assertFinancialLedgerBatch(batch: FinancialLedgerBatchContract): string[] {
  const errors: string[] = [];
  if (!batch.batchId?.trim()) errors.push('Missing batchId');
  if (!batch.workspaceId?.trim()) errors.push('Missing workspaceId');
  if (!batch.generatedAt?.trim()) errors.push('Missing generatedAt');
  if (!Array.isArray(batch.postings) || batch.postings.length === 0) errors.push('Missing postings');
  for (const posting of batch.postings || []) {
    const postingErrors = assertFinancialLedgerPosting(posting);
    errors.push(...postingErrors.map((message) => `${posting.postingId || 'unknown'}: ${message}`));
  }
  return errors;
}
