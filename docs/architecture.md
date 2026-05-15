# System Architecture Documentation

## Overview

The e-commerce platform is built using a **microservices architecture** designed for scalability, maintainability, and high availability.

---

## Architecture Principles

1. **Microservices**: Independent, loosely coupled services
2. **Event-Driven**: Asynchronous communication via Kafka
3. **Database per Service**: Data isolation and autonomy
4. **API Gateway**: Single entry point for clients
5. **Containerization**: Docker for consistency and deployment
6. **Orchestration**: Docker Compose for local dev, Kubernetes for production

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Client Layer                      │
│          (Web, Mobile, Third-party Apps)            │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP/REST
                       ▼
┌─────────────────────────────────────────────────────┐
│               API Gateway (Port 5000)               │
│      (Request Routing, Authentication, Logging)    │
└────┬────────┬────────┬────────┬────────────────────┘
     │        │        │        │
     ▼        ▼        ▼        ▼
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│ Auth   │ │Product │ │ Cart   │ │ Order  │
│Service │ │Service │ │Service │ │Service │
│:3001   │ │:3002   │ │:3003   │ │:3004   │
└────┬───┘ └────┬───┘ └────┬───┘ └────┬───┘
     │          │          │          │
     └──────────┼──────────┼──────────┘
                │          │
                ▼          ▼
         ┌──────────────────────┐
         │   Event Bus (Kafka)  │
         │   (Async Messaging)  │
         └──────────────────────┘
                │          │
         ┌──────┴──────────┴──────┐
         │                        │
         ▼                        ▼
┌──────────────────┐    ┌──────────────────┐
│ Data Layer       │    │  Cache Layer     │
│ • MongoDB        │    │ • Redis          │
│ • Separate DBs   │    │ • Session Store  │
│   per service    │    │ • Cache          │
└──────────────────┘    └──────────────────┘
```

---

## Core Components

### 1. API Gateway
- **Purpose**: Single entry point for all client requests
- **Port**: 5000
- **Responsibilities**:
  - Request routing to microservices
  - Authentication and authorization
  - Request/response logging
  - Rate limiting
  - Error handling

### 2. Microservices

#### Auth Service (Port 3001)
- User registration and login
- JWT token generation and validation
- Password management
- User profile management

#### Product Service (Port 3002)
- Product catalog management
- Search and filtering
- Inventory management
- Product recommendations

#### Cart Service (Port 3003)
- Add/remove items from cart
- Cart management
- Cart persistence
- Checkout initiation

#### Order Service (Port 3004)
- Order creation and processing
- Order tracking
- Order history
- Payment integration

### 3. Data Layer

#### MongoDB
- Primary database for all services
- Separate databases per service for data isolation
- Replica set support for high availability

#### Redis
- Session store
- Caching layer
- Rate limiting storage

---

## Microservices Flow

### User Registration & Login Flow
1. Client sends credentials to Gateway
2. Gateway routes to Auth Service
3. Auth Service validates and creates user
4. JWT token generated and returned
5. User event published to Kafka

### Product Purchase Flow
1. User adds product to cart via Cart Service
2. User initiates checkout
3. Order Service creates order
4. Payment processing
5. Order event published to Kafka
6. Inventory updated in Product Service

### Event-Driven Communication
- Services publish events to Kafka topics
- Other services consume events asynchronously
- Enables decoupled, scalable architecture

---

## Database Design

Each service maintains its own database:

### Auth Service Database
- Users collection
- Sessions collection
- Password reset tokens

### Product Service Database
- Products collection
- Categories collection
- Inventory collection

### Cart Service Database
- Shopping carts collection

### Order Service Database
- Orders collection
- Order items collection
- Payment history

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Client | React/Next.js, Mobile Apps |
| Gateway | Node.js, Express |
| Services | Node.js, Express |
| Database | MongoDB |
| Cache | Redis |
| Event Bus | Apache Kafka |
| Container | Docker |
| Orchestration | Docker Compose, Kubernetes |
| Monitoring | Prometheus, Grafana |
| Logging | ELK Stack |
