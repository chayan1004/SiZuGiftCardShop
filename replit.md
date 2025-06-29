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

## Recent Production Enhancements

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