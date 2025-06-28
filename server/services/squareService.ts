import { Client, Environment } from "squareupsdk";

class SquareService {
  private client: Client;
  private environment: Environment;

  constructor() {
    const clientId = process.env.SQUARE_CLIENT_ID || process.env.SQUARE_APPLICATION_ID;
    const clientSecret = process.env.SQUARE_CLIENT_SECRET || process.env.SQUARE_APPLICATION_SECRET;
    const squareEnv = process.env.SQUARE_ENV || process.env.SQUARE_ENVIRONMENT || "sandbox";

    if (!clientId || !clientSecret) {
      throw new Error("Square API credentials not configured. Please set SQUARE_CLIENT_ID and SQUARE_CLIENT_SECRET environment variables.");
    }

    this.environment = squareEnv === "production" ? Environment.Production : Environment.Sandbox;
    
    this.client = new Client({
      bearerAuthCredentials: {
        accessToken: "", // Will be set per request
      },
      environment: this.environment,
    });
  }

  getEnvironment(): string {
    return this.environment === Environment.Production ? "production" : "sandbox";
  }

  getAuthorizationUrl(): string {
    const clientId = process.env.SQUARE_CLIENT_ID || process.env.SQUARE_APPLICATION_ID;
    const baseUrl = process.env.REPLIT_DOMAINS 
      ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
      : process.env.BASE_URL || "http://localhost:5000";
    
    const redirectUri = `${baseUrl}/api/auth/square/callback`;
    const state = Math.random().toString(36).substring(2, 15);
    
    const params = new URLSearchParams({
      client_id: clientId!,
      scope: "PAYMENTS_READ PAYMENTS_WRITE ORDERS_READ ORDERS_WRITE GIFTCARDS_READ GIFTCARDS_WRITE",
      redirect_uri: redirectUri,
      state,
      response_type: "code",
    });

    const authUrl = this.environment === Environment.Production
      ? `https://connect.squareup.com/oauth2/authorize?${params}`
      : `https://connect.squareupsandbox.com/oauth2/authorize?${params}`;

    return authUrl;
  }

  async exchangeCodeForToken(code: string): Promise<{
    access_token: string;
    refresh_token?: string;
    expires_at?: string;
  }> {
    const clientId = process.env.SQUARE_CLIENT_ID || process.env.SQUARE_APPLICATION_ID;
    const clientSecret = process.env.SQUARE_CLIENT_SECRET || process.env.SQUARE_APPLICATION_SECRET;
    const baseUrl = process.env.REPLIT_DOMAINS 
      ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
      : process.env.BASE_URL || "http://localhost:5000";
    
    const redirectUri = `${baseUrl}/api/auth/square/callback`;

    try {
      const oAuthApi = this.client.oAuthApi;
      const { result } = await oAuthApi.obtainToken({
        clientId: clientId!,
        clientSecret: clientSecret!,
        code,
        redirectUri,
        grantType: 'authorization_code',
      });

      return {
        access_token: result.accessToken!,
        refresh_token: result.refreshToken,
        expires_at: result.expiresAt,
      };
    } catch (error) {
      console.error('Square token exchange error:', error);
      throw new Error('Failed to exchange authorization code for access token');
    }
  }

  async getMerchantInfo(accessToken: string): Promise<{
    id: string;
    business_name?: string;
    email?: string;
  }> {
    try {
      // Create a new client instance with the access token
      const authenticatedClient = new Client({
        bearerAuthCredentials: {
          accessToken,
        },
        environment: this.environment,
      });

      const merchantsApi = authenticatedClient.merchantsApi;
      const { result } = await merchantsApi.listMerchants();

      if (!result.merchant || result.merchant.length === 0) {
        throw new Error('No merchant found');
      }

      const merchant = result.merchant[0];
      return {
        id: merchant.id!,
        business_name: merchant.businessName,
        email: merchant.mainLocationId, // Square doesn't provide email directly
      };
    } catch (error) {
      console.error('Get merchant info error:', error);
      throw new Error('Failed to get merchant information');
    }
  }

  async createGiftCard(accessToken: string, amount: number): Promise<{
    id: string;
    gan: string;
    state: string;
    balance: number;
  }> {
    try {
      const authenticatedClient = new Client({
        bearerAuthCredentials: {
          accessToken,
        },
        environment: this.environment,
      });

      const giftCardsApi = authenticatedClient.giftCardsApi;
      const { result } = await giftCardsApi.createGiftCard({
        idempotencyKey: `giftcard_${Date.now()}_${Math.random().toString(36).substring(2)}`,
        giftCard: {
          type: 'DIGITAL',
          // Note: In Square API, amount is typically in the smallest currency unit (cents)
        },
      });

      if (!result.giftCard) {
        throw new Error('Failed to create gift card');
      }

      return {
        id: result.giftCard.id!,
        gan: result.giftCard.gan!,
        state: result.giftCard.state || 'PENDING',
        balance: amount,
      };
    } catch (error) {
      console.error('Create gift card error:', error);
      throw new Error('Failed to create gift card via Square API');
    }
  }

  async activateGiftCard(accessToken: string, giftCardId: string, amount: number): Promise<{
    id: string;
    type: string;
    amount: number;
  }> {
    try {
      const authenticatedClient = new Client({
        bearerAuthCredentials: {
          accessToken,
        },
        environment: this.environment,
      });

      const giftCardActivitiesApi = authenticatedClient.giftCardActivitiesApi;
      const { result } = await giftCardActivitiesApi.createGiftCardActivity({
        idempotencyKey: `activate_${Date.now()}_${Math.random().toString(36).substring(2)}`,
        giftCardActivity: {
          type: 'ACTIVATE',
          giftCardId,
          activateActivityDetails: {
            amountMoney: {
              amount: BigInt(amount),
              currency: 'USD',
            },
          },
        },
      });

      if (!result.giftCardActivity) {
        throw new Error('Failed to activate gift card');
      }

      return {
        id: result.giftCardActivity.id!,
        type: result.giftCardActivity.type!,
        amount,
      };
    } catch (error) {
      console.error('Activate gift card error:', error);
      throw new Error('Failed to activate gift card via Square API');
    }
  }

  async redeemGiftCard(accessToken: string, giftCardId: string, amount: number): Promise<{
    id: string;
    type: string;
    amount: number;
  }> {
    try {
      const authenticatedClient = new Client({
        bearerAuthCredentials: {
          accessToken,
        },
        environment: this.environment,
      });

      const giftCardActivitiesApi = authenticatedClient.giftCardActivitiesApi;
      const { result } = await giftCardActivitiesApi.createGiftCardActivity({
        idempotencyKey: `redeem_${Date.now()}_${Math.random().toString(36).substring(2)}`,
        giftCardActivity: {
          type: 'REDEEM',
          giftCardId,
          redeemActivityDetails: {
            amountMoney: {
              amount: BigInt(amount),
              currency: 'USD',
            },
          },
        },
      });

      if (!result.giftCardActivity) {
        throw new Error('Failed to redeem gift card');
      }

      return {
        id: result.giftCardActivity.id!,
        type: result.giftCardActivity.type!,
        amount,
      };
    } catch (error) {
      console.error('Redeem gift card error:', error);
      throw new Error('Failed to redeem gift card via Square API');
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      // Test connection with a simple API call
      const locationsApi = this.client.locationsApi;
      await locationsApi.listLocations();
      return true;
    } catch (error) {
      console.error('Square connection test failed:', error);
      return false;
    }
  }
}

export const squareService = new SquareService();
