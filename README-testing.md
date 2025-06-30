# SiZu Gift Card API Testing Guide

## Overview
This document explains how to run the comprehensive test suite for the SiZu gift card order flows.

## Test Suite Coverage
The Postman test suite validates:
- **Payment Processing**: Square sandbox integration and gift card creation
- **Email Delivery**: Automated email notifications and tracking
- **PDF Receipt Generation**: Automatic receipt creation and download functionality
- **Admin API Endpoints**: Order management and monitoring capabilities
- **Public Success Flow**: Customer-facing order confirmation and receipt access

## Running Tests

### Prerequisites
1. Ensure the SiZu application is running locally on port 5000
2. Verify Square sandbox credentials are configured
3. Confirm database connectivity

### Method 1: Command Line (Recommended)
```bash
# Run the complete test suite
node scripts/test-giftcards.js

# The script will:
# - Execute all 5 test scenarios
# - Validate HTTP responses and data integrity
# - Generate test results and logs
# - Exit with status code 0 if all tests pass
```

### Method 2: Postman GUI
1. Import the collection: `postman/sizu-giftcard-tests.postman_collection.json`
2. Set environment variable `baseUrl` to `http://localhost:5000`
3. Run the collection in order:
   - Public Tests → Admin Tests → PDF Receipt Tests

## Test Scenarios

### Test 1: Public Checkout
- **Endpoint**: `POST /api/public/checkout`
- **Validates**: Payment processing, gift card creation, Square API integration
- **Expected**: 200 status, order ID, gift card ID, and GAN returned

### Test 2: Admin Order List
- **Endpoint**: `GET /api/admin/giftcard-orders`
- **Validates**: Admin authentication, order visibility, data completeness
- **Expected**: Array of orders including the test order with all required fields

### Test 3: Email Delivery Log
- **Endpoint**: `GET /api/admin/email-log/:orderId`
- **Validates**: Email tracking, delivery status, timestamp recording
- **Expected**: Email delivery metadata and status information

### Test 4: PDF Receipt Download
- **Endpoint**: Direct PDF URL from order data
- **Validates**: PDF generation, file accessibility, content-type headers
- **Expected**: Valid PDF file with proper headers and content

### Test 5: Public Order Details
- **Endpoint**: `GET /api/public/order/:orderId`
- **Validates**: Public data access, order information accuracy
- **Expected**: Order details without sensitive admin-only fields

## Test Data
- Email: `test-postman@example.com`
- Amount: $25.00 (2500 cents)
- Payment Token: `cnon:card-nonce-ok` (Square sandbox token)
- Admin Token: `sizu-admin-2025`

## Expected Results
All tests should pass with:
- HTTP 200 status codes
- Proper data validation
- PDF receipt generation
- Email delivery tracking
- Admin authentication working

## Troubleshooting

### Common Issues
1. **Test Failures**: Check server logs for detailed error information
2. **PDF Download Issues**: Verify `/public/receipts/` directory exists and is writable
3. **Email Tracking**: Allow time for email processing between requests
4. **Admin Access**: Confirm admin token is correct and middleware is functioning

### Log Files
- Test execution results: `test-results.json`
- Test history: `test-history.log`
- Server logs: Console output during test execution

### Test Timing
The test suite includes 2-second delays between requests to allow for:
- Gift card creation processing
- Email delivery queuing
- PDF receipt generation
- Database transaction completion

## Integration Notes
This test suite validates the complete end-to-end flow from payment to receipt delivery, ensuring all components work together correctly in a production-like environment using real Square sandbox APIs and database operations.