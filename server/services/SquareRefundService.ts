/**
 * Square Refund Service - Production Ready Implementation
 * Following Official Square Refunds API Documentation:
 * - Refunds API: https://developer.squareup.com/docs/refunds-api
 * - Payments API: https://developer.squareup.com/docs/payments-api
 * - Disputes API: https://developer.squareup.com/docs/disputes-api
 */

import crypto from 'crypto';
import { storage } from '../storage';

interface RefundRequest {
  paymentId: string;
  amountMoney: {
    amount: number;
    currency: string;
  };
  reason?: string;
  orderId?: string;
}

interface DisputeResponse {
  disputeId: string;
  amount: {
    amount: number;
    currency: string;
  };
  reason: string;
  state: string;
  createdAt: string;
  updatedAt: string;
  paymentId?: string;
  cardBrand?: string;
  lastFourDigits?: string;
  evidenceIds?: string[];
}

class SquareRefundService {
  private accessToken: string;
  private environment: string;
  private baseUrl: string;

  constructor() {
    this.accessToken = process.env.SQUARE_ACCESS_TOKEN!;
    this.environment = process.env.SQUARE_ENVIRONMENT || 'sandbox';
    this.baseUrl = this.environment === 'production' 
      ? 'https://connect.squareup.com' 
      : 'https://connect.squareupsandbox.com';

    if (!this.accessToken) {
      throw new Error('Square access token is required');
    }
  }

  /**
   * Make authenticated HTTP request to Square API
   */
  private async makeRequest(endpoint: string, method: string = 'GET', body?: any): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    
    console.log(`Making ${method} request to: ${url}`);

    const config: RequestInit = {
      method,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Square-Version': '2023-10-18',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    if (body && method !== 'GET') {
      config.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        console.error(`Square API Error: ${response.status}`, data);
        throw new Error(`Square API Error: ${response.status} - ${JSON.stringify(data)}`);
      }

      return data;
    } catch (error: any) {
      console.error('Square HTTP Request Error:', error);
      throw error;
    }
  }

  /**
   * Create a refund for a payment
   */
  async createRefund(request: RefundRequest): Promise<{
    success: boolean;
    refund?: any;
    error?: string;
  }> {
    try {
      const idempotencyKey = crypto.randomUUID();

      const refundBody = {
        idempotency_key: idempotencyKey,
        amount_money: {
          amount: request.amountMoney.amount,
          currency: request.amountMoney.currency || 'USD'
        },
        payment_id: request.paymentId,
        reason: request.reason || 'Customer requested refund'
      };

      console.log('Creating refund...');
      const result = await this.makeRequest('/v2/refunds', 'POST', refundBody);

      if (result.refund) {
        console.log(`Created refund: ${result.refund.id}`);
        
        // Store refund in database
        await storage.createRefund({
          id: crypto.randomUUID(),
          squareRefundId: result.refund.id,
          paymentId: request.paymentId,
          orderId: request.orderId,
          amount: request.amountMoney.amount,
          currency: request.amountMoney.currency || 'USD',
          reason: request.reason || 'Customer requested refund',
          status: result.refund.status || 'PENDING',
          createdAt: new Date(),
          updatedAt: new Date()
        });

        return {
          success: true,
          refund: result.refund
        };
      }

      throw new Error('Failed to create refund');
    } catch (error: any) {
      console.error('Square Refund API Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get refund by ID
   */
  async getRefund(refundId: string): Promise<{
    success: boolean;
    refund?: any;
    error?: string;
  }> {
    try {
      console.log(`Getting refund: ${refundId}`);
      const result = await this.makeRequest(`/v2/refunds/${refundId}`);

      return {
        success: true,
        refund: result.refund
      };
    } catch (error: any) {
      console.error('Square Refund API Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * List refunds with optional filters
   */
  async listRefunds(filters?: {
    locationId?: string;
    sourceType?: string;
    createdAtStart?: string;
    createdAtEnd?: string;
    cursor?: string;
  }): Promise<{
    success: boolean;
    refunds?: any[];
    cursor?: string;
    error?: string;
  }> {
    try {
      let endpoint = '/v2/refunds';
      const params = new URLSearchParams();

      if (filters?.locationId) params.append('location_id', filters.locationId);
      if (filters?.sourceType) params.append('source_type', filters.sourceType);
      if (filters?.createdAtStart) params.append('begin_time', filters.createdAtStart);
      if (filters?.createdAtEnd) params.append('end_time', filters.createdAtEnd);
      if (filters?.cursor) params.append('cursor', filters.cursor);

      if (params.toString()) {
        endpoint += `?${params.toString()}`;
      }

      console.log('Listing refunds...');
      const result = await this.makeRequest(endpoint);

      return {
        success: true,
        refunds: result.refunds || [],
        cursor: result.cursor
      };
    } catch (error: any) {
      console.error('Square Refunds API Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * List disputes
   */
  async listDisputes(filters?: {
    cursor?: string;
    states?: string[];
    locationId?: string;
  }): Promise<{
    success: boolean;
    disputes?: DisputeResponse[];
    cursor?: string;
    error?: string;
  }> {
    try {
      let endpoint = '/v2/disputes';
      const params = new URLSearchParams();

      if (filters?.cursor) params.append('cursor', filters.cursor);
      if (filters?.locationId) params.append('location_id', filters.locationId);
      if (filters?.states && filters.states.length > 0) {
        filters.states.forEach(state => params.append('states', state));
      }

      if (params.toString()) {
        endpoint += `?${params.toString()}`;
      }

      console.log('Listing disputes...');
      const result = await this.makeRequest(endpoint);

      return {
        success: true,
        disputes: result.disputes || [],
        cursor: result.cursor
      };
    } catch (error: any) {
      console.error('Square Disputes API Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get dispute by ID
   */
  async getDispute(disputeId: string): Promise<{
    success: boolean;
    dispute?: DisputeResponse;
    error?: string;
  }> {
    try {
      console.log(`Getting dispute: ${disputeId}`);
      const result = await this.makeRequest(`/v2/disputes/${disputeId}`);

      return {
        success: true,
        dispute: result.dispute
      };
    } catch (error: any) {
      console.error('Square Dispute API Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Accept a dispute
   */
  async acceptDispute(disputeId: string): Promise<{
    success: boolean;
    dispute?: any;
    error?: string;
  }> {
    try {
      console.log(`Accepting dispute: ${disputeId}`);
      const result = await this.makeRequest(`/v2/disputes/${disputeId}/accept`, 'POST');

      // Update dispute status in database
      await storage.updateDisputeStatus(disputeId, 'ACCEPTED');

      return {
        success: true,
        dispute: result.dispute
      };
    } catch (error: any) {
      console.error('Square Dispute API Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Submit evidence for a dispute
   */
  async submitDisputeEvidence(disputeId: string, evidence: {
    evidenceType: string;
    evidenceText?: string;
    evidenceFile?: string;
  }): Promise<{
    success: boolean;
    evidence?: any;
    error?: string;
  }> {
    try {
      const evidenceBody = {
        evidence_type: evidence.evidenceType,
        evidence_text: evidence.evidenceText,
        evidence_file: evidence.evidenceFile
      };

      console.log(`Submitting evidence for dispute: ${disputeId}`);
      const result = await this.makeRequest(`/v2/disputes/${disputeId}/evidence`, 'POST', evidenceBody);

      return {
        success: true,
        evidence: result.evidence
      };
    } catch (error: any) {
      console.error('Square Dispute Evidence API Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get payment details for refund/dispute context
   */
  async getPayment(paymentId: string): Promise<{
    success: boolean;
    payment?: any;
    error?: string;
  }> {
    try {
      console.log(`Getting payment: ${paymentId}`);
      const result = await this.makeRequest(`/v2/payments/${paymentId}`);

      return {
        success: true,
        payment: result.payment
      };
    } catch (error: any) {
      console.error('Square Payment API Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export const squareRefundService = new SquareRefundService();