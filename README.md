# MyBasket — Full-Stack Microservices Grocery App

A modern, full-featured grocery shopping application built with **Next.js 15** (App Router) and a **Node.js microservices** backend. Features JWT authentication, multi-step checkout, AI-powered recommendations, and a fully responsive UI built with shadcn/ui + Tailwind CSS.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│  Next.js Frontend (Port 9002)                               │
│  React 19 · App Router · shadcn/ui · Tailwind CSS           │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP (Bearer JWT)
┌────────────────────────▼────────────────────────────────────┐
│  API Gateway (Port 3000)                                    │
│  Express · Helmet · CORS · Rate Limiting · JWT Auth Middleware│
└──┬──────────┬──────────┬──────────┬──────────┬──────────────┘
   │          │          │          │          │
┌──▼──┐  ┌───▼──┐  ┌───▼──┐  ┌───▼──┐  ┌───▼──┐
│Prod.│  │Cart  │  │Order │  │ AI   │  │User  │
│Svc  │  │Svc   │  │Svc   │  │ Svc  │  │Svc   │
│3001 │  │3002  │  │3003  │  │3004  │  │3005  │
└─────┘  └──────┘  └──────┘  └──────┘  └──────┘
```

### Microservices

| Service | Port | Persistence | Description |
|---------|------|-------------|-------------|
| **API Gateway** | 3000 | — | Central routing, JWT auth enforcement, rate limiting, CORS |
| **Product Service** | 3001 | In-memory | Product catalog with filtering, search & pagination |
| **Cart Service** | 3002 | JSON file | Per-user shopping carts with product enrichment |
| **Order Service** | 3003 | JSON file | Order creation, history, status management |
| **AI Service** | 3004 | — | Gemini-powered grocery suggestions & recommendations |
| **User Service** | 3005 | JSON file | Registration, login, JWT issuance, profile CRUD |

---

## ✨ Features

### Authentication & Accounts
- JWT-based authentication (24h expiry) with bcrypt password hashing
- User registration, login, profile update, and account deletion
- Auth-aware header with user dropdown (account, logout)
- Protected routes — cart, checkout, orders, account redirect to login when unauthenticated

### Shopping Experience
- Product catalog with grid/card layout and "Add to Cart" buttons
- Real-time cart badge count in header
- Cart page with quantity controls and item removal
- AI-powered grocery suggestions based on cart contents

### Professional Checkout (3-Step)
1. **Shipping** — Full address form (first/last name, street, apt, city, state, zip, country, phone), shipping method selection (Standard free / Express $9.99), billing address with "same as shipping" toggle
2. **Payment** — Credit card, debit card, or cash-on-delivery selection with card number (auto-formatted), name, expiry, CVV fields
3. **Review** — Order items, shipping/payment summaries with edit links, price breakdown (subtotal + shipping + 8% tax)

- Pre-populates first/last name from logged-in user profile
- Red `*` required field indicators with red border validation on submit
- Sticky order summary sidebar with trust badges
- Step indicator with progress line

### Order History
- Compact order list with status badges, item count, and totals
- Individual order detail page showing items, price breakdown, shipping address, billing address, and payment method (from actual order data — not hardcoded)

### UI & Accessibility
- WCAG AA color contrast compliance (all CSS variables verified)
- Unified dark-green bold buttons throughout the app
- Responsive layout (mobile + desktop)
- Descriptive placeholder text (no sample data illusions)
- shadcn/ui component library (30+ components)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm

### 1. Install dependencies
```bash
npm install
npm run microservices:install
```

### 2. Start microservices
```bash
npm run microservices:start
```

### 3. Start the frontend (new terminal)
```bash
npm run dev
```

### 4. Verify health
```bash
npm run microservices:health
```

**URLs:**
- Frontend: http://localhost:9002
- API Gateway: http://localhost:3000
- Swagger docs: http://localhost:300X/api-docs (each service)

### Docker (production-like)
```bash
npm run docker:build
npm run docker:up
# npm run docker:down to stop
```

---

## 📋 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Next.js frontend (dev mode) |
| `npm run build` | Build the Next.js application |
| `npm run start` | Start Next.js in production mode |
| `npm run microservices:install` | Install deps for all microservices |
| `npm run microservices:start` | Start all microservices (dev mode) |
| `npm run microservices:stop` | Stop all running microservices |
| `npm run microservices:health` | Health-check all microservices |
| `npm run docker:build` | Build all Docker images |
| `npm run docker:up` | Start all services with Docker Compose |
| `npm run docker:down` | Stop and remove Docker containers |
| `npm run docker:logs` | View logs from all services |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript type checking |

---

## 🔧 API Reference

### Authentication (via API Gateway → User Service)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/users/register` | No | Register new user |
| POST | `/api/users/login` | No | Login, returns JWT |
| GET | `/api/users/:id` | Yes | Get user profile |
| PUT | `/api/users/:id` | Yes | Update profile |
| DELETE | `/api/users/:id` | Yes | Delete account |

### Products (Port 3001)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List products (supports `?search=`, `?category=`, `?page=`, `?limit=`) |
| GET | `/api/products/:id` | Get single product |
| GET | `/api/categories` | Get product categories |

### Cart (Port 3002) — Auth required

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cart/:userId` | Get user's cart |
| POST | `/api/cart/:userId/items` | Add item (`{productId, quantity}`) |
| PUT | `/api/cart/:userId/items/:productId` | Update quantity |
| DELETE | `/api/cart/:userId/items/:productId` | Remove item |
| DELETE | `/api/cart/:userId` | Clear cart |

### Orders (Port 3003) — Auth required

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/orders/:userId` | Create order (items, addresses, payment) |
| GET | `/api/orders/:userId` | Get user's order history |
| GET | `/api/orders/:userId/:orderId` | Get specific order details |
| PUT | `/api/orders/:userId/:orderId/status` | Update order status |

### AI Recommendations (Port 3004)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/recommendations/grocery-suggestions` | AI grocery suggestions |
| POST | `/api/recommendations/personalized` | Personalized recommendations |

### Gateway Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | System-wide health check |
| GET | `/info` | Gateway & service info |

---

## 🧪 Testing with curl

```bash
# Register
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"pass","name":"Demo User","email":"demo@test.com"}'

# Login (save token)
TOKEN=$(curl -s -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"pass"}' | jq -r '.token')

# Add to cart (authenticated)
curl -X POST http://localhost:3000/api/cart/USER_ID/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"productId":"1","quantity":2}'

# Get products (public)
curl http://localhost:3000/api/products
```

---

## 📁 Project Structure

```
├── src/
│   ├── app/                        # Next.js App Router pages
│   │   ├── page.tsx                # Home — product listing
│   │   ├── cart/page.tsx           # Cart page
│   │   ├── checkout/page.tsx       # Checkout (3-step)
│   │   ├── orders/page.tsx         # Order history
│   │   ├── orders/[id]/page.tsx    # Order detail
│   │   ├── login/page.tsx          # Login
│   │   ├── register/page.tsx       # Registration
│   │   └── account/page.tsx        # User profile management
│   ├── components/
│   │   ├── checkout/               # OrderReviewClient (multi-step)
│   │   ├── cart/                   # CartView, CartItemCard
│   │   ├── orders/                 # OrderHistoryClient, OrderDetailClient, OrderItemCard
│   │   ├── products/               # ProductCard, ProductList
│   │   ├── recommendations/        # GrocerySuggestions (AI)
│   │   ├── layout/                 # AppLayout, Header, Footer
│   │   └── ui/                     # 30+ shadcn/ui components
│   ├── contexts/
│   │   ├── AuthContext.tsx          # JWT auth state (login/register/logout)
│   │   └── ApiCartContext.tsx       # Cart state (auth-aware)
│   ├── hooks/                      # useCart, useApiCart, useApiOrders, useToast
│   └── lib/
│       ├── api/client.ts           # Unified API client class
│       ├── types.ts                # TypeScript interfaces
│       ├── session.ts              # Session/userId helpers
│       └── utils.ts                # Tailwind merge utilities
├── microservices/
│   ├── api-gateway/                # Express gateway + JWT middleware
│   ├── product-service/            # Product catalog
│   ├── cart-service/               # Cart management (JSON persistence)
│   ├── order-service/              # Order management (JSON persistence)
│   ├── ai-service/                 # Gemini AI recommendations
│   └── user-service/               # Auth + user CRUD (JSON persistence)
├── scripts/                        # start/stop/health/build scripts
├── docker-compose.yml
└── Dockerfile
```

---

## 🔒 Environment Variables

### Frontend (`.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Microservices
```
NODE_ENV=development
JWT_SECRET=mybasket-secret-key-change-in-production
PRODUCT_SERVICE_URL=http://localhost:3001
CART_SERVICE_URL=http://localhost:3002
ORDER_SERVICE_URL=http://localhost:3003
AI_SERVICE_URL=http://localhost:3004
USER_SERVICE_URL=http://localhost:3005
```

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Services won't start | `npm run microservices:stop` then restart. Check ports are free. |
| Frontend can't connect | Verify services: `npm run microservices:health`. Check `.env.local`. |
| 401 Unauthorized | Login first. JWT expires after 24h — re-login to get a fresh token. |
| Swagger "Failed to fetch" | Gateway CORS/Helmet is configured. Ensure gateway is running on port 3000. |
| Docker issues | `docker system prune -f` then `npm run docker:build`. |

---

## 📈 Scaling Considerations

- Each microservice scales independently
- JSON file persistence is demo-only — swap to PostgreSQL/MongoDB for production
- Add Redis for session caching and rate limiting state
- Use a message queue (RabbitMQ/Kafka) for async order processing
- Deploy behind a reverse proxy (Nginx/Traefik) with TLS
- Container orchestration via Kubernetes or ECS

---

## 📄 License

This project is for educational purposes. Feel free to use and modify as needed.
