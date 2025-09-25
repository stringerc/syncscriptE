import { PlaidApi, PlaidEnvironments, Configuration, LinkTokenCreateRequest, LinkTokenCreateResponse, ItemPublicTokenExchangeRequest, ItemPublicTokenExchangeResponse, AccountsGetRequest, AccountsGetResponse, TransactionsGetRequest, TransactionsGetResponse } from 'plaid';
import { logger } from '../utils/logger';

// Plaid configuration
const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID || '68af6e15d275380025927fe9';
const PLAID_SECRET = process.env.PLAID_SECRET || '4dfa431d33af231fbff488f0183a32'; // Using sandbox
const PLAID_ENV = process.env.PLAID_ENV || 'sandbox';

logger.info('Plaid configuration loaded', {
  clientId: PLAID_CLIENT_ID,
  secret: PLAID_SECRET.substring(0, 10) + '...',
  environment: PLAID_ENV
});

// Initialize Plaid client
let plaidClient: PlaidApi;

try {
  const configuration = new Configuration({
    basePath: PlaidEnvironments[PLAID_ENV as keyof typeof PlaidEnvironments],
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': PLAID_CLIENT_ID,
        'PLAID-SECRET': PLAID_SECRET,
      },
    },
  });

  plaidClient = new PlaidApi(configuration);
  logger.info('Plaid client initialized successfully', { 
    environment: PLAID_ENV,
    basePath: PlaidEnvironments[PLAID_ENV as keyof typeof PlaidEnvironments]
  });
} catch (error: any) {
  logger.error('Failed to initialize Plaid client', { 
    error: error.message,
    environment: PLAID_ENV,
    clientId: PLAID_CLIENT_ID
  });
  throw error;
}

export class PlaidService {
  /**
   * Create a link token for the frontend
   */
  static async createLinkToken(userId: string): Promise<string> {
    try {
      logger.info('Starting createLinkToken', { userId });
      
      // Test if plaidClient is properly initialized
      if (!plaidClient) {
        logger.error('Plaid client is not initialized');
        throw new Error('Plaid client is not initialized');
      }
      
      logger.info('Plaid client is available', { userId });
      
      const request: LinkTokenCreateRequest = {
        user: {
          client_user_id: userId,
        },
        client_name: 'SyncScript',
        products: ['transactions'],
        country_codes: ['US'],
        language: 'en',
        // Remove webhook for now to test if that's causing issues
        // webhook: process.env.PLAID_WEBHOOK_URL || 'https://your-domain.com/webhook/plaid',
      };
      
      logger.info('Request object created', { userId, request });

      logger.info('Making Plaid API request', { 
        userId, 
        request: request,
        clientId: PLAID_CLIENT_ID,
        environment: PLAID_ENV
      });
      
      let response: LinkTokenCreateResponse;
      try {
        response = await plaidClient.linkTokenCreate(request);
        logger.info('Plaid API call successful', { userId });
      } catch (apiError: any) {
        logger.error('Plaid API call failed', { 
          error: apiError.message,
          status: apiError.response?.status,
          data: apiError.response?.data,
          userId
        });
        throw apiError;
      }
      
      logger.info('Plaid API response received', { 
        userId, 
        responseKeys: Object.keys(response),
        response: response,
        linkToken: response.link_token,
        hasLinkToken: !!response.link_token
      });
      
      if (!response.link_token) {
        logger.error('No link_token in Plaid response', { response });
        throw new Error('No link_token received from Plaid');
      }
      
      logger.info('Link token created successfully', { userId, linkToken: response.link_token.substring(0, 20) + '...' });
      
      return response.link_token;
    } catch (error: any) {
      logger.error('Failed to create link token - Full Error Details', { 
        error: error.message,
        errorStack: error.stack,
        errorName: error.name,
        userId,
        response: error.response?.data,
        status: error.response?.status,
        config: {
          clientId: PLAID_CLIENT_ID,
          environment: PLAID_ENV
        }
      });
      throw new Error(`Failed to create link token: ${error.response?.data?.error_message || error.message}`);
    }
  }

  /**
   * Exchange public token for access token
   */
  static async exchangePublicToken(publicToken: string): Promise<string> {
    try {
      const request: ItemPublicTokenExchangeRequest = {
        public_token: publicToken,
      };

      const response: ItemPublicTokenExchangeResponse = await plaidClient.itemPublicTokenExchange(request);
      
      logger.info('Public token exchanged', { accessToken: response.access_token });
      
      return response.access_token;
    } catch (error: any) {
      logger.error('Failed to exchange public token', { error: error.message });
      throw new Error(`Failed to exchange public token: ${error.message}`);
    }
  }

  /**
   * Get accounts for an access token
   */
  static async getAccounts(accessToken: string): Promise<any[]> {
    try {
      const request: AccountsGetRequest = {
        access_token: accessToken,
      };

      const response: AccountsGetResponse = await plaidClient.accountsGet(request);
      
      logger.info('Accounts retrieved', { 
        accountCount: response.accounts.length,
        accessToken: accessToken.substring(0, 10) + '...'
      });
      
      return response.accounts.map(account => ({
        accountId: account.account_id,
        name: account.name,
        type: account.type,
        subtype: account.subtype,
        balance: account.balances.current || 0,
        available: account.balances.available || 0,
        limit: account.balances.limit || null,
        currency: account.balances.iso_currency_code || 'USD',
        mask: account.mask,
        officialName: account.official_name,
      }));
    } catch (error: any) {
      logger.error('Failed to get accounts', { error: error.message });
      throw new Error(`Failed to get accounts: ${error.message}`);
    }
  }

  /**
   * Get transactions for an access token
   */
  static async getTransactions(accessToken: string, startDate: Date, endDate: Date): Promise<any[]> {
    try {
      const request: TransactionsGetRequest = {
        access_token: accessToken,
        start_date: startDate,
        end_date: endDate,
      };

      const response: TransactionsGetResponse = await plaidClient.transactionsGet(request);
      
      logger.info('Transactions retrieved', { 
        transactionCount: response.transactions.length,
        accessToken: accessToken.substring(0, 10) + '...'
      });
      
      return response.transactions.map(transaction => ({
        transactionId: transaction.transaction_id,
        accountId: transaction.account_id,
        amount: transaction.amount,
        date: transaction.date,
        name: transaction.name,
        merchantName: transaction.merchant_name,
        category: transaction.category,
        subcategory: transaction.subcategory,
        accountOwner: transaction.account_owner,
        pending: transaction.pending,
        isoCurrencyCode: transaction.iso_currency_code,
        unofficialCurrencyCode: transaction.unofficial_currency_code,
      }));
    } catch (error: any) {
      logger.error('Failed to get transactions', { error: error.message });
      throw new Error(`Failed to get transactions: ${error.message}`);
    }
  }

  /**
   * Get account balance for a specific account
   */
  static async getAccountBalance(accessToken: string, accountId: string): Promise<number> {
    try {
      const accounts = await this.getAccounts(accessToken);
      const account = accounts.find(acc => acc.accountId === accountId);
      
      if (!account) {
        throw new Error('Account not found');
      }
      
      return account.balance;
    } catch (error: any) {
      logger.error('Failed to get account balance', { error: error.message, accountId });
      throw new Error(`Failed to get account balance: ${error.message}`);
    }
  }

  /**
   * Update account balances for all connected accounts
   */
  static async updateAccountBalances(userId: string): Promise<void> {
    try {
      // This would typically involve:
      // 1. Getting all user's financial accounts from database
      // 2. For each account, getting the current balance from Plaid
      // 3. Updating the database with new balances
      
      logger.info('Account balances update requested', { userId });
      
      // Implementation would go here
      // For now, just log the request
      
    } catch (error: any) {
      logger.error('Failed to update account balances', { error: error.message, userId });
      throw new Error(`Failed to update account balances: ${error.message}`);
    }
  }
}

export default PlaidService;
