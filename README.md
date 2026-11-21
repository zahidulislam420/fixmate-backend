# FixMate Backend API Server

High-performance, role-based REST API for FixMate (On-demand Device & Home Appliance Repair Platform), built with **Node.js**, **Express.js**, **TypeScript**, **MongoDB Native Driver**, **JWT Authentication**, and **Stripe**.

---

## 📌 Submission Information & Live Deployment Links

- **Project Name:** FixMate
- **Backend GitHub Repository:** [https://github.com/zahidulislam420/fixmate-backend.git](https://github.com/zahidulislam420/fixmate-backend.git)
- **Frontend GitHub Repository:** [https://github.com/zahidulislam420/fixmate-client.git](https://github.com/zahidulislam420/fixmate-client.git)
- **Live Deployed API (Render):** [https://fixmate-backend-msfi.onrender.com](https://fixmate-backend-msfi.onrender.com)
- **Live Health Status:** [https://fixmate-backend-msfi.onrender.com/api/health](https://fixmate-backend-msfi.onrender.com/api/health)
- **Cloud Re-Seed Endpoint:** [https://fixmate-backend-msfi.onrender.com/api/seed?key=fixmate2026](https://fixmate-backend-msfi.onrender.com/api/seed?key=fixmate2026)

---

## 🔑 Test Credentials (Pre-seeded & Active on Live API)

| Role | Email | Password | Details & Pre-seeded State |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@fixmate.com` | `Admin123!` | Full platform access, service moderation queue & Stripe revenue monitor |
| **Technician 1** | `tech.hasan@fixmate.com` | `Tech123!` | Master Appliance & HVAC Specialist (Approved services & active jobs) |
| **Technician 2** | `tech.tanvir@fixmate.com` | `Tech123!` | Certified Electronics & Laptop Engineer (Approved & pending services) |
| **Customer 1** | `customer.sarah@fixmate.com` | `Cust123!` | Customer with active bookings & completed job ready for "Pay Now" |
| **Customer 2** | `customer.karim@fixmate.com` | `Cust123!` | Customer with paid booking & verified Stripe transaction receipt |

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
5. **Universal Wildcard CORS Architecture**
   - Dynamic reflection allowing ANY origin or port (`localhost:3000`, `*.vercel.app`, custom domains) while safely maintaining `credentials: true`.
   - Immediate handling of browser `OPTIONS` preflight requests.
6. **Admin Moderation & Revenue Tracking**
   - Approve / Reject services before they appear on public pages.
   - Promote / Demote user roles (with self-demotion prevention guard).
   - Platform-wide monitoring of bookings, users, and Stripe revenue.
7. **One-Click Cloud Seeding**
   - Cloud HTTP seed endpoint (`/api/seed?key=fixmate2026`) allowing examiners or developers to restore demo state instantly without terminal/shell access.

---

## 🛠️ Tech Stack & npm Packages

- **Runtime:** Node.js v20+
- **Language:** TypeScript
- **Framework:** Express.js 4.x
- **Database:** MongoDB Native Driver (`mongodb`)
- **Authentication & Cryptography:** `jsonwebtoken`, `bcryptjs`
- **Validation:** `zod`
- **Payments:** `stripe`
- **Media:** ImgBB API
- **Utilities:** `cors`, `dotenv`, `tsx`

---

## 💻 Environment Variables Configuration

### Production Settings (Render.com Environment)
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://<db_user>:<db_password>@fixmate.21mhhc3.mongodb.net/fixmate?retryWrites=true&w=majority
JWT_SECRET=fixmate_jwt_super_secret_key_2025_secure_token
CLIENT_URL=https://fixmate-client.vercel.app
STRIPE_SECRET_KEY=sk_test_placeholder_key_here
STRIPE_WEBHOOK_SECRET=whsec_...
IMGBB_API_KEY=f5686d899286015406d5b18b757fcb50
```

---

## 🚀 Getting Started & Local Development

### 1. Installation
```bash
pnpm install
```

### 2. Run Database Seeder Locally
```bash
pnpm seed
```

### 3. Start Development Server
```bash
pnpm dev
```

### 4. Build for Production
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

### System & Telemetry
- `GET /api/health` - Health and system uptime status
- `GET /api/seed?key=fixmate2026` - Cloud database reset and seeder trigger
