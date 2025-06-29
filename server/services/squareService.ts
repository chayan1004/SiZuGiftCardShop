// Square service for demo purposes - simplified implementation
class SquareService {
  private environment: string;
  private clientId: string;
  private clientSecret: string;

  constructor() {
    this.clientId = process.env.SQUARE_CLIENT_ID || process.env.SQUARE_APPLICATION_ID || "demo-client-id";
    this.clientSecret = process.env.SQUARE_CLIENT_SECRET || process.env.SQUARE_APPLICATION_SECRET || "demo-client-secret";
    this.environment = process.env.SQUARE_ENV || process.env.SQUARE_ENVIRONMENT || "sandbox";
  }

  getEnvironment(): string {
    return this.environment === "production" ? "production" : "sandbox";
  }

  getAuthorizationUrl(merchantId?: string): string {
    const baseUrl = process.env.REPLIT_DOMAINS 
      ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
      : process.env.BASE_URL || "http://localhost:5000";
    
    const redirectUri = `${baseUrl}/api/auth/square/callback`;
    const state = merchantId || Math.random().toString(36).substring(2, 15);
    
    const params = new URLSearchParams({
      client_id: this.clientId,
      scope: "PAYMENTS_READ PAYMENTS_WRITE ORDERS_READ ORDERS_WRITE GIFTCARDS_READ GIFTCARDS_WRITE",
      redirect_uri: redirectUri,
      state,
      response_type: "code",
    });

    const authUrl = this.environment === "production"
      ? `https://connect.squareup.com/oauth2/authorize?${params}`
      : `https://connect.squareupsandbox.com/oauth2/authorize?${params}`;

    return authUrl;
  }

  async exchangeCodeForToken(code: string): Promise<{
    access_token: string;
    refresh_token?: string;
    expires_at?: string;
  }> {
    // For demo purposes, return mock token data
    // In production, this would make actual API calls to Square
    console.log('Demo: Exchanging code for token:', code);
    
    return {
      access_token: `demo_access_token_${Date.now()}`,
      refresh_token: `demo_refresh_token_${Date.now()}`,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    };
  }

  async getMerchantInfo(accessToken: string): Promise<{
    id: string;
    business_name?: string;
    email?: string;
  }> {
    // For demo purposes, return mock merchant data
    console.log('Demo: Getting merchant info for token:', accessToken);
    
    return {
      id: `demo_merchant_${Date.now()}`,
      business_name: "Demo Business",
      email: "demo@business.com",
    };
  }

  async createGiftCard(accessToken: string, amount: number): Promise<{
    id: string;
    gan: string;
    state: string;
    balance: number;
  }> {
    // For demo purposes, return mock gift card data
    console.log('Demo: Creating gift card with amount:', amount);
    
    const gan = `GAN${Math.random().toString(36).substring(2, 10).toUpperCase()}${Date.now().toString().slice(-4)}`;
    
    return {
      id: `demo_gift_card_${Date.now()}`,
      gan,
      state: 'PENDING',
      balance: amount,
    };
  }

  async activateGiftCard(accessToken: string, giftCardId: string, amount: number): Promise<{
    id: string;
    type: string;
    amount: number;
  }> {
    // For demo purposes, return mock activity data
    console.log('Demo: Activating gift card:', giftCardId, 'with amount:', amount);
    
    return {
      id: `demo_activity_${Date.now()}`,
      type: 'ACTIVATE',
      amount,
    };
  }

  async redeemGiftCard(accessToken: string, giftCardId: string, amount: number): Promise<{
    id: string;
    type: string;
    amount: number;
  }> {
    // For demo purposes, return mock redemption data
    console.log('Demo: Redeeming gift card:', giftCardId, 'with amount:', amount);
    
    return {
      id: `demo_redeem_${Date.now()}`,
      type: 'REDEEM',
      amount,
    };
  }

  async testConnection(): Promise<boolean> {
    // For demo purposes, always return true
    console.log('Demo: Testing Square connection');
    return true;
  }
}

export const squareService = new SquareService();