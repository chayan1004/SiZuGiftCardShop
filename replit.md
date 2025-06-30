# SiZu GiftCard Application

## Overview

This is a full-stack gift card management application built with a modern tech stack. The application allows businesses to create, manage, and track digital gift cards through Square's payment platform integration. It features a React frontend with shadcn/ui components, an Express.js backend, and PostgreSQL database with Drizzle ORM.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for client-side routing
- **Animations**: Framer Motion for smooth UI transitions

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Style**: RESTful API with JSON responses
- **Middleware**: Custom logging, error handling, and request parsing
- **Development**: Hot reloading with Vite integration in development mode

### Database Architecture
- **Database**: PostgreSQL (configured for Neon serverless)
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Validation**: Zod schemas integrated with Drizzle for runtime validation

## Key Components

### Authentication & Authorization
- Square OAuth 2.0 integration for merchant authentication
- Access token and refresh token management
- Merchant-specific data isolation

### Payment Processing
- Square SDK integration for payment processing
- Gift card creation and management through Square's API
- Support for both sandbox and production environments

### Gift Card Management
- Digital gift card creation with customizable amounts
- QR code generation for mobile redemption
- Real-time balance tracking and transaction history
- Gift card activity logging (activation, redemption, adjustments)

### Merchant Dashboard
- Real-time analytics and reporting
- Transaction history and customer insights
- Gift card status management
- OAuth flow management for Square integration

### UI/UX Features
- Responsive design optimized for all devices
- Modern glassmorphism design with gradients
- Animated components and micro-interactions
- Toast notifications for user feedback
- Modal-based workflows for gift card purchases

## Data Flow

1. **Merchant Onboarding**: Merchants authenticate via Square OAuth, storing credentials securely
2. **Gift Card Creation**: Customers purchase gift cards through the web interface
3. **Payment Processing**: Payments are processed through Square's secure payment system
4. **Gift Card Issuance**: Digital gift cards are generated with unique GANs (Gift Account Numbers)
5. **Redemption**: Gift cards can be redeemed using QR codes or manual entry
6. **Analytics**: Real-time tracking of sales, redemptions, and customer data

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL connection
- **squareupsdk**: Official Square SDK for payment processing
- **drizzle-orm & drizzle-kit**: Database ORM and migration tools
- **@tanstack/react-query**: Server state management
- **framer-motion**: Animation library
- **zod**: Runtime type validation

### UI Dependencies
- **@radix-ui/***: Primitive UI components for accessibility
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **lucide-react**: Icon library

### Development Dependencies
- **vite**: Build tool and development server
- **typescript**: Type safety and development experience
- **tsx**: TypeScript execution for server development

## Deployment Strategy

### Build Process
1. Frontend builds to `dist/public` using Vite
2. Backend bundles to `dist/index.js` using esbuild
3. Server serves static files in production mode

### Environment Configuration
- Database connection via `DATABASE_URL` environment variable
- Square API credentials via `SQUARE_CLIENT_ID` and `SQUARE_CLIENT_SECRET`
- Environment switching between sandbox and production modes

### Hosting Requirements
- Node.js runtime environment
- PostgreSQL database (Neon serverless recommended)
- HTTPS required for Square OAuth callbacks
- Environment variable configuration for sensitive data

## Changelog

- June 28, 2025. Initial setup
- June 28, 2025. Added PostgreSQL database integration with Drizzle ORM
- June 28, 2025. Phase II - Implemented comprehensive admin dashboard with real-time analytics
- June 28, 2025. Enhanced Square API integration - Production ready implementation
- June 28, 2025. Added QR/barcode generation, webhook handling, and email delivery system
- June 28, 2025. Phase III - Completed public-facing gift card storefront with animated UI, checkout flow, and Square integration
- June 29, 2025. Comprehensive TypeScript fixes and dependency security improvements
- June 29, 2025. Implemented secure webhook signature verification with crypto HMAC SHA1 and replay protection
- June 29, 2025. Converted email service to Nodemailer SMTP with Mailgun integration and QR code embedding
- June 29, 2025. Enhanced all email templates with fully responsive design for mobile, tablet, and desktop devices
- June 29, 2025. Corrected branding consistency to use "SiZu GiftCard" instead of "SiZu Pay" across all email templates
- June 29, 2025. Implemented 100% production-ready email system with SPF/DKIM/DMARC support, delivery monitoring, and gradual volume scaling
- June 29, 2025. Enhanced security architecture with role-based authentication system and dedicated merchant login page at /merchant-login
- June 29, 2025. Implemented complete merchant registration flow with secure onboarding, JWT authentication, and auto-login functionality
- June 29, 2025. Added comprehensive live merchant analytics dashboard with real-time KPIs, interactive charts, and 30-second auto-refresh
- June 29, 2025. Implemented complete merchant transaction history system with search, filtering, and pagination capabilities
- June 29, 2025. Added comprehensive merchant email verification system with security tokens, automated emails, and verification banner UI
- June 29, 2025. Implemented enterprise-grade security architecture with email verification flow, rate limiting, brute force protection, and authentication audit logging
- June 29, 2025. Fixed critical demo login security vulnerability and completed email verification system with proper frontend verification page
- June 29, 2025. Completed comprehensive mobile responsiveness audit and implementation for both admin and merchant dashboards with full device compatibility
- June 29, 2025. Renamed Users section to Merchants with full backend API integration, dark theme styling, and real-time merchant data display
- June 29, 2025. Completed comprehensive premium-grade visual enhancement of all admin dashboard sections with glassmorphism design, gradient backgrounds, and unified dark theme styling
- June 29, 2025. Enhanced admin dashboard charts with premium animations, interactive overlays, SVG gradients, glow effects, real-time data refresh every 10 seconds, and advanced performance metrics
- June 29, 2025. Applied all premium admin dashboard enhancements to merchant dashboard including animated charts, real-time status panels, enhanced metric cards, interactive tooltips, and comprehensive system status bar
- June 29, 2025. Consolidated admin functionality into single Admin Dashboard at `/admin` - removed all duplicate admin interfaces and made it the only admin entry point
- June 29, 2025. Enhanced Admin Dashboard with comprehensive business owner functionalities including Revenue Analytics, Customer Insights, Marketing Tools, Operations monitoring, Growth Strategy tracking, Business Intelligence Reports, and System Health monitoring - transformed into complete business management platform
- June 29, 2025. Permanently removed merchant dashboard files (MerchantDashboard.tsx components and pages) from project per user request - cleaned up all routing and references
- June 29, 2025. Phase 2: Recreated MerchantDashboard.tsx with live backend integration - displays real gift card and bulk order data from database
- June 29, 2025. Phase 3: Implemented MerchantBulkPurchase.tsx with real payment flow - merchants can create bulk orders with volume pricing tiers and live database integration
- June 29, 2025. Phase 4: Complete Mobile-First Responsive Enhancement - rebuilt entire Merchant Dashboard and Bulk Purchase interfaces with comprehensive mobile optimization for all device sizes
- June 29, 2025. Phase 5: Enhanced Visual Design Implementation - updated all merchant interface text colors with premium color scheme (#dd4bae for labels/descriptions, #613791 for buttons/inputs) for improved readability and visual hierarchy across dashboard and bulk purchase pages
- June 29, 2025. Updated merchant dashboard logout button to redirect to website home page (/) instead of merchant login page for better user experience
- June 29, 2025. Phase 6: Mobile-First Merchant Login Enhancement - completely rebuilt merchant login page with mobile-first responsive design including adaptive containers, touch-friendly inputs, responsive typography, mobile-optimized spacing, and enhanced navigation
- June 30, 2025. Prompt 4: Branded Public Gift Card Storefront - implemented complete public-facing gift card purchase system at /giftcard-store with Square Web Payments SDK integration, real-time merchant validation, business pricing tiers, secure payment processing, automated gift card generation, and comprehensive database tracking
- June 30, 2025. Prompt 5: Real Gift Card Generation via Square API - completed secure Square gift card issuance after payment confirmation with proper error handling, database tracking, and comprehensive logging
- June 30, 2025. Prompt 6: Email Delivery System - implemented Mailgun API integration with SMTP fallback, branded HTML email templates, duplicate prevention, delivery tracking, and admin monitoring endpoints
- June 30, 2025. Prompt 7: Admin Dashboard for Public Gift Card Orders - created comprehensive admin interface at /admin/giftcard-orders with real-time data display, advanced filtering, status badges, and secure access controls
- June 30, 2025. Prompt 8: Resend Email + Admin Recovery Panel - implemented comprehensive email recovery system with resend functionality, manual failure marking, tracking counters, and admin action buttons
- June 30, 2025. Prompt 9: PDF Receipt Generator + Download Link - implemented automatic PDF receipt generation with professional branding, admin dashboard download functionality, public success page with receipt access, and complete end-to-end integration with Square checkout flow

## Prompt 4: Branded Public Gift Card Storefront (June 30, 2025)

### Complete Square API Integration
- **Public Storefront**: Beautiful, branded gift card purchase page at `/giftcard-store` route
- **Square Web Payments SDK**: 100% branded inline payment form (no redirects)
- **Real-time Payment Processing**: Secure Square API integration with payment tokenization
- **Automated Gift Card Generation**: Creates real Square gift cards upon successful payment
- **Database Tracking**: New `public_giftcard_orders` table for order management

### Frontend Features
- **Amount Selection**: Predefined amounts ($25-$250) plus custom amount input
- **Merchant Validation**: Real-time merchant ID validation with business pricing
- **Form Validation**: Comprehensive Zod-based validation with error handling
- **Payment Integration**: Square Web Payments SDK with secure tokenization
- **Success Handling**: Animated success messages and form reset

### Backend Implementation
- **API Endpoints**: 
  - `GET /api/public/validate-merchant/:merchantId` - Merchant validation
  - `POST /api/public/checkout` - Secure payment processing
- **Square Integration**: Full Square Payments API and Gift Cards API integration
- **Security**: Payment tokens validated, no fake payments possible
- **Database**: Order tracking with status updates (pending → completed/failed)

### Business Logic
- **Merchant Pricing**: Business discounts applied when valid merchant ID entered
- **Payment Flow**: Token → Payment → Gift Card → Database → Email notification
- **Error Handling**: Comprehensive error management with proper status codes
- **Logging**: Detailed transaction logging for admin monitoring

### Database Schema
```sql
CREATE TABLE public_giftcard_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email TEXT NOT NULL,
  merchant_id TEXT,
  amount INTEGER NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  square_payment_id TEXT,
  gift_card_gan TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Prompt 6: Email Delivery System for Issued Square Gift Cards (June 30, 2025)

### Comprehensive Email Integration
- **Mailgun API Primary**: Real email delivery via Mailgun with authenticated domain support
- **SMTP Fallback**: Nodemailer SMTP as secondary delivery method if Mailgun fails
- **Duplicate Prevention**: Database tracking prevents multiple emails per order
- **Delivery Tracking**: Timestamps and status logging for all email attempts
- **Admin Monitoring**: Real-time email delivery logs accessible via admin endpoints

### Database Schema Updates
- **Email Tracking Fields**: Added `email_sent` (boolean) and `email_sent_at` (timestamp) to `public_giftcard_orders`
- **Status Management**: Proper order lifecycle tracking (pending → issued → email_sent)
- **Audit Trail**: Complete delivery history with success/failure logging

### Email Service Architecture
- **File**: `server/services/EmailService.ts`
- **Dual Delivery**: Mailgun API with automatic SMTP fallback
- **Environment Variables**: `MAILGUN_API_KEY`, `MAILGUN_DOMAIN`, `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`
- **Error Handling**: Comprehensive retry logic and graceful failure management

### Branded Email Templates
- **Production-Grade HTML**: Mobile-responsive design with gradient backgrounds
- **Real Data Integration**: Uses actual gift card metadata (ID, amount, GAN)
- **Business Branding**: SiZu Gift Card Store branding with support contact info
- **Accessibility**: Text fallback templates for email clients without HTML support

### Integration Points
- **Checkout Flow**: Email triggered automatically after successful Square gift card creation
- **Order Validation**: Checks `email_sent` status to prevent duplicate deliveries
- **Admin Endpoint**: `GET /api/admin/email-log/:orderId` for delivery verification
- **Security**: Admin middleware protection for email monitoring endpoints

### Production Features
- **Real Gift Card Data**: No mock data, only authentic Square API responses
- **Environment-Aware**: Sandbox/production domain configuration
- **Logging**: Detailed console logs for debugging and monitoring
- **Non-Blocking**: Email failures don't affect gift card creation success

## Prompt 7: Admin Dashboard for Public Gift Card Orders (June 30, 2025)

### Complete Admin Interface
- **Route**: `/admin/giftcard-orders` with admin-only access protection
- **Real-time Data**: Live display of all public gift card orders from database
- **Advanced Filtering**: Search by email, order ID, gift card ID with status and email filters
- **Responsive Design**: Mobile-first interface with adaptive layouts
- **Auto-refresh**: 60-second data refresh for real-time monitoring

### Backend API Integration
- **Endpoint**: `GET /api/admin/giftcard-orders` secured with `requireAdmin` middleware
- **Storage Method**: `getAllPublicGiftCardOrders()` returns orders in descending date order
- **Authentication**: Admin token required for access
- **Data Security**: No sensitive PII exposed in responses

### Frontend Features
- **Statistics Dashboard**: Total orders, issued count, emails sent, total value
- **Status Badge System**: Color-coded badges (pending=yellow, issued=green, failed=red)
- **Email Status Tracking**: Visual indicators for email delivery status
- **Order Details**: Order ID, recipient email, amount, gift card metadata
- **Search & Filter**: Real-time filtering by multiple criteria

### Data Display
- **Order Information**: ID, recipient email, amount, status, gift card ID/GAN
- **Email Tracking**: Sent status with timestamps
- **Merchant Context**: Merchant ID display when applicable
- **Creation Timestamps**: Formatted date/time display
- **Responsive Table**: Mobile-optimized data presentation

### Security Implementation
- **Admin-Only Access**: ProtectedRoute with admin role enforcement
- **Backend Middleware**: requireAdmin protection on API endpoints
- **Token Validation**: Secure admin token verification
- **Role-Based UI**: Admin interface completely separated from merchant views

## Prompt 8: Resend Email + Admin Recovery Panel (June 30, 2025)

### Database Schema Extensions
- **Email Tracking Fields**: Added `email_resend_count` (integer, default 0), `email_last_resend_at` (timestamp), and `manually_marked_failed` (boolean, default false)
- **Schema Migration**: Successfully pushed via `npm run db:push` with proper field defaults
- **Data Integrity**: Maintains complete audit trail of all email delivery attempts

### Backend API Implementation
- **Storage Methods**: Added `markEmailAsResent()` and `markOrderAsFailed()` to IStorage interface and DatabaseStorage
- **Resend Endpoint**: `POST /api/admin/giftcard-orders/:orderId/resend-email` with admin authentication
- **Mark Failed Endpoint**: `POST /api/admin/giftcard-orders/:orderId/mark-failed` with confirmation workflow
- **Email Service Integration**: Proper data formatting for emailService.sendGiftCardEmail() calls

### Admin Recovery Panel Features
- **Resend Email Button**: Available for issued orders with gift card data, includes loading states
- **Mark as Failed Button**: Manual failure marking with confirmation dialog and database updates
- **Action Tracking**: Visual indicators showing resend count and last resend timestamps
- **Smart Filtering**: Enhanced filters for email status and manual failure tracking
- **Real-time Updates**: Automatic data refresh after successful admin actions

### Error Handling & Validation
- **Order State Validation**: Ensures only issued orders with gift card data can trigger email resends
- **Confirmation Dialogs**: JavaScript confirm() for destructive actions like marking orders failed
- **Toast Notifications**: Success/error feedback for all admin actions with descriptive messages
- **Loading States**: Button-specific loading indicators preventing double-clicks during operations

### Security & Logging
- **Admin-Only Access**: All recovery endpoints protected with requireAdmin middleware
- **Action Logging**: Console logs for all admin recovery actions with order IDs and timestamps
- **Database Atomicity**: Proper transaction handling for resend count increments and status updates
- **Non-Destructive Operations**: Email resends don't affect original order data integrity

### Frontend User Experience
- **Conditional Buttons**: Smart button visibility based on order status and previous actions
- **Visual Feedback**: Color-coded action buttons (blue for resend, red for mark failed)
- **Responsive Design**: Mobile-optimized action buttons with proper touch targets
- **Data Refresh**: Automatic cache invalidation ensuring fresh data display post-actions

## Prompt 9: PDF Receipt Generator + Download Link (June 30, 2025)

### PDF Receipt Service Implementation
- **ReceiptService**: Created `server/services/ReceiptService.ts` with pdf-lib integration for professional receipt generation
- **Automatic Generation**: PDF receipts created after successful Square gift card creation in checkout flow
- **Storage System**: Receipts stored in `/public/receipts/` directory with UUID-based filenames
- **Database Tracking**: Added `pdf_receipt_url` and `pdf_generated_at` fields to `public_giftcard_orders` table

### Database Schema Extensions
- **PDF Tracking Fields**: Added `pdfReceiptUrl` (string, nullable) and `pdfGeneratedAt` (timestamp, nullable)
- **Storage Methods**: Added `updateReceiptUrl()` to IStorage interface for PDF URL updates
- **Data Integrity**: Prevents duplicate PDF generation with existence checks

### Backend Integration
- **Checkout Flow**: Integrated PDF generation after successful gift card creation
- **Public Endpoint**: `GET /api/public/order/:orderId` for secure order details access
- **File Serving**: Express static file serving for PDF downloads from `/public/receipts/`
- **Error Handling**: Non-blocking PDF generation that doesn't affect gift card creation success

### Frontend Features
- **Success Page**: Created `/giftcard-store/success/:orderId` route with comprehensive order details
- **Download Interface**: PDF receipt download buttons in both admin dashboard and public success page
- **Admin Dashboard**: Enhanced AdminGiftCardOrders with PDF receipt download functionality
- **Responsive Design**: Mobile-optimized success page with gift card details and download links

### PDF Receipt Design
- **Professional Layout**: Branded receipt with SiZu GiftCard logo and business information
- **Complete Details**: Order ID, recipient email, gift card amount, creation date, and gift card metadata
- **Security Features**: Unique PDF filenames preventing unauthorized access
- **File Management**: Automatic file cleanup and organized storage structure

### User Experience Enhancements
- **Checkout Redirect**: Automatic redirect to success page after payment completion
- **Real-time Status**: Visual indicators for PDF generation status and email delivery
- **Download Access**: Secure PDF download links for customers and admin monitoring
- **Mobile Optimization**: Touch-friendly download buttons and responsive receipt display

## Recent Production Enhancements

### Phase IX: Complete Mobile-First Merchant Interface (June 29, 2025)
- **Merchant Dashboard Mobile Redesign**: Complete rebuild with mobile-first approach, responsive grid layouts, and touch-optimized navigation
- **Mobile Navigation System**: Fixed top navigation bar with hamburger menu, slide-out navigation panel, and quick access buttons
- **Responsive Stats Cards**: 2x2 grid on mobile, 4-column layout on desktop with optimized padding and typography scaling
- **Mobile Tabs Interface**: Custom tab implementation replacing complex Radix components, preventing React hooks conflicts
- **Gift Cards Mobile Layout**: Responsive card grid with mobile-optimized spacing, touch-friendly buttons, and collapsible filters
- **Bulk Orders Mobile View**: Stack-based layout on mobile with expandable order details and optimized information hierarchy
- **Merchant Bulk Purchase Mobile**: Two-column mobile layout with sticky order summary, responsive pricing tiers display
- **Mobile Form Optimization**: Touch-friendly inputs, proper keyboard types, optimized spacing for mobile interaction
- **Cross-Device Testing**: Verified functionality across mobile (320px+), tablet (768px+), and desktop (1024px+) breakpoints
- **Performance Enhancements**: Optimized component rendering for mobile devices with reduced chart complexity and faster loading

### Phase VIII: Comprehensive Mobile Responsiveness (June 29, 2025)
- **Admin Dashboard Mobile Optimization**: Fully responsive sidebar with mobile overlay, collapsible navigation, and touch-friendly interface
- **Merchant Dashboard Mobile Enhancement**: Responsive tab navigation, mobile-optimized metric cards, and adaptive chart sizing
- **Cross-Device Compatibility**: Optimized layouts for mobile (320px+), tablet (768px+), and desktop (1024px+) breakpoints
- **Mobile-First Design**: Prioritized mobile experience with progressive enhancement for larger screens
- **Touch-Friendly Interactions**: Larger touch targets, optimized spacing, and intuitive mobile navigation patterns
- **Responsive Data Tables**: Hidden/collapsed columns on smaller screens with essential data prioritization
- **Adaptive Typography**: Scalable text sizes and spacing optimized for readability across all device sizes
- **Performance Optimization**: Reduced chart heights and optimized rendering for mobile devices
- **Navigation Improvements**: Hamburger menu implementation, mobile sidebar overlays, and streamlined user flows

## Recent Production Enhancements

### Phase VII: Enterprise Security Architecture (June 29, 2025)
- **Email Verification Flow**: Mandatory email verification for new merchant accounts with 24-hour token expiration
- **Rate Limiting & Brute Force Protection**: Express-rate-limit middleware protecting authentication endpoints (5 login attempts per 15 mins, 3 registrations per hour)
- **Authentication Audit Logging**: Comprehensive security monitoring with timestamped logs for successful/failed login attempts including IP addresses
- **JWT Token Security**: Properly structured tokens with merchantId, role, email, business name, expiration, issuer, and audience claims
- **Password Security**: bcrypt hashing with 12 salt rounds for all merchant passwords
- **Secure Cookie Implementation**: HTTP-only, secure, SameSite strict cookies for production deployment
- **Email Verification Templates**: Professional responsive HTML/text email templates with security warnings and clear CTAs

### Phase VI: 100% Production-Ready Email System (June 29, 2025)
- **Email Delivery Monitoring**: Real-time tracking of delivery rates, bounce rates, complaint rates, and sender reputation
- **Gradual Volume Scaling**: Automatic email volume increases based on performance metrics (50→200→1000→5000→10000 daily emails)
- **Domain Authentication**: SPF, DKIM, and DMARC record generation and validation for maximum deliverability
- **Rate Limiting & Queuing**: Smart email queuing system respecting hourly/daily limits with priority-based sending
- **Anti-Spam Optimization**: Enhanced email headers, authentication markers, and content optimization for inbox delivery
- **Production Monitoring Endpoints**: Admin dashboard endpoints for monitoring email performance and domain authentication status
- **DKIM Email Signing**: Automated cryptographic signing of emails for enhanced authentication and deliverability
- **Reputation Management**: Automatic scaling down when performance degrades, scaling up when metrics are excellent

## Recent Production Enhancements

### Phase III: Public Storefront (June 28, 2025)
- **Customer-Facing Store**: Branded animated interface at /store with gift card options ($25-$250, custom amounts)
- **Complete Checkout Flow**: /checkout with recipient details, personal messages, delivery scheduling
- **Public Gift Display**: /gift/:gan pages with QR codes, download options, and sharing capabilities
- **Square Integration**: Real gift card creation and activation through Square API
- **Database Enhancement**: Added recipient/sender name fields with proper schema migration
- **React Architecture**: Proper hook implementation following React Rules of Hooks

### Phase IV: Production API & Enhanced Features (June 28, 2025)
- **Square Production API**: Full integration with Square Gift Cards API for real gift card creation, activation, and management
- **PDF Receipt Generator**: Professional branded PDF receipts with QR codes for download
- **Mobile-First Responsive Design**: Comprehensive responsive implementation for all device sizes
- **Production URL Configuration**: QR codes now use production URL (https://SiZu-GiftCardShop.replit.app) for mobile scanning
- **Enhanced Gift Card Service**: HTTP-based Square API service for production-grade gift card operations

### Phase V: Complete Payment System (June 28, 2025)
- **Square Payment Processing**: Full integration with Square Payments API for secure credit card transactions
- **Multi-Step Checkout Flow**: Gift card details → Payment form → Processing → Success confirmation
- **Square Web SDK Integration**: Frontend payment form with tokenization for PCI compliance
- **Payment Service Architecture**: Dedicated SquarePaymentService for payment processing, refunds, and order management
- **Secure Payment Flow**: Real credit card processing so customers can pay you for gift cards

### Enhanced Square Gift Cards API Integration
- **Complete API Coverage**: Implemented all Square Gift Cards API endpoints with comprehensive error handling
- **Webhook Integration**: Real-time event processing for gift_card.created, gift_card.updated, gift_card_activity.created
- **Advanced Validation**: Production-grade gift card validation with balance checking and status verification
- **Activity Management**: Full lifecycle management (activate, load, redeem, adjust balance, deactivate)
- **Customer Linking**: Support for linking/unlinking customers to gift cards
- **Retry Logic**: Exponential backoff and rate limiting handling for robust API interactions

### Admin Dashboard & Analytics
- **Real-time Metrics**: Live dashboard with comprehensive gift card analytics at /admin
- **Revenue Tracking**: Weekly revenue graphs and conversion rate monitoring
- **Activity Logging**: Complete audit trail of all gift card transactions
- **Secure Access**: Token-based admin authentication with middleware protection

### QR Code & Barcode Generation
- **Dual Format Support**: QR codes for mobile scanning, barcodes for POS systems
- **High-Quality Output**: PNG/SVG generation with customizable options
- **Email Integration**: Automated gift card delivery with embedded codes
- **Download Capabilities**: Direct download of QR codes and barcodes

### Production Features
- **Error Handling**: Comprehensive error management with proper HTTP status codes
- **Database Sync**: Real-time synchronization between Square API and local database
- **Type Safety**: Full TypeScript implementation with proper type definitions
- **Scalability**: Designed for high-volume gift card operations

## User Preferences

Preferred communication style: Simple, everyday language.

## Admin Access
- **Single Admin Dashboard**: `/admin` - The only admin interface for system management
- **Admin Login**: `/admin-login` with password: `Chayan38125114@` (Updated June 29, 2025)
- **Features**: System metrics, merchant management, email monitoring, analytics, gift card oversight