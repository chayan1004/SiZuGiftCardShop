import crypto from 'crypto';
import { storage } from '../storage';

/**
 * Square HTTP Service - Direct API Implementation
 * Using native HTTP requests with proper Square API authentication
 * Following Square API Documentation: https://developer.squareup.com/docs/customers-api/what-it-does
 */

interface CustomerProfileRequest {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  companyName?: string;
  note?: string;
}

interface SaveCardRequest {
  customerId: string;
  cardNonce: string;
  cardNickname?: string;
  billingAddress?: {
    address1?: string;
    address2?: string;
    locality?: string;
    administrativeDistrictLevel1?: string;
    postalCode?: string;
    country?: string;
  };
  verificationToken?: string;
}

class SquareHTTPService {
  private accessToken: string;
  private environment: string;
  private baseUrl: string;

  constructor() {
    this.accessToken = process.env.SQUARE_ACCESS_TOKEN || '';
    this.environment = process.env.SQUARE_ENVIRONMENT || 'sandbox';
    this.baseUrl = this.environment === 'production' 
      ? 'https://connect.squareup.com'
      : 'https://connect.squareupsandbox.com';

    if (!this.accessToken) {
      throw new Error('SQUARE_ACCESS_TOKEN is required for Square HTTP service');
    }

    console.log('Square HTTP Service initialized');
    console.log(`Environment: ${this.environment}`);
    console.log(`Base URL: ${this.baseUrl}`);
    console.log(`Access token: ${this.accessToken.substring(0, 10)}...`);
  }

  /**
   * Make authenticated HTTP request to Square API
   */
  private async makeRequest(endpoint: string, method: string = 'GET', body?: any): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.accessToken}`,
      'Square-Version': '2023-10-18',
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    const config: RequestInit = {
      method,
      headers,
    };

    if (body && (method === 'POST' || method === 'PUT')) {
      config.body = JSON.stringify(body);
    }

    console.log(`Making ${method} request to: ${url}`);
    console.log(`Headers:`, Object.keys(headers));

    try {
      const response = await fetch(url, config);
      const responseData = await response.json();

      if (!response.ok) {
        console.error(`Square API Error: ${response.status}`, responseData);
        throw new Error(`Square API Error: ${response.status} - ${JSON.stringify(responseData)}`);
      }

      console.log(`Square API Success: ${response.status}`);
      return responseData;
    } catch (error) {
      console.error('Square HTTP Request Error:', error);
      throw error;
    }
  }

  /**
   * Create or retrieve a Square customer profile
   */
  async createOrGetCustomer(profileData: CustomerProfileRequest): Promise<{
    success: boolean;
    customer?: any;
    squareCustomerId?: string;
    error?: string;
  }> {
    try {
      const idempotencyKey = crypto.randomUUID();

      // First, search for existing customer by email
      const searchBody = {
        filter: {
          email_address: {
            exact: profileData.email
          }
        }
      };

      console.log('Searching for existing customer...');
      const searchResult = await this.makeRequest('/v2/customers/search', 'POST', searchBody);

      if (searchResult.customers && searchResult.customers.length > 0) {
        const existingCustomer = searchResult.customers[0];
        console.log(`Found existing Square customer: ${existingCustomer.id}`);

        return {
          success: true,
          customer: existingCustomer,
          squareCustomerId: existingCustomer.id
        };
      }

      // Create new customer if not found
      console.log('Creating new customer...');
      const createBody: any = {
        given_name: profileData.firstName,
        family_name: profileData.lastName,
        email_address: profileData.email,
      };

      if (profileData.phone) {
        createBody.phone_number = profileData.phone;
      }

      if (profileData.companyName) {
        createBody.company_name = profileData.companyName;
      }

      if (profileData.note) {
        createBody.note = profileData.note;
      }

      const createResult = await this.makeRequest('/v2/customers', 'POST', createBody);

      if (createResult.customer) {
        console.log(`Created new Square customer: ${createResult.customer.id}`);
        
        // Store customer profile in our database
        await storage.createCustomerProfile({
          email: profileData.email,
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          phone: profileData.phone,
          squareCustomerId: createResult.customer.id,
        });

        return {
          success: true,
          customer: createResult.customer,
          squareCustomerId: createResult.customer.id
        };
      }

      throw new Error('Failed to create customer');
    } catch (error: any) {
      console.error('Square Customer API Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Save a payment card on file for a customer
   */
  async saveCardOnFile(request: SaveCardRequest): Promise<{
    success: boolean;
    card?: any;
    error?: string;
  }> {
    try {
      const idempotencyKey = crypto.randomUUID();

      const createCardBody: any = {
        idempotency_key: idempotencyKey,
        source_id: request.cardNonce,
        card: {
          customer_id: request.customerId,
        }
      };

      if (request.cardNickname) {
        createCardBody.card.nickname = request.cardNickname;
      }

      if (request.billingAddress) {
        createCardBody.card.billing_address = request.billingAddress;
      }

      if (request.verificationToken) {
        createCardBody.verification_token = request.verificationToken;
      }

      console.log('Saving card on file...');
      const result = await this.makeRequest('/v2/cards', 'POST', createCardBody);

      if (result.card) {
        console.log(`Saved card on file: ${result.card.id}`);
        return {
          success: true,
          card: result.card
        };
      }

      throw new Error('Failed to save card');
    } catch (error: any) {
      console.error('Square Cards API Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get customer's saved cards
   */
  async getCustomerCards(customerId: string): Promise<{
    success: boolean;
    cards?: any[];
    error?: string;
  }> {
    try {
      console.log('Fetching customer cards...');
      const result = await this.makeRequest(`/v2/cards?customer_id=${customerId}`);

      return {
        success: true,
        cards: result.cards || []
      };
    } catch (error: any) {
      console.error('Square Cards API Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Disable a saved card
   */
  async disableCard(cardId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      console.log('Disabling card...');
      await this.makeRequest(`/v2/cards/${cardId}/disable`, 'POST');

      return {
        success: true
      };
    } catch (error: any) {
      console.error('Square Cards API Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update customer profile
   */
  async updateCustomer(customerId: string, updates: Partial<CustomerProfileRequest>): Promise<{
    success: boolean;
    customer?: any;
    error?: string;
  }> {
    try {
      const updateBody: any = {};

      if (updates.firstName) updateBody.given_name = updates.firstName;
      if (updates.lastName) updateBody.family_name = updates.lastName;
      if (updates.email) updateBody.email_address = updates.email;
      if (updates.phone) updateBody.phone_number = updates.phone;
      if (updates.companyName) updateBody.company_name = updates.companyName;
      if (updates.note) updateBody.note = updates.note;

      console.log('Updating customer...');
      const result = await this.makeRequest(`/v2/customers/${customerId}`, 'PUT', updateBody);

      return {
        success: true,
        customer: result.customer
      };
    } catch (error: any) {
      console.error('Square Customer API Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export const squareHTTPService = new SquareHTTPService();