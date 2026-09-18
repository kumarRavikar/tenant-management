# Tenant and Property Management System
# Tenant and Property Management System (TPMS)

A production-quality full-stack Tenant and Property Management platform built with React, TypeScript, Express, Prisma ORM, and PostgreSQL.
A production-quality full-stack Tenant and Property Management platform built with React, TypeScript, Express, Prisma ORM, PostgreSQL, Redis, BullMQ, Socket.IO, and Docker.

---

## 🏗️ Architecture Overview

```text
Frontend (React 19 + TypeScript + Vite + Tailwind CSS)
    ↓
Auth Feature Layer (Zod Validation + TanStack Query + Centralized Axios Client)
Feature Layer (Properties, Buildings, Floors, Units, Owners, Tenants, Leases)
    ↓
Centralized Axios Client (with HTTP-only cookies, token rotation interceptors)
    ↓
Backend API (Node.js + Express 5 + TypeScript + Helmet + CORS + Rate Limiter)
    ↓
Authentication & RBAC Layer (JWT Access/Refresh, HTTP-Only Cookies, Session Management)
Authentication & Role-Based Access Control (SUPER_ADMIN, PROPERTY_ADMIN, MANAGER, OWNER, TENANT)
    ↓
Domain Services & Transactions (prisma.$transaction for concurrency & integrity)
    ↓
Database Layer (Prisma ORM Client Singleton)
    ↓
Relational Database (PostgreSQL 14+)
Frontend (React 19 + TypeScript + Vite + Tailwind CSS + React Query)
    ↕ WebSockets (Socket.IO Client) & REST (Axios with HTTP-only cookies)
Backend API (Node.js + Express 5 + TypeScript + Socket.IO Server)
    ├── Security Layer (Helmet + CORS + JWT + RBAC Middleware + Rate Limiting)
    ├── Domain Services (Transactional mutations with prisma.$transaction)
    ├── Background Jobs (Redis + BullMQ Workers for billing, reminders, escalations)
    ├── Reporting Engine (CSV Stringifier + PDFKit PDF Document Generation)
    └── Swagger / OpenAPI Documentation (/api/docs)
    ↕
Database Layer (Prisma ORM)
    ↕
PostgreSQL Relational Database & Redis Cache/Queue
```

---

## 🔐 Authentication & RBAC (Part 2)
## 🏢 Core Modules Implemented
## 🏢 Platform Features Across All Parts

### Supported Roles
1. **`SUPER_ADMIN`**: Global unrestricted access across the entire platform and all properties.
2. **`PROPERTY_ADMIN`**: Administrative control scoped to assigned properties.
3. **`MANAGER`**: Day-to-day operations scoped to assigned properties.
4. **`OWNER`**: Landlord / owner of units within properties.
5. **`TENANT`**: Renter residing in assigned units.
### Part 1: Project Foundation & Health Monitor
- React + Vite + TypeScript frontend with Tailwind CSS.
- Express + TypeScript backend with Prisma ORM client singleton.
- Health check endpoints (`/api/health`) verifying live database connectivity.
### Part 1: Foundation & Infrastructure
- React + Vite + TypeScript frontend with Tailwind CSS and responsive design.
- Express + TypeScript backend with unified response formatting and centralized error handling.
- Prisma ORM singleton client with health checks (`/api/health`) verifying live database connectivity.

### Security Implementation
- **Password Hashing**: `bcryptjs` with salt work factor of 12. Plaintext passwords are never stored; `passwordHash` is never exposed to the client.
- **Access & Refresh Tokens**:
  - Access Token: Short-lived JWT (15 minutes).
  - Refresh Token: Long-lived cryptographically secure token (7 days) stored in the database `Session` table.
  - Refresh Token Rotation: Each refresh invalidates the prior token and rotates to a new one.
- **Cookies**: HTTP-only, `sameSite: 'lax'`, `secure: true` (in production).
- **Session Management**: Each login creates an active `Session` tracking IP address and user-agent. Users can view active sessions and revoke any session remotely.
- **Property-Scoped Authorization**: `UserProperty` junction table links managers and property admins to specific properties. The `requirePropertyScope` middleware guarantees that users without global super-admin roles cannot access or mutate unauthorized properties.
- **Input Validation**: Zod validation enforced on both frontend forms and backend routes.
- **Rate Limiting**: `express-rate-limit` protects sensitive public auth endpoints (`/login`, `/register`, `/forgot-password`).
### Part 2: Authentication & RBAC
- Supported Roles: `SUPER_ADMIN`, `PROPERTY_ADMIN`, `MANAGER`, `OWNER`, `TENANT`.
### Part 2: Authentication & Role-Based Access Control (RBAC)
- **Supported Roles**: `SUPER_ADMIN`, `PROPERTY_ADMIN`, `MANAGER`, `OWNER`, `TENANT`.
- Password hashing with `bcryptjs` (salt rounds = 12).
- Dual-token auth: 15-minute access token + rotating refresh token in `Session` table.
- Secure HTTP-only cookies, remote session revocation, password reset flow.
- Dual-token auth: 15-minute access token + rotating refresh token stored in `Session` table.
- Secure HTTP-only cookies, remote session revocation, password reset flow, and property-scoped authorization.

---
### Part 3: Properties, Owners, Tenants & Leases
### Part 3: Properties, Units, Owners, Tenants & Leases
- **Property Hierarchy**: Property → Building → Floor → Unit.
- **Unit Occupancy States**: `VACANT`, `OCCUPIED`, `UNDER_MAINTENANCE`, `RESERVED`.
- **Unit States**: `VACANT`, `OCCUPIED`, `UNDER_MAINTENANCE`, `RESERVED`.
- **Owner & Tenant Management**: Many-to-many unit ownership, tenant onboarding verification (`PENDING` → `VERIFIED`/`REJECTED`).
- **Lease Management**: Date conflict detection, transactional unit status sync to `OCCUPIED`/`VACANT`, renewal & termination.
- **Lease Management**: Date conflict detection, transactional unit status synchronization, lease renewal & termination.

### Part 4: Rent Invoicing, Payments & Maintenance Tickets
- **Rent & Invoices**: Auto-calculated invoices (`rentAmount + maintenanceAmount + lateFee - discount`), non-negative balance validation, tenant lease scoping.
- **Payments & Receipts**: Atomic transactions (`prisma.$transaction`) updating invoice status and recording payment, overpayment prevention, printable payment receipts.
- **Maintenance Tickets**: Priority (`LOW`, `MEDIUM`, `HIGH`, `URGENT`), status lifecycle, staff assignment, role-attributed comments, multi-type attachments (photos, audio voice notes, documents), and chronological audit timelines (`TicketActivity`).

### Part 5: Final Platform Layer
1. **Visitor Management**:
   - Visitor pre-approval and digital gate pass generation (`PASS-XXXXXX`).
   - Gate check-in (`POST /api/visitors/:id/check-in`) and check-out (`POST /api/visitors/:id/check-out`).
   - Package/delivery courier tracking.
   - Real-time in-app notification to unit host on visitor arrival and departure.
2. **Notifications**:
   - In-app notification system with live unread count badge and popover dropdown.
   - Single (`PATCH /api/notifications/:id/read`) and bulk (`PATCH /api/notifications/read-all`) mark-as-read endpoints.
   - Real-time notification broadcast via WebSockets.
3. **Real-Time WebSockets (Socket.IO)**:
   - Authenticated WebSocket handshake using JWT token or HTTP-only cookies.
   - Scoped socket rooms: `user:<userId>`, `property:<propertyId>`, `ticket:<ticketId>`.
   - Real-time broadcasts on ticket creation, ticket status change, staff assignment, and new comments.
4. **Background Jobs (Redis + BullMQ)**:
   - `monthlyRent`: Auto-generates missing monthly rent invoices for active leases.
   - `paymentReminders`: Detects invoices due within 3 days and sends reminder alerts.
   - `overdueReminders`: Transitions overdue invoices to `OVERDUE` and alerts tenants.
   - `leaseExpiry`: Scans active leases expiring in 30 days and sends expiration notices.
   - `maintenanceReminders`: Escalates urgent tickets pending action for over 24 hours.
5. **Dynamic Role-Based Dashboards**:
   - **`SUPER_ADMIN`**: Total properties, units, real-time occupancy rate, total revenue, pending maintenance, overdue rent.
   - **`PROPERTY_ADMIN` / `MANAGER`**: Assigned property count, unit occupancy, rent collection rate, open tickets, recent visitors (7 days).
   - **`OWNER`**: Owned units, occupancy rate, total rental income, outstanding dues, active maintenance tickets.
   - **`TENANT`**: Active lease details, upcoming invoice amount and due date, total paid amount, open maintenance tickets, pre-approved visitors.
   - *Zero hardcoded numbers — everything dynamically aggregated from PostgreSQL.*
6. **Reports & Exports**:
   - Occupancy report (by property and building).
   - Rent collection report (billed vs collected vs overdue balance).
   - Payment transaction report (filtered by date range, payment method, status).
   - Maintenance report (filtered by priority, status, and date).
   - Lease expiration report (upcoming 30/60/90 days).
   - **Instant CSV export** & **Styled PDF generation** with `pdfkit`.
7. **Swagger / OpenAPI Documentation**:
   - Interactive API documentation mounted at `http://localhost:5000/api/docs`.
8. **Docker & Container Orchestration**:
   - Multi-stage Dockerfiles for backend and frontend.
   - `docker-compose.yml` orchestrating PostgreSQL 16, Redis 7, Express backend, and Nginx-powered React frontend.
9. **CI/CD Pipeline**:
   - GitHub Actions workflow (`.github/workflows/ci.yml`) running lint, build, and automated test suites against isolated test containers.

---

### Part 4: Rent, Invoices, Payments & Maintenance Tickets
- **Rent & Invoices**:
  - `RentInvoice` model with automatic calculation: `totalAmount = rentAmount + maintenanceAmount + lateFee - discount`.
  - Non-negative balance constraint validation.
  - Lifecycle: `PENDING` → `PARTIALLY_PAID` → `PAID` / `OVERDUE` / `CANCELLED`.
  - Scoped by lease and tenant: Tenants can only view invoices for their own lease.
- **Payments & Receipts**:
  - `Payment` model supporting `ONLINE`, `CASH`, `BANK_TRANSFER`, `UPI`, `CARD`, `OTHER`.
  - Atomic database transactions (`prisma.$transaction`) ensuring payment recording and invoice status/balance update succeed together.
  - Strict overpayment prevention: payments exceeding the remaining balance are rejected.
  - Electronic receipt generation (`GET /api/payments/:id/receipt`) with printable modal in UI.
- **Maintenance Tickets**:
  - `MaintenanceTicket` with priority (`LOW`, `MEDIUM`, `HIGH`, `URGENT`) and status (`OPEN`, `ASSIGNED`, `IN_PROGRESS`, `ON_HOLD`, `RESOLVED`, `CLOSED`, `CANCELLED`).
  - Staff assignment (`POST /api/maintenance/:id/assign`).
  - Comment thread (`TicketComment`) with role attribution.
  - Multi-type attachments (`TicketAttachment`): photos (with preview), audio voice notes (with audio player), documents.
  - Automatic audit timeline (`TicketActivity`) logging every transition chronologically.
- **Storage Service Abstraction**:
  - Decoupled `IStorageProvider` interface with `LocalStorageProvider` serving `/uploads`.
  - MIME-type validation and size limits (5MB photos, 10MB audio/docs).

## 📁 Project Structure

```text
tenent-management/
├── README.md                     # Project documentation & setup instructions
├── .gitignore                    # Root gitignore excluding secrets and build outputs
├── docker-compose.yml            # Multi-container orchestration (Postgres, Redis, Backend, Frontend)
├── README.md                     # Complete project documentation
├── .github/
│   └── workflows/
│       └── ci.yml                # Automated GitHub Actions CI pipeline
│
├── backend/                      # Express + TypeScript Backend API
│   ├── .env.example              # Environment variables template
│   ├── .env                      # Local environment configuration (gitignored)
│   ├── .gitignore                # Backend-specific ignore rules
│   ├── package.json              # Backend dependencies, scripts, Jest runner
│   ├── tsconfig.json             # Strict TypeScript compiler options
│   ├── jest.config.ts            # Jest configuration with ts-jest
│   │
│   ├── prisma/                   # Prisma ORM
│   │   ├── schema.prisma         # Models: User, Session, PasswordResetToken, UserProperty, Property, Building, Floor, Unit
│   │   └── seed.ts               # Development database seeder
│   │
│   ├── Dockerfile                # Multi-stage production Docker build
│   ├── prisma/
│   │   ├── schema.prisma         # Relational database schema with indexes & constraints
│   │   └── seed.ts               # Database seeder for demo properties, units, users
│   └── src/
│       ├── server.ts             # Server entry point & graceful shutdown
│       ├── app.ts                # Express application configuration, middlewares, cookies
│       │
│       ├── config/
│       │   ├── env.ts            # Type-safe environment variable parser with JWT config
│       │   └── database.ts       # Reusable PrismaClient singleton & connection helper
│       │
│       ├── middleware/
│       │   ├── auth.middleware.ts       # requireAuth, requireRole, requirePropertyScope
│       │   ├── validation.middleware.ts # Zod request body validation
│       │   └── error.middleware.ts      # Centralized error handler & 404 middleware
│       │
│       ├── utils/
│       │   ├── response.ts       # Standardized API response formatters
│       │   └── logger.ts         # Structured console logger with timestamps
│       │
│       ├── app.ts                # Express application configuration & route mounts
│       ├── server.ts             # HTTP server with Socket.IO & BullMQ workers boot
│       ├── config/               # Database, Redis, and environment configs
│       ├── docs/
│       │   └── swagger.ts        # OpenAPI 3.0.3 specification & Swagger UI
│       ├── jobs/                 # Redis + BullMQ background schedulers & workers
│       │   ├── connection.ts     # Resilient Redis connection with exponential backoff
│       │   ├── schedulers/       # Queue registrations & programmatic triggers
│       │   └── workers/          # 5 BullMQ worker implementations
│       ├── socket/               # Socket.IO initialization, JWT auth, room emitters
│       └── modules/
│           ├── health/
│           │   ├── health.controller.ts # Health check controller (GET /api/health)
│           │   └── health.routes.ts     # Health router
│           │
│           └── auth/             # Authentication & RBAC Module
│               ├── auth.types.ts        # DTOs, interfaces, and token types
│               ├── auth.schemas.ts      # Zod validation schemas
│               ├── auth.service.ts      # Business logic: hashing, JWTs, sessions
│               ├── auth.controller.ts   # Thin controller, cookie management
│               ├── auth.routes.ts       # Rate-limited & protected endpoints
│               └── __tests__/
│                   └── auth.test.ts     # 17 automated tests (Jest + Supertest)
│           ├── auth/             # Authentication & session management
│           ├── properties/       # Property management
│           ├── buildings/        # Building hierarchy
│           ├── floors/           # Floor hierarchy
│           ├── units/            # Unit hierarchy & occupancy states
│           ├── owners/           # Owner management & unit ownership
│           ├── tenants/          # Tenant management & onboarding verification
│           ├── leases/           # Lease lifecycle & renewals
│           ├── invoices/         # Rent invoices & formula calculation
│           ├── payments/         # Payment transactions & electronic receipts
│           ├── maintenance/      # Maintenance tickets, comments, files, audit log
│           ├── visitors/         # Visitor registry, gate passes, check-in/out
│           ├── notifications/    # In-app notifications & read receipts
│           ├── dashboard/        # Dynamic role-based statistics aggregation
│           └── reports/          # Occupancy, Rent, Payment, Maintenance, Lease reports (CSV/PDF)
│
└── frontend/                     # React + Vite + Tailwind CSS Frontend
    ├── .env.example              # Frontend environment variables template
    ├── .env                      # Local frontend environment config (gitignored)
    ├── .gitignore                # Frontend-specific ignore rules
    ├── index.html                # HTML entry document
    ├── package.json              # Frontend dependencies and scripts
    ├── tsconfig.json             # Frontend TypeScript configuration
    ├── tsconfig.node.json        # Vite TypeScript configuration
    ├── vite.config.ts            # Vite bundler configuration
    ├── vitest.config.ts          # Vitest configuration with jsdom
    │
└── frontend/                     # React 19 + TypeScript + Vite Client
    ├── Dockerfile                # Multi-stage Docker build with Nginx runner
    ├── nginx.conf                # Nginx SPA routing & gzip configuration
    └── src/
        ├── main.tsx              # React application entry point
        ├── index.css             # Tailwind CSS entry & base styling
        ├── vite-env.d.ts         # Vite client type definitions
        │
        ├── app/
        │   ├── router.tsx        # React Router configuration with protected routes
        │   ├── providers.tsx     # Context & React Query Provider wrapper
        │   └── queryClient.ts    # Centralized TanStack Query client configuration
        │
        ├── components/
        │   ├── ui/               # Reusable UI elements (Button, Card, Badge)
        │   └── auth/
        │       ├── ProtectedRoute.tsx # Auth & role guard
        │       └── __tests__/
        │           └── ProtectedRoute.test.tsx # RTL tests for auth guarding
        │
        ├── features/
        │   └── auth/             # Frontend Auth Feature
        │       ├── auth.types.ts        # Client user & session types
        │       ├── auth.schemas.ts      # Zod form validation schemas
        │       ├── auth.api.ts          # Axios API service wrapper
        │       ├── auth.hooks.ts        # React Query hooks (useCurrentUser, useLogin, etc.)
        │       └── __tests__/
        │           └── LoginPage.test.tsx # RTL tests for login validation
        │
        │   └── router.tsx        # React Router routes with ProtectedRoute RBAC guards
        ├── layouts/
        │   └── RootLayout.tsx    # Header with live auth status, navbar, and footer
        │
        ├── pages/
        │   ├── HomePage.tsx      # System health & connectivity dashboard
        │   ├── DashboardPage.tsx # Protected dashboard: user profile, sessions, password
        │   ├── NotFoundPage.tsx  # 404 fallback page
        │   └── auth/
        │       ├── LoginPage.tsx
        │       ├── RegisterPage.tsx
        │       ├── ForgotPasswordPage.tsx
        │       └── ResetPasswordPage.tsx
        │
        │   └── RootLayout.tsx    # Navigation bar, live Notification bell, Socket.IO client
        ├── services/
        │   └── api.ts            # Centralized Axios instance with interceptors
        │
        └── utils/
            └── cn.ts             # Tailwind class merge utility
        │   ├── api.ts            # Centralized Axios client
        │   └── socket.ts         # Socket.IO client singleton with event listeners
        ├── features/
        │   ├── auth/             # Authentication forms, hooks, schemas
        │   ├── property/         # Property listings, cards, modals
        │   ├── lease/            # Lease tables, status badges, details
        │   ├── invoice/          # Invoice management, breakdown, modals
        │   ├── maintenance/      # Maintenance tickets, filters, details
        │   ├── visitor/          # Visitor log, gate pass code display, check-in/out
        │   ├── notification/     # Notification hooks, unread counts, mark-as-read
        │   ├── dashboard/        # Dynamic dashboard metrics API & hooks
        │   └── report/           # Report query hooks, CSV/PDF blob export
        └── pages/
            ├── DashboardPage.tsx # Dynamic KPI metrics cards & session management
            ├── visitors/         # Visitors registry page & gate pass modal
            └── reports/          # Reports page with tabs, preview table, download buttons
```

---

## 📡 API Reference

### Authentication Endpoints (`/api/auth`)

### 1. Authentication Endpoints (`/api/auth`)
| Method | Path | Auth Required | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | No | Register a new user account |
| `POST` | `/api/auth/login` | No | Authenticate user, set cookies, return user & token |
| `POST` | `/api/auth/refresh` | No | Rotate refresh token and issue new access token |
| `POST` | `/api/auth/forgot-password`| No | Request password reset token |
| `POST` | `/api/auth/reset-password` | No | Reset password using valid token |
| `GET` | `/api/auth/me` | Yes | Get authenticated user profile |
| `POST` | `/api/auth/logout` | Yes | Invalidate current session and clear cookies |
| `POST` | `/api/auth/change-password`| Yes | Change password and revoke other sessions |
| `GET` | `/api/auth/sessions` | Yes | Retrieve list of active sessions for user |
| `DELETE` | `/api/auth/sessions/:id` | Yes | Revoke a specific active session |
| `GET` | `/api/auth/admin-only` | Yes (Admin) | Verification route for `SUPER_ADMIN` / `PROPERTY_ADMIN` |
| `GET` | `/api/auth/sessions` | Yes | Retrieve active sessions |
| `DELETE`| `/api/auth/sessions/:id` | Yes | Revoke a specific active session |

### 2. Properties Endpoints (`/api/properties`)
| Method | Path | Role Required | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/properties` | All Authenticated | List properties with pagination, search, role scoping |
| `POST` | `/api/properties` | Admin | Create new property |
| `GET` | `/api/properties/:id` | All Authenticated | Get property details with full building/unit hierarchy |
| `PATCH`| `/api/properties/:id` | Admin / Manager | Update property details |
| `DELETE`| `/api/properties/:id` | `SUPER_ADMIN` | Safe delete (rejects if active leases exist) |

### 3. Buildings & Floors Endpoints (`/api/buildings`, `/api/floors`)
| Method | Path | Role Required | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/buildings` | All Authenticated | List buildings (optionally filtered by property) |
| `POST` | `/api/buildings` | Admin | Create building |
| `GET` | `/api/buildings/:id` | All Authenticated | Get building details with floors |
| `PATCH`| `/api/buildings/:id` | Admin / Manager | Update building |
| `DELETE`| `/api/buildings/:id` | Admin | Delete building |
| `GET` | `/api/floors` | All Authenticated | List floors (optionally filtered by building) |
| `POST` | `/api/floors` | Admin | Create floor |
| `GET` | `/api/floors/:id` | All Authenticated | Get floor details with units |
| `PATCH`| `/api/floors/:id` | Admin / Manager | Update floor |
| `DELETE`| `/api/floors/:id` | Admin | Delete floor |

### 4. Units Endpoints (`/api/units`)
| Method | Path | Role Required | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/units` | All Authenticated | List units with status, bedrooms, availability filters |
| `POST` | `/api/units` | Admin | Create unit |
| `GET` | `/api/units/:id` | All Authenticated | Get unit details with owners & active leases |
| `PATCH`| `/api/units/:id` | Admin / Manager | Update unit status, rent, or maintenance fees |

### 5. Owners Endpoints (`/api/owners`)
| Method | Path | Role Required | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/owners` | Admin / Manager / Owner | List owner profiles with pagination and search |
| `POST` | `/api/owners` | Admin | Create owner profile for user |
| `GET` | `/api/owners/:id` | Admin / Manager / Owner | Get owner details and owned units |
| `POST` | `/api/owners/:id/units` | Admin | Assign unit to owner with ownership percentage |

### 6. Tenants Endpoints (`/api/tenants`)
| Method | Path | Role Required | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/tenants` | Admin / Manager / Owner | List tenant profiles with onboarding filter |
| `POST` | `/api/tenants` | Admin / Tenant | Create tenant profile |
| `GET` | `/api/tenants/:id` | Admin / Manager / Tenant | Get tenant details, employment, and leases |
| `PATCH`| `/api/tenants/:id` | Admin / Manager / Tenant | Update tenant profile or review status (VERIFIED/REJECTED) |

### 7. Leases Endpoints (`/api/leases`)
| Method | Path | Role Required | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/leases` | All Authenticated | List leases (scoped by role, filter by status, property, unit) |
| `POST` | `/api/leases` | Admin / Manager | Create lease contract (prevents active overlap) |
| `GET` | `/api/leases/:id` | All Authenticated | Get lease details, tenant info, and contract terms |
| `PATCH`| `/api/leases/:id` | Admin / Manager | Update lease dates or terms |
| `POST` | `/api/leases/:id/terminate` | Admin / Manager | Terminate lease, record move-out date, revert unit to VACANT |
| `POST` | `/api/leases/:id/renew` | Admin / Manager | Create sequential renewal lease |

### 8. Invoices Endpoints (`/api/invoices`)
| Method | Path | Role Required | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/invoices` | All Authenticated | List invoices with status/month filters and role scoping |
| `POST` | `/api/invoices` | Admin / Manager / Owner | Generate rent invoice (validates `totalAmount >= 0`) |
| `GET` | `/api/invoices/:id` | All Authenticated | Get invoice details, line items, and payment history |
| `GET` | `/api/invoices/:id/payments` | All Authenticated | List payments applied to invoice |

### 9. Payments Endpoints (`/api/payments`)
| Method | Path | Role Required | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/payments` | All Authenticated | List payments ledger with method/status filters |
| `POST` | `/api/payments` | All Authenticated | Record payment in transaction (prevents overpayment) |
| `GET` | `/api/payments/:id` | All Authenticated | Get payment transaction details |
| `GET` | `/api/payments/:id/receipt` | All Authenticated | Generate official electronic receipt |

### 10. Maintenance Endpoints (`/api/maintenance`)
| Method | Path | Role Required | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/maintenance` | All Authenticated | List maintenance tickets scoped to user role |
| `POST` | `/api/maintenance` | All Authenticated | Submit new maintenance ticket |
| `GET` | `/api/maintenance/:id` | All Authenticated | Get ticket details with comments, attachments, activity |
| `PATCH`| `/api/maintenance/:id` | Staff / Assignee | Update ticket status or priority |
| `POST` | `/api/maintenance/:id/assign` | Admin / Manager | Assign staff member to ticket |
| `POST` | `/api/maintenance/:id/comments` | All Authenticated | Add comment to ticket discussion thread |
| `POST` | `/api/maintenance/:id/attachments` | All Authenticated | Upload file attachment (photo, audio, document) |
| `GET` | `/api/maintenance/:id/activity` | All Authenticated | Get chronological activity audit history |

---

## 🧪 Automated Testing

### Backend Tests (Jest + Supertest)
```bash
cd backend
npm test
```
**57 Automated Tests across 6 Suites (100% Passing)**:
**75 Automated Tests across 10 Suites (100% Passing)**:
- `auth.test.ts` (17 tests): registration, login, token rotation, session management, RBAC authorization.
- `properties.test.ts` (9 tests): property pagination, hierarchy retrieval, deletion safety checks, RBAC restrictions.
- `leases.test.ts` (6 tests): active lease date conflict detection, transactional unit occupancy updates, lease termination, renewal.
- `invoices.test.ts` (6 tests): formula calculation, negative total rejection, duplicate billing month conflict, tenant scoping.
- `payments.test.ts` (5 tests): atomic transaction update, balance check, overpayment rejection, receipt generation.
- `maintenance.test.ts` (14 tests): ticket creation, assignment, status transitions, activity logging, comments, file attachments.
- `visitors.test.ts` (6 tests): visitor pre-approval, gate pass code generation, property-unit verification, gate check-in, gate check-out.
- `notifications.test.ts` (4 tests): notification listing with unread count, mark-as-read, mark-all-as-read, authorization guard.
- `dashboard.test.ts` (2 tests): dynamic KPI aggregations for `SUPER_ADMIN` and `TENANT`.
- `reports.test.ts` (6 tests): occupancy report JSON & CSV export, rent collection summary, lease expiration window, RBAC access guards.

### Frontend Tests (Vitest + React Testing Library)
```bash
cd frontend
npm test
npm test -- --run
```
**16 Automated Tests across 6 Suites (100% Passing)**:
**21 Automated Tests across 9 Suites (100% Passing)**:
- `LoginPage.test.tsx` (3 tests): form controls, Zod client validation, authentication error states.
- `ProtectedRoute.test.tsx` (4 tests): redirect unauthenticated users, RBAC role guard validation.
- `PropertiesPage.test.tsx` (2 tests): table rendering, search, create property modal.
- `LeasesPage.test.tsx` (2 tests): lease directory, unit and tenant rendering, create lease modal.
- `InvoicesPage.test.tsx` (3 tests): billing metrics, invoice status badges, invoice creation modal, payment modal.
- `MaintenancePage.test.tsx` (2 tests): ticket list, priority badges, new request modal.
- `VisitorsPage.test.tsx` (2 tests): visitor registry, digital gate pass code display, check-in button, pre-approve modal.
- `ReportsPage.test.tsx` (2 tests): report tab navigation, summary metric cards, table rendering, CSV and PDF export triggers.
- `DashboardPage.test.tsx` (1 test): dynamic platform performance KPI cards and account overview.

---

## 🚀 Running the Application

### 1. Start the Backend API
### 1. Database Setup
### Option 1: Docker Compose (Recommended)
Run all 4 services (PostgreSQL, Redis, Backend, Frontend) with a single command:
```bash
cd backend
npx prisma migrate dev
npx tsx prisma/seed.ts
docker-compose up --build
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000`
- Swagger Documentation: `http://localhost:5000/api/docs`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

### 2. Start Backend API
---

### Option 2: Running Locally

#### 1. Database & Cache
Ensure PostgreSQL and Redis are running locally.

#### 2. Backend Setup
```bash
cd backend
cp .env.example .env # configure database & redis connection
npm install
npx prisma migrate dev
npx tsx prisma/seed.ts
npm run dev
```
Runs at `http://localhost:5000`.
Backend runs at `http://localhost:5000`.

### 2. Start the Frontend Application
### 3. Start Frontend Application
#### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Runs at `http://localhost:5173`.
Frontend runs at `http://localhost:5173`.

### 3. Production Builds
### 4. Build for Production
```bash
# Build backend to dist/
# Backend
cd backend && npm run build
---

# Build frontend to dist/
# Frontend
cd frontend && npm run build
## 📖 API Documentation

Interactive Swagger / OpenAPI 3.0 documentation is available at:
```text
http://localhost:5000/api/docs
```
Explore, test, and view schemas for all endpoints including Authentication, Properties, Units, Leases, Invoices, Payments, Maintenance, Visitors, Notifications, Dashboard, and Reports.
