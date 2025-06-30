declare module 'squareup' {
  export interface SquareupConfig {
    applicationId: string;
    accessToken: string;
    environment: 'sandbox' | 'production';
  }

  export interface SquareupClient {
    payments: {
      create: (payment: any) => Promise<any>;
    };
    giftCards: {
      create: (giftCard: any) => Promise<any>;
    };
  }

  export function Client(config: SquareupConfig): SquareupClient;
}