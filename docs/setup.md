# Installation & Environment Setup

## Prerequisites

- Node.js v16 or higher
- Docker & Docker Compose
- MongoDB
- Redis
- Apache Kafka
- npm or yarn

---

## Environment Configuration

### Root .env File
Create `.env` in the project root:

```env
NODE_ENV=development
LOG_LEVEL=debug

# Gateway
GATEWAY_PORT=5000
GATEWAY_URL=http://localhost:5000

# Services
AUTH_SERVICE_URL=http://localhost:3001
PRODUCT_SERVICE_URL=http://localhost:3002
CART_SERVICE_URL=http://localhost:3003
ORDER_SERVICE_URL=http://localhost:3004

# Database
MONGODB_URI=mongodb://localhost:27017/ecommerce
MONGODB_AUTH_URI=mongodb://localhost:27017/auth_service
MONGODB_PRODUCT_URI=mongodb://localhost:27017/product_service
MONGODB_CART_URI=mongodb://localhost:27017/cart_service
MONGODB_ORDER_URI=mongodb://localhost:27017/order_service

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Kafka
KAFKA_BROKER=localhost:9092
KAFKA_CLIENT_ID=ecommerce-platform

# JWT
JWT_SECRET=your_jwt_secret_key_here_min_32_chars
JWT_EXPIRY=24h

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Service-Specific .env Files

Each service has its own `.env` in `services/<service-name>/`:

```env
NODE_ENV=development
SERVICE_PORT=3001
SERVICE_NAME=auth-service

DB_URI=mongodb://localhost:27017/auth_service
REDIS_URI=redis://localhost:6379

KAFKA_BROKER=localhost:9092

JWT_SECRET=your_jwt_secret_key_here_min_32_chars
JWT_EXPIRY=24h
```

---

## Installation Steps

### 1. Clone Repository
```bash
git clone <repository-url>
cd ecommerce-platform
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Install Service Dependencies
```bash
cd services/auth-service && npm install
cd ../product-service && npm install
cd ../cart-service && npm install
cd ../order-service && npm install
```

### 4. Docker Setup

#### Start all services with Docker Compose:
```bash
docker-compose -f docker/docker-compose.yml up -d
```

This starts:
- MongoDB
- Redis
- Kafka & Zookeeper
- All microservices (in production mode)

#### Or start individual services:
```bash
# MongoDB
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Redis
docker run -d -p 6379:6379 --name redis redis:latest

# Kafka
docker-compose -f docker/kafka/docker-compose.kafka.yml up -d
```

---

## Development Setup

### 1. Start Dependencies
```bash
# Terminal 1 - MongoDB
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Terminal 2 - Redis
docker run -d -p 6379:6379 --name redis redis:latest

# Terminal 3 - Kafka
docker-compose -f docker/kafka/docker-compose.kafka.yml up
```

### 2. Start Gateway
```bash
cd gateway
npm run dev
# Runs on http://localhost:5000
```

### 3. Start Microservices
```bash
# Terminal - Auth Service
cd services/auth-service
npm run dev
# Runs on http://localhost:3001

# Terminal - Product Service
cd services/product-service
npm run dev
# Runs on http://localhost:3002

# Similar for Cart and Order services on 3003 and 3004
```

### 4. Verify Services
```bash
curl http://localhost:5000/health
```

---

## Database Initialization

### Create MongoDB Indexes
```bash
npm run db:init
```

### Seed Sample Data
```bash
npm run db:seed
```

---

## Verification Checklist

- [ ] MongoDB running on port 27017
- [ ] Redis running on port 6379
- [ ] Kafka running on port 9092
- [ ] Gateway accessible on http://localhost:5000
- [ ] Auth Service on http://localhost:3001
- [ ] Product Service on http://localhost:3002
- [ ] Cart Service on http://localhost:3003
- [ ] Order Service on http://localhost:3004
- [ ] All services healthchecks pass
- [ ] Kafka topics created

---

## Production Deployment

### Using Kubernetes
```bash
kubectl apply -f infra/kubernetes/
```

### Using Docker Compose
```bash
docker-compose -f infra/docker/docker-compose.yml up -d
```

### Environment Variables for Production
- Set `NODE_ENV=production`
- Configure production database URLs
- Update JWT secret to strong value
- Configure Redis for session persistence
- Set up monitoring and logging
