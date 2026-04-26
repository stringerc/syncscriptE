export interface FinancialProviderAccount {
  providerAccountId: string;
  name: string;
  type: 'checking' | 'savings' | 'credit' | 'investment' | 'loan' | 'other';
  subtype?: string;
  currency: string;
  balance: number;
  institution?: string;
  mask?: string;
}

export interface FinancialProviderTransaction {
  providerTransactionId: string;
  providerAccountId: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  category: string;
  description: string;
  merchant?: string;
  occurredAt: string;
  pending?: boolean;
}

export interface FinancialLinkTokenResult {
  linkToken: string;
  expiration?: string;
}

export interface FinancialTokenExchangeResult {
  accessToken: string;
  itemId?: string;
  institutionName?: string;
}

export interface FinancialSyncResult {
  accounts: FinancialProviderAccount[];
  transactions: FinancialProviderTransaction[];
}

export interface FinancialProviderAdapter {
  readonly id: string;
  readonly displayName: string;
  isConfigured(): boolean;
  createLinkToken(userId: string): Promise<FinancialLinkTokenResult>;
  exchangePublicToken(publicToken: string): Promise<FinancialTokenExchangeResult>;
  sync(accessToken: string): Promise<FinancialSyncResult>;
}
