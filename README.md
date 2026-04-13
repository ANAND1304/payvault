# PayVault — Production-Grade Payment Gateway

A full-stack payment gateway simulation built with Spring Boot + React, inspired by modern fintech products like Razorpay. Designed with clean architecture, JWT security, and realistic payment simulation.

---

## Tech Stack

| Layer      | Technology                                           |
|------------|------------------------------------------------------|
| Backend    | Java 17, Spring Boot 3.2, Spring Security, JPA       |
| Database   | MySQL 8+                                             |
| Auth       | JWT (jjwt 0.12.3), BCrypt                            |
| Frontend   | React 18, Vite, Tailwind CSS, Zustand, Recharts      |
| Async      | Spring @Async (webhook dispatch)                     |

---

## Project Structure

```
payvault/
├── backend/
│   ├── src/main/java/com/payvault/
│   │   ├── config/          # Security, CORS config
│   │   ├── controller/      # REST controllers (Auth, Order, Payment, Transaction)
│   │   ├── dto/             # Request/Response DTOs
│   │   │   ├── request/
│   │   │   └── response/
│   │   ├── entity/          # JPA entities + enums
│   │   ├── exception/       # Custom exceptions + GlobalExceptionHandler
│   │   ├── filter/          # JwtAuthFilter
│   │   ├── repository/      # Spring Data JPA repos
│   │   ├── service/impl/    # Business logic services
│   │   └── util/            # JwtUtil, ReferenceGenerator
│   └── src/main/resources/
│       └── application.properties
└── frontend/
    └── src/
        ├── components/
        │   ├── dashboard/   # DashboardLayout (sidebar + topbar)
        │   └── shared/      # StatCard, StatusBadge, Spinner, EmptyState
        ├── pages/           # LoginPage, RegisterPage, DashboardPage, etc.
        ├── services/        # api.js (axios + interceptors)
        ├── store/           # Zustand auth store (persisted)
        └── App.jsx          # Route definitions
```

---

## Setup Instructions

### Prerequisites
- Java 17+
- Maven 3.8+
- MySQL 8+
- Node.js 18+

### 1. Database Setup

```sql
CREATE DATABASE payvault_db;
CREATE USER 'payvault'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON payvault_db.* TO 'payvault'@'localhost';
FLUSH PRIVILEGES;
```

### 2. Backend Setup

```bash
cd backend

# Edit application.properties
# Set your MySQL credentials:
# spring.datasource.username=payvault
# spring.datasource.password=your_password

mvn clean install
mvn spring-boot:run
# Starts on http://localhost:8080
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
# Starts on http://localhost:5173
```

---

## API Documentation

### Auth Endpoints (Public)

| Method | Endpoint              | Description        |
|--------|-----------------------|--------------------|
| POST   | /api/v1/auth/register | Register user      |
| POST   | /api/v1/auth/login    | Login              |

**Register Request:**
```json
{
  "email": "merchant@company.com",
  "password": "securepass",
  "fullName": "John Doe",
  "businessName": "Acme Corp",
  "phone": "+919876543210",
  "role": "MERCHANT"
}
```

**Login Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGci...",
    "tokenType": "Bearer",
    "userId": "uuid",
    "email": "merchant@company.com",
    "role": "MERCHANT",
    "apiKey": "pvt_abc123..."
  }
}
```

---

### Order Endpoints (Merchant Auth Required)

| Method | Endpoint                    | Description            |
|--------|-----------------------------|------------------------|
| POST   | /api/v1/orders              | Create payment order   |
| GET    | /api/v1/orders              | List orders (paginated)|
| GET    | /api/v1/orders/{reference}  | Get order by reference |
| GET    | /api/v1/orders/dashboard/stats | Dashboard analytics |

**Create Order Request:**
```json
{
  "amount": 1499.00,
  "currency": "INR",
  "description": "Premium Plan Subscription",
  "customerEmail": "customer@email.com",
  "customerName": "Jane Smith",
  "customerPhone": "+919876543210"
}
```

---

### Payment Endpoints (Public)

| Method | Endpoint                    | Description                |
|--------|-----------------------------|----------------------------|
| GET    | /api/v1/pay/link/{token}    | Get order by payment token |
| POST   | /api/v1/pay/process         | Process payment            |
| POST   | /api/v1/pay/retry/{txnId}   | Retry failed payment       |

**Process Payment Request:**
```json
{
  "orderReference": "ORD-240413-ABCD1234",
  "paymentMethod": "CARD",
  "cardNumber": "4111111111111111",
  "cardHolderName": "JOHN DOE",
  "expiryMonth": "08",
  "expiryYear": "27",
  "cvv": "123"
}
```

---

### Transaction Endpoints (Merchant Auth Required)

| Method | Endpoint                    | Description                 |
|--------|-----------------------------|-----------------------------|
| GET    | /api/v1/transactions        | List transactions (paginated)|
| GET    | /api/v1/transactions/{id}   | Get transaction by ID        |

---

## Payment Simulation Logic

```
Card ending 1111  → Always SUCCESS
Card ending 0000  → Always FAIL
All other cards   → 85% SUCCESS, 15% FAIL (configurable)

UPI / Net Banking / Wallet → Same random outcome simulation
Processing delay: 2 seconds (configurable)
Max retries: 3 per order
```

Configuration in `application.properties`:
```properties
payvault.payment.success-rate=0.85
payvault.payment.processing-delay-ms=2000
```

---

## Architecture Decisions

### Why JWT?
- Stateless — scales horizontally without shared session storage
- Self-contained claims (userId, role) eliminate DB lookups per request
- 24-hour expiry with role-based access via Spring `@PreAuthorize`

### Payment Flow
```
Customer → GET /pay/link/{token}     → Fetch order details
Customer → POST /pay/process         → Create PROCESSING transaction
Backend  → Simulate gateway (delay)  → Determine SUCCESS/FAIL
Backend  → Update order + transaction status
Backend  → Dispatch webhook async (@Async)
Customer ← Response with result
```

### Data Consistency
- `@Transactional` on all write operations
- Order status machine: CREATED → PROCESSING → PAID/FAILED
- Transaction immutable after creation; retries create new records with `parentTransactionId`
- UUID primary keys prevent enumeration attacks

### Scalability Path
1. Replace in-process webhook with Kafka/RabbitMQ
2. Add Redis for idempotency keys (prevent duplicate payments)
3. Shard by merchant_id for horizontal DB scaling
4. Extract payment simulation to a dedicated microservice
5. Add rate limiting per API key (Redis token bucket)

---

## Sample Data (Postman Collection)

### Environment Variables
```
BASE_URL = http://localhost:8080
TOKEN = (set after login)
```

### Step-by-step test flow:
1. Register merchant → save token
2. Create order → copy `paymentLink`
3. Open payment link in browser
4. Use test card `4111 1111 1111 1111` (expiry: 08/27, CVV: 123)
5. Check transaction in dashboard

---

## Security Features

- **BCrypt** (strength 12) for password hashing
- **JWT** with HMAC-SHA256 signing
- **Role-based endpoints** via `@PreAuthorize`
- **UUID order IDs** — non-guessable
- **CORS** whitelist-only
- Payment links are **token-based** (not order ID exposure)
- Global exception handler — no stack traces exposed to client

---

## Webhook Events

Events dispatched asynchronously after every payment:

| Event               | Trigger               |
|---------------------|-----------------------|
| `payment.success`   | Transaction succeeded |
| `payment.failed`    | Transaction failed    |
| `payment.processing`| Payment initiated     |

Payload example:
```json
{
  "event": "payment.success",
  "transactionReference": "TXN-240413-ABCDEFGHIJKL",
  "orderReference": "ORD-240413-ABCD1234",
  "amount": 1499.00,
  "currency": "INR",
  "status": "SUCCESS",
  "paymentMethod": "CARD",
  "timestamp": "2024-04-13T14:30:00"
}
```

---

## License

MIT — Build freely, deploy wisely.

Webpage Screenshots:-
<img width="1898" height="1030" alt="Screenshot 2026-04-14 040354" src="https://github.com/user-attachments/assets/36db46c0-2cc0-4381-b0be-f6811a903e4e" />
<img width="1909" height="1031" alt="Screenshot 2026-04-14 040313" src="https://github.com/user-attachments/assets/e5a02c38-f384-4963-a429-1ab385145aca" />
<img width="1078" height="731" alt="Screenshot 2026-04-14 040244" src="https://github.com/user-attachments/assets/fde031bf-1bc9-4912-bbf1-8cd0939e9f70" />
<img width="922" height="612" alt="Screenshot 2026-04-14 040226" src="https://github.com/user-attachments/assets/2514d2e6-4570-4b8e-9dd8-3c9508fbb36d" />
<img width="1899" height="1028" alt="Screenshot 2026-04-14 040211" src="https://github.com/user-attachments/assets/f4f903cd-5006-45ab-ac9a-ce2dcad4b93e" />
<img width="1900" height="1029" alt="Screenshot 2026-04-14 040153" src="https://github.com/user-attachments/assets/db0ffca9-40a9-4dd1-b4f0-92f9a8000d73" />
<img width="1897" height="1031" alt="Screenshot 2026-04-14 040133" src="https://github.com/user-attachments/assets/08fc882a-5ce2-44ab-bec6-fc32eebf1c4e" />
<img width="1884" height="1034" alt="Screenshot 2026-04-14 035918" src="https://github.com/user-attachments/assets/62344ebd-038a-435b-aad0-6b72c3bec623" />
<img width="1901" height="1037" alt="Screenshot 2026-04-14 035851" src="https://github.com/user-attachments/assets/9daf8d8f-210c-4532-9862-e5c4bf83ce32" />
<img width="1894" height="1031" alt="Screenshot 2026-04-14 035752" src="https://github.com/user-attachments/assets/203fdba5-2c18-40cb-98bc-268efd248090" />
<img width="1902" height="1033" alt="Screenshot 2026-04-14 035728" src="https://github.com/user-attachments/assets/2e080024-e1ab-422b-a99c-51b7c794a9c1" />
<img width="1920" height="1200" alt="Screenshot 2026-04-14 035657" src="https://github.com/user-attachments/assets/8b21aff1-96c7-4be5-8a0e-970e50244f95" />





