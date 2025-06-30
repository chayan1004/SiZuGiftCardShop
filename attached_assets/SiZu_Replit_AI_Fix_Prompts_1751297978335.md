
# ✅ SiZu GiftCardShop Replit AI Fix Prompts

This document contains precise, phase-by-phase Replit AI prompts based on the COMPLETE_ISSUES_INVENTORY audit. Each prompt resolves grouped bugs, security flaws, or performance issues.

---

## 🧩 Phase 1: Critical System Fixes

### 🔧 1.1: Storage File Cleanup

**Prompt:**
> Open `server/storage.ts`. Remove ALL duplicate implementations:
> - `getRecentTransactions()` around line 631
> - `createPublicGiftCardOrder()` around line 871
> - Entire duplicate block (lines 1686–1978)
> - Clean duplicate methods at 1912, 1921, 1925, 1933, 1960, 1967, 1978, 2533, 2556
> Ensure all functions exist only once with correct type signatures.

---

### 🔧 1.2: Square API Response Typing

**Prompt:**
> In `server/services/squareGiftCardService.ts`, replace all `const responseData: unknown = ...` lines with proper Zod-validated type checks.
> Example:
> ```ts
> const validated = SquareGiftCardResponseSchema.parse(responseData);
> ```

---

### 🔧 1.3: Broken Route Handlers

**Prompt:**
> Fix these issues in `server/routes.ts`:
> - Line 3863–3865: Add missing `url` field in PDF receipt response.
> - Line 4741: Fix invalid type coercion in status handler.
> - Line 4903/4915: Add `user` property to Express Request types.
> - Line 6007: Validate Square `locationId`.
> - Line 6015: Implement `updateGiftCardInfo` method in `storage.ts`.
> - Line 6023: Import or define `receiptService`.
> - Line 6052: Remove `emotionTheme` from email payload.
> - Line 6077: Implement `updateOrderStatus` method.

---

## 🔐 Phase 2: Security & Authentication

### 🛡️ 2.1: Security Middleware Setup

**Prompt:**
> In `server/app.ts`, install and apply the following:
> - `helmet()`
> - `cors()` with origin whitelist
> - `express-rate-limit` for login, registration, checkout
> - Input sanitization using `express-validator` or `validator.js`

---

### 🔐 2.2: Auth System Improvements

**Prompt:**
> Add the following features:
> - Logout route in `routes/auth.ts`
> - Session store using Redis and `express-session`
> - JWT expiration + refresh token strategy
> - Role-based access middleware: `requireAdmin`, `requireMerchant`

---

### 🧼 2.3: CSRF & XSS Mitigation

**Prompt:**
> - Use `csurf` middleware for all non-GET routes
> - Sanitize frontend inputs with `DOMPurify`
> - Sanitize backend inputs using `validator.js` or custom Zod schemas

---

## 📊 Phase 3: Admin Dashboard Fixes

**Prompt:**
> In `client/src/pages/admin/TransactionExplorerPage.tsx`, ensure `cluster` property is added in:
> - Lines 332, 339, 343, 363, 368, 373, 378, 385, 388, 391

---

## ⚙️ Phase 4: DevOps & Monitoring

**Prompt:**
> - Create Dockerfile and `docker-compose.yml`
> - Setup GitHub Actions CI with steps: lint → build → test → deploy
> - Add `/health` route and `/metrics` route in `server/app.ts`
> - Enable Winston or Pino for request + error logging

---

✅ Once each phase is complete, validate all routes, regenerate receipts, and re-run the full test suite.
