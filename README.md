# CampusBite - Campus Canteen Ordering System

A full-stack web application for ordering food from college campus canteens. Students and faculty can browse menus, order food, pay via UPI, and pick up with OTP verification.

## Tech Stack

- **Frontend:** React 18 + Vite + Tailwind CSS v4 + shadcn/ui-style components
- **Backend:** Node.js + Express.js (ESM)
- **Database:** PostgreSQL
- **Auth:** JWT with refresh tokens
- **Email:** Nodemailer (Gmail SMTP)
- **State:** React Context API
- **HTTP:** Axios with interceptors

## Features

### Students / Faculty
- Browse all campus food outlets
- Search and filter menu items by category
- Add to cart with quantity controls
- Checkout with UPI deep-link payments (GPay, PhonePe, Paytm, BHIM)
- Real-time order tracking with status timeline
- OTP-based pickup verification (OTP shown in-app)
- Order history with reorder capability

### Store Employees
- Dashboard with today's stats (orders, revenue)
- Order queue with real-time updates
- Accept orders, update status (preparing -> ready)
- Confirm UPI payments manually
- OTP verification for order pickup
- Full menu management (add/edit/delete items, toggle availability)
- Store settings (UPI ID, operating hours, store info)

### Authentication
- Role-based registration (Student, Faculty, Store Employee)
- Email verification with token link
- JWT access + refresh tokens with auto-refresh
- Password reset via email
- Protected routes with role-based access

## Prerequisites

- **Node.js** >= 18
- **PostgreSQL** >= 14 (local or hosted, e.g., Supabase, Neon, Railway)
- **Gmail account** with App Password for email (optional for dev)

## Setup Instructions

### 1. Clone the repository

```bash
cd CampusBite
```

### 2. Set up the database

Create a PostgreSQL database named `campusbite`:

```sql
CREATE DATABASE campusbite;
```

Tables are auto-created on first server start.

### 3. Configure environment variables

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your values:

```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://username:password@localhost:5432/campusbite
JWT_SECRET=generate-a-random-secret-string
JWT_REFRESH_SECRET=generate-another-random-secret-string
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
FROM_EMAIL=noreply@campusbite.com
FRONTEND_URL=http://localhost:5173
```

**Gmail App Password:** Go to Google Account > Security > 2-Step Verification > App passwords, generate one for "Mail".

### 4. Install dependencies

```bash
# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 5. Start the application

```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

The app will be available at `http://localhost:5173`

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/verify-email/:token` | Verify email |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password/:token` | Reset password |
| POST | `/api/auth/refresh-token` | Refresh JWT |
| POST | `/api/auth/logout` | Logout |

### Stores
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stores` | List all active stores |
| GET | `/api/stores/:id` | Get store details |
| PUT | `/api/stores/:id` | Update store (owner only) |
| GET | `/api/stores/:id/menu` | Get store menu |

### Menu Items
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/menu` | Add menu item (store owner) |
| PUT | `/api/menu/:id` | Update menu item |
| DELETE | `/api/menu/:id` | Delete menu item |
| PATCH | `/api/menu/:id/availability` | Toggle availability |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/orders` | Create order |
| GET | `/api/orders` | List orders (scoped by role) |
| GET | `/api/orders/:id` | Get order details |
| PATCH | `/api/orders/:id/payment-status` | Update payment (store) |
| PATCH | `/api/orders/:id/status` | Update order status (store) |
| POST | `/api/orders/:id/verify-otp` | Verify pickup OTP (store) |
| GET | `/api/orders/:id/poll-status` | Poll order status |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/profile` | Get profile |
| PUT | `/api/users/profile` | Update profile |

## User Flows

### Student/Faculty Order Flow
1. Register and verify email
2. Login -> Browse stores -> Select store
3. Browse menu, add items to cart
4. Proceed to checkout -> Place order
5. Pay via UPI (deep link opens UPI app)
6. Store confirms payment
7. Track order status in real-time
8. When order is "Ready", OTP is displayed in-app
9. Show OTP to store employee for pickup verification

### Store Employee Flow
1. Register as store employee (creates store automatically)
2. Login -> View dashboard
3. See incoming orders in order queue
4. Confirm UPI payment received
5. Accept order -> Mark as preparing -> Mark as ready
6. When marking ready, OTP is generated and shown to both parties
7. Customer shows OTP -> Store verifies -> Order complete

## Project Structure

```
CampusBite/
├── backend/
│   ├── src/
│   │   ├── config/          # DB and email configuration
│   │   ├── controllers/     # Route handlers
│   │   ├── middleware/       # Auth, validation, upload, error handling
│   │   ├── models/          # (schemas defined in db.js)
│   │   ├── routes/          # Express routes
│   │   ├── services/        # Email, OTP, payment services
│   │   ├── utils/           # Helpers
│   │   └── index.js         # Entry point
│   ├── public/uploads/      # Uploaded images
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/          # Reusable UI components (Button, Card, etc.)
│   │   │   ├── layout/      # Navbar, Layout
│   │   │   └── shared/      # StatusBadge, OrderTimeline, etc.
│   │   ├── contexts/        # AuthContext, CartContext
│   │   ├── hooks/           # Custom hooks (usePolling)
│   │   ├── lib/             # Utils, API client, validators
│   │   ├── pages/
│   │   │   ├── auth/        # Login, Register, Verify, Reset
│   │   │   ├── student/     # Stores, Menu, Cart, Checkout, Orders
│   │   │   └── store/       # Dashboard, Orders, Menu, Settings
│   │   ├── App.jsx          # Routes
│   │   └── main.jsx         # Entry point
│   ├── index.html
│   └── package.json
└── README.md
```

## Troubleshooting

**Database connection fails:**
- Ensure PostgreSQL is running
- Verify DATABASE_URL is correct in `.env`
- Check that the database exists

**Email not sending:**
- Enable 2-Step Verification on your Google account
- Generate an App Password (not your regular password)
- Check SMTP_USER and SMTP_PASS in `.env`

**Frontend can't reach backend:**
- Ensure backend is running on port 5000
- The Vite proxy is configured to forward `/api` requests

**UPI payment links not opening:**
- UPI deep links only work on mobile devices with UPI apps installed
- On desktop, use the manual payment confirmation flow

## Environment Variables Reference

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Backend server port | `5000` |
| `NODE_ENV` | Environment | `development` |
| `DATABASE_URL` | PostgreSQL connection string | - |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_REFRESH_SECRET` | Refresh token secret | - |
| `JWT_EXPIRES_IN` | Access token expiry | `1h` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry | `7d` |
| `SMTP_HOST` | SMTP server host | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_USER` | SMTP email address | - |
| `SMTP_PASS` | SMTP password/app password | - |
| `FROM_EMAIL` | Sender email address | - |
| `FRONTEND_URL` | Frontend URL for email links | `http://localhost:5173` |
