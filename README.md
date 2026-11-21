# FixMate Backend API Server

High-performance, role-based REST API for FixMate (On-demand Device & Home Appliance Repair Platform), built with **Node.js**, **Express.js**, **TypeScript**, **MongoDB Native Driver**, **JWT Authentication**, and **Stripe**.

---

## 🌟 Key Features

1. **Role-Based Authentication & Authorization (Challenge 2)**
   - Strict role separation: `customer`, `technician`, `admin`.
   - Custom Express security middlewares: `verifyToken`, `verifyCustomer`, `verifyTechnician`, and `verifyAdmin`.
   - Data privacy: Users are restricted to accessing their own requests and records.
2. **Server-Side Search, Filter & Sort (Challenge 1)**
   - MongoDB-level search by keyword (title, category, service area).
   - Category filtering (`Smartphone`, `Laptop & PC`, `AC`, `Refrigerator`, `TV`, `Washing Machine`, `Electrical`).
   - Service mode filtering (`Home Visit`, `Shop Drop-off`).
   - Server-side sorting: Price Low-to-High, Price High-to-Low, Newest.
   - Server-side pagination via MongoDB `.skip()` and `.limit()`.
3. **Strict Job Status Pipeline (Challenge 3)**
   - Linear state machine enforced at server level:
     `requested` ➔ `accepted` | `rejected` (terminal) | `cancelled` (terminal by customer)
     `accepted` ➔ `in-progress`
     `in-progress` ➔ `completed` (requires positive `finalAmount`)
     `completed` + `unpaid` ➔ `paid` (via Stripe verification / webhook)
4. **Stripe Checkout & Webhook Integration (Challenge 4)**
   - Pay-after-service model: Server creates Stripe Checkout session only after job completion.
   - Price calculation lookup from database (never trusts client-supplied amount).
   - Idempotent recording of payments preventing double-charging or duplicate entries.
5. **Admin Moderation & Revenue Tracking**
   - Approve / Reject services before they appear on public pages.
   - Promote / Demote user roles (with self-demotion prevention guard).
   - Platform-wide monitoring of bookings, users, and Stripe revenue.

---

## 🔑 Test Credentials (Pre-seeded)

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@fixmate.com` | `Admin123!` | Full platform access, moderation & revenue |
| **Technician 1** | `tech.hasan@fixmate.com` | `Tech123!` | Master Appliance & HVAC Specialist |
| **Technician 2** | `tech.tanvir@fixmate.com` | `Tech123!` | Certified Electronics & Laptop Engineer |
| **Customer 1** | `customer.sarah@fixmate.com` | `Cust123!` | Test customer with active bookings |
| **Customer 2** | `customer.karim@fixmate.com` | `Cust123!` | Test customer with paid bookings |

---

## 🛠️ Tech Stack & npm Packages

- **Runtime:** Node.js v20+
- **Language:** TypeScript
- **Framework:** Express.js 4.x
- **Database:** MongoDB Native Driver (`mongodb`)
- **Authentication & Cryptography:** `jsonwebtoken`, `bcryptjs`
- **Validation:** `zod`
- **Payments:** `stripe`
- **Utilities:** `cors`, `dotenv`, `tsx`

---

## 🚀 Getting Started

### 1. Installation
```bash
pnpm install
```

### 2. Environment Variables (.env)
```env
PORT=5055
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/fixmate
JWT_SECRET=fixmate_jwt_super_secret_key_2025_secure_token
CLIENT_URL=http://localhost:3000

# Stripe Configuration (Test Mode)
STRIPE_SECRET_KEY=sk_test_placeholder_key_here
STRIPE_WEBHOOK_SECRET=whsec_placeholder_secret_here

# ImgBB Configuration
IMGBB_API_KEY=placeholder_imgbb_key
```

### 3. Run Database Seeder
```bash
pnpm seed
```

### 4. Start Development Server
```bash
pnpm dev
```

### 5. Build for Production
```bash
pnpm build
pnpm start
```

---

## 📡 API Reference Summary

### Authentication & Users
- `POST /api/auth/sign-up` - Register customer or technician
- `POST /api/auth/sign-in` - Login and receive JWT
- `GET /api/auth/me` - Authenticated user details
- `PATCH /api/users/profile` - Update profile (name, phone, area, bio, image)

### Services
- `GET /api/services` - Public search, filter, sort, and pagination
- `GET /api/services/:id` - Public service details with technician bio
- `GET /api/services/technician/my` - Logged-in technician's services
- `POST /api/services` - Create repair service (pending approval)
- `PATCH /api/services/:id` - Edit service (resets approvalStatus to pending)
- `PATCH /api/services/:id/availability` - Toggle service availability
- `DELETE /api/services/:id` - Delete service

### Bookings
- `POST /api/bookings` - Submit repair request (checks active duplicate)
- `GET /api/bookings/my` - Customer's booking history
- `PATCH /api/bookings/:id/cancel` - Cancel booking (requested state only)
- `POST /api/bookings/:id/review` - Rate and review paid booking
- `GET /api/bookings/technician` - Technician's assigned jobs
- `PATCH /api/bookings/:id/status` - Pipeline transitions: accept, reject, in-progress, completed

### Payments & Stripe
- `POST /api/payments/create-checkout-session` - Initialize Stripe checkout
- `GET /api/payments/verify` - Verify Stripe session and mark paid
- `GET /api/payments/my` - Customer payment records
- `POST /api/payments/webhook` - Stripe webhook listener with idempotency

### Admin Moderation
- `GET /api/admin/stats` - Platform counts and total revenue
- `GET /api/admin/users` - All registered accounts
- `PATCH /api/admin/users/:id/role` - Update user role
- `GET /api/admin/services` - Moderation queue with status filter
- `PATCH /api/admin/services/:id/approval` - Approve or reject service
- `GET /api/admin/bookings` - Platform-wide repair bookings
- `GET /api/admin/payments` - Platform-wide transaction ledger
