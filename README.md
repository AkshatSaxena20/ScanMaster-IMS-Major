# ScanMaster IMS — Backend API

A modular Node.js + Express + MongoDB backend for a mobile Inventory Management System with QR scanning, role-based auth, real-time stock tracking, and transaction logging.

---

## Stack

- **Runtime**: Node.js 18+
- **Framework**: Express 4
- **Database**: MongoDB 6+ (via Mongoose)
- **Auth**: JWT + bcryptjs
- **Validation**: express-validator
- **Rate Limiting**: express-rate-limit

---

## Project Structure

```
src/
├── config/
│   └── db.js                  # MongoDB connection + lifecycle
├── models/
│   ├── User.js                # bcrypt hashing, role enum (admin | staff)
│   ├── Item.js                # inventory item, isLowStock virtual
│   └── Transaction.js         # audit log with before/after snapshots
├── middleware/
│   ├── auth.js                # authenticate (JWT) + authorize (roles)
│   ├── errorHandler.js        # global error + 404 handler
│   └── validators.js          # per-route input validation rules
├── controllers/
│   ├── authController.js      # register, login, me, password update
│   ├── inventoryController.js # full item CRUD + low stock alerts
│   ├── stockController.js     # QR scan + atomic stock update
│   ├── historyController.js   # paginated transaction logs + summary
│   ├── userController.js      # admin user management
│   └── dashboardController.js # aggregated stats for admin dashboard
├── routes/
│   ├── auth.js
│   ├── inventory.js
│   ├── stock.js
│   ├── history.js
│   ├── users.js
│   └── dashboard.js
├── app.js                     # Express app, middleware, routes
└── server.js                  # Entry point, graceful shutdown

scripts/
└── seed.js                    # Dev seed data (users + items + transactions)
```

---

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
```

Edit `.env`:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/scanmaster
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=7d
LOW_STOCK_THRESHOLD=10
NODE_ENV=development
```

### 3. Seed dev data (optional)
```bash
npm run seed
```

### 4. Start
```bash
npm run dev     # nodemon (development)
npm start       # node (production)
```

---

## API Reference

### Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | ❌ | Register (staff role by default) |
| POST | `/api/auth/login` | ❌ | Login → returns JWT |
| GET | `/api/auth/me` | ✅ | Get current user |
| PATCH | `/api/auth/password` | ✅ | Update own password |
| POST | `/api/auth/admin/register` | ✅ admin | Create any role |

**Login Request:**
```json
POST /api/auth/login
{ "email": "admin@scanmaster.com", "password": "admin123" }
```

**Login Response:**
```json
{
  "success": true,
  "data": {
    "user": { "_id": "...", "name": "Admin User", "role": "admin" },
    "token": "eyJhbGciOi..."
  }
}
```

All authenticated requests require:
```
Authorization: Bearer <token>
```

---

### Stock Operations

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/scan` | ✅ | Lookup item by QR code |
| POST | `/api/update-stock` | ✅ | Stock IN or OUT |

**Scan QR:**
```json
POST /api/scan
{ "qr_code": "QR-WK-001" }
```
Response includes item details and a low stock alert if applicable.

**Update Stock:**
```json
POST /api/update-stock
{
  "item_id": "64abc...",
  "type": "OUT",
  "quantity": 3,
  "note": "Issued to engineering team"
}
```

- `type`: `"IN"` or `"OUT"`
- Stock OUT with insufficient quantity → `400` with available vs requested counts
- Uses MongoDB session + transaction to ensure atomicity

---

### Inventory

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/inventory` | ✅ | any | List all items (paginated) |
| GET | `/api/inventory/:id` | ✅ | any | Get single item |
| GET | `/api/inventory/alerts/low-stock` | ✅ | any | Items at or below threshold |
| POST | `/api/inventory` | ✅ | admin | Create item |
| PATCH | `/api/inventory/:id` | ✅ | admin | Update item metadata |
| DELETE | `/api/inventory/:id` | ✅ | admin | Soft delete (deactivate) |

**Query params for GET /inventory:**

| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 20) |
| `category` | string | Filter by category |
| `lowStock` | boolean | Show only low stock items |
| `search` | string | Search name, SKU, or category |
| `sortBy` | string | `name`, `quantity`, `updated_at` |
| `order` | string | `asc` or `desc` |

---

### Transaction History

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/history` | ✅ | List all transactions (paginated) |
| GET | `/api/history/item/:item_id` | ✅ | Transactions for a specific item |
| GET | `/api/history/summary` | ✅ | Aggregated IN/OUT counts + totals |

**Query params for GET /history:**

| Param | Description |
|-------|-------------|
| `type` | `IN` or `OUT` |
| `item_id` | Filter by item |
| `user_id` | Filter by user |
| `startDate` | ISO date string |
| `endDate` | ISO date string |
| `page`, `limit` | Pagination |

---

### Dashboard (Admin only)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/dashboard` | ✅ admin | Aggregated overview stats |

Returns: total items, low/out-of-stock counts, today's transactions, this month's IN/OUT summary, top moving items, and 10 most recent transactions.

---

### User Management (Admin only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List all users |
| GET | `/api/users/:id` | Get single user |
| PATCH | `/api/users/:id` | Update name, role, or status |
| DELETE | `/api/users/:id` | Deactivate user |

---

## Data Models

### Item
```js
{
  name: String,              // required
  sku: String,               // unique, uppercase
  qr_code: String,           // unique, used for scanning
  quantity: Number,          // min 0
  unit: String,              // default "pcs"
  category: String,
  location: String,
  low_stock_threshold: Number, // default from env
  isActive: Boolean,
  updated_at: Date,
  // virtual:
  isLowStock: Boolean        // quantity <= low_stock_threshold
}
```

### Transaction
```js
{
  item_id: ObjectId,         // ref: Item
  type: "IN" | "OUT",
  quantity: Number,          // the delta
  quantity_before: Number,   // snapshot
  quantity_after: Number,    // snapshot
  user: ObjectId,            // ref: User
  note: String,
  timestamp: Date
}
```

---

## Key Design Decisions

**Atomic stock updates** — `POST /update-stock` uses a MongoDB session and transaction. The quantity write and transaction log are committed together or rolled back together.

**Negative stock prevention** — OUT operations check available stock before any write. Returns a descriptive 400 with both available and requested quantities.

**Audit trail snapshots** — Every transaction stores `quantity_before` and `quantity_after`. History is fully reconstructable without replaying events.

**Soft deletes** — Items and users are deactivated (`isActive: false`), never hard deleted, preserving transaction history integrity.

**Low stock as virtual** — `isLowStock` is computed per-item against its own threshold at read time, so thresholds can differ per item without extra queries.

**Rate limiting** — General API: 200 req/15min. Login: 20 req/15min to throttle brute force attempts.

---

## Default Seed Credentials

After running `npm run seed`:

| Role | Email | Password |
|------|-------|----------|
| admin | admin@scanmaster.com | admin123 |
| staff | alice@scanmaster.com | staff123 |
| staff | bob@scanmaster.com | staff123 |
