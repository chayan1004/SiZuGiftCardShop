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

## User Preferences

Preferred communication style: Simple, everyday language.