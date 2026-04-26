import type {
  FinancialProviderAdapter,
  FinancialProviderAccount,
  FinancialProviderTransaction,
  FinancialLinkTokenResult,
  FinancialSyncResult,
  FinancialTokenExchangeResult,
} from "./financial-provider.ts";

const PLAID_BASE_URL = Deno.env.get("PLAID_ENV") === "production"
  ? "https://production.plaid.com"
  : "https://sandbox.plaid.com";

function getPlaidCredentials() {
  return {
    clientId: Deno.env.get("PLAID_CLIENT_ID") || "",
    secret: Deno.env.get("PLAID_SECRET") || "",
  };
}

function mapPlaidAccountType(type?: string): FinancialProviderAccount["type"] {
  if (type === "depository") return "checking";
  if (type === "credit") return "credit";
  if (type === "investment") return "investment";
  if (type === "loan") return "loan";
  return "other";
}

function mapPlaidTransactionType(amount: number): FinancialProviderTransaction["type"] {
  // Plaid amount is positive for outflows and negative for inflows.
  if (amount < 0) return "income";
  if (amount > 0) return "expense";
  return "transfer";
}

async function plaidRequest(path: string, body: Record<string, unknown>) {
  const { clientId, secret } = getPlaidCredentials();
  const response = await fetch(`${PLAID_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      secret,
      ...body,
    }),
  });

  const payload = await response.json();
  if (!response.ok) {
    const errorMessage = payload?.error_message || payload?.display_message || "Plaid request failed";
    throw new Error(errorMessage);
  }
  return payload;
}

export class PlaidAdapter implements FinancialProviderAdapter {
  readonly id = "plaid";
  readonly displayName = "Plaid";

  isConfigured(): boolean {
    const { clientId, secret } = getPlaidCredentials();
    return Boolean(clientId && secret);
  }

  async createLinkToken(userId: string): Promise<FinancialLinkTokenResult> {
    const redirectUri = Deno.env.get("PLAID_REDIRECT_URI")?.trim();
    const requestBody: Record<string, unknown> = {
      client_name: "SyncScript",
      country_codes: ["US"],
      language: "en",
      products: ["transactions"],
      user: { client_user_id: userId },
    };
    let payload: any;
    if (redirectUri) {
      try {
        payload = await plaidRequest("/link/token/create", {
          ...requestBody,
          redirect_uri: redirectUri,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "";
        // Keep Link functional for non-OAuth institutions even if dashboard redirect URI is not configured yet.
        if (!message.toLowerCase().includes("oauth redirect uri")) {
          throw error;
        }
        payload = await plaidRequest("/link/token/create", requestBody);
      }
    } else {
      payload = await plaidRequest("/link/token/create", requestBody);
    }

    return {
      linkToken: payload.link_token,
      expiration: payload.expiration,
    };
  }

  async exchangePublicToken(publicToken: string): Promise<FinancialTokenExchangeResult> {
    const payload = await plaidRequest("/item/public_token/exchange", {
      public_token: publicToken,
    });

    return {
      accessToken: payload.access_token,
      itemId: payload.item_id,
    };
  }

  async sync(accessToken: string): Promise<FinancialSyncResult> {
    const [accountsPayload, transactionsPayload] = await Promise.all([
      plaidRequest("/accounts/get", { access_token: accessToken }),
      plaidRequest("/transactions/sync", { access_token: accessToken }),
    ]);

    const accounts: FinancialProviderAccount[] = Array.isArray(accountsPayload.accounts)
      ? accountsPayload.accounts.map((account: any) => ({
          providerAccountId: account.account_id,
          name: account.name || account.official_name || "Account",
          type: mapPlaidAccountType(account.type),
          subtype: account.subtype || undefined,
          currency: account.balances?.iso_currency_code || "USD",
          balance: Number(account.balances?.current ?? 0),
          institution: undefined,
          mask: account.mask || undefined,
        }))
      : [];

    const transactions: FinancialProviderTransaction[] = Array.isArray(transactionsPayload.added)
      ? transactionsPayload.added.map((tx: any) => ({
          providerTransactionId: tx.transaction_id,
          providerAccountId: tx.account_id,
          amount: Math.abs(Number(tx.amount ?? 0)),
          type: mapPlaidTransactionType(Number(tx.amount ?? 0)),
          category: tx.personal_finance_category?.primary || tx.category?.[0] || "uncategorized",
          description: tx.name || tx.merchant_name || "Transaction",
          merchant: tx.merchant_name || undefined,
          occurredAt: tx.authorized_date || tx.date || new Date().toISOString(),
          pending: Boolean(tx.pending),
        }))
      : [];

    return { accounts, transactions };
  }

  async searchInstitutions(params: {
    query: string;
    countryCodes?: string[];
    product?: string;
    oauthOnly?: boolean;
    limit?: number;
  }) {
    const payload = await plaidRequest("/institutions/search", {
      query: params.query,
      country_codes: params.countryCodes || ["US"],
      products: [params.product || "transactions"],
      options: {
        oauth: params.oauthOnly,
      },
    });

    const institutions = Array.isArray(payload.institutions) ? payload.institutions : [];
    return institutions.slice(0, Math.max(1, params.limit || 8)).map((institution: any) => ({
      institutionId: institution.institution_id,
      name: institution.name,
      oauth: Boolean(institution.oauth),
      products: Array.isArray(institution.products) ? institution.products : [],
      countryCodes: Array.isArray(institution.country_codes) ? institution.country_codes : [],
      url: institution.url || null,
    }));
  }
}
