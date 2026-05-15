# E-Commerce Platform Documentation

## Welcome

This documentation provides comprehensive guides for the e-commerce microservices platform. The platform is built with Node.js, MongoDB, Redis, Kafka, and Kubernetes.

---

## Quick Navigation

### 📐 Architecture
- [System Design](architecture/system-design.md) - Overall architecture and design principles
- [Microservices Flow](architecture/microservices-flow.md) - Service interactions and data flows
- [Database Design](architecture/database-design.md) - MongoDB schema and data models

### 🔌 API Documentation
- [Auth API](api/auth-api.md) - Authentication and user management
- [Product API](api/product-api.md) - Product catalog and inventory
- [Cart API](api/cart-api.md) - Shopping cart and wishlist
- [Order API](api/order-api.md) - Orders and returns

### 🚀 Deployment
- [Docker Guide](deployment/docker-guide.md) - Docker and Docker Compose setup
- [Kubernetes Guide](deployment/kubernetes-guide.md) - Kubernetes deployment
- [CI/CD Guide](deployment/ci-cd-guide.md) - GitHub Actions and deployment pipeline

### 🔒 Security
- [JWT Authentication](security/jwt-auth.md) - JWT token management
- [Role-Based Access Control](security/role-based-access.md) - User roles and permissions

### 📬 Event Streaming
- [Events Documentation](kafka/events.md) - Kafka events and event schemas
- [Topics Guide](kafka/topics.md) - Kafka topic configuration and management

---

## System Overview

### Architecture

```
┌─────────────────────────────────────┐
│         Client Applications         │
└──────────────────┬──────────────────┘
                   │ HTTP/REST
                   ▼
        ┌──────────────────────┐
        │   API Gateway        │
        │   (Port 5000)        │
        └─┬──┬──┬──┬───────────┘
          │  │  │  │
          ▼  ▼  ▼  ▼
    ┌──────────────────────────┐
    │   Microservices          │
    ├──────────────────────────┤
    │ Auth (3001)              │
    │ Product (3002)           │
    │ Cart (3003)              │
    │ Order (3004)             │
    └──────┬──────┬────────────┘
           │      │
           ▼      ▼
    ┌──────────────────────────┐
    │   Data Layer             │
    ├──────────────────────────┤
    │ MongoDB (27017)          │
    │ Redis (6379)             │
    │ Kafka (9092)             │
    └──────────────────────────┘
```

### Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Runtime | Node.js | 18+ |
| Framework | Express.js | 4.18+ |
| Database | MongoDB | 7.0+ |
| Cache | Redis | 7.0+ |
| Message Broker | Kafka | 7.5+ |
| Container | Docker | 24.0+ |
| Orchestration | Kubernetes | 1.24+ |
| CI/CD | GitHub Actions | - |

---

## Getting Started

### Local Development

1. **Clone Repository**
   ```bash
   git clone https://github.com/your-org/ecommerce-platform.git
   cd ecommerce-platform
   ```

2. **Start Services**
   ```bash
   cd docker
   docker-compose up -d
   ```

3. **Access Services**
   - API Gateway: http://localhost:5000
   - Mongo Express: http://localhost:8081
   - Redis Commander: http://localhost:8082
   - Kafka UI: http://localhost:8080

### Production Deployment

See [Kubernetes Guide](deployment/kubernetes-guide.md) for production deployment instructions.

---

## Key Features

### Authentication & Security
- JWT-based authentication
- Role-Based Access Control (RBAC)
- OAuth 2.0 integration ready
- Rate limiting and DDoS protection

### Scalability
- Horizontal scaling with Kubernetes
- Load balancing with Nginx
- Database replication and sharding
- Redis caching layer

### Reliability
- Microservices architecture
- Event-driven communication
- Dead Letter Queue for error handling
- Automatic retry logic

### Monitoring
- Prometheus metrics
- Grafana dashboards
- Centralized logging
- Distributed tracing

---

## API Examples

### Authentication

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Pass123!","name":"John"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Pass123!"}'
```

### Browse Products

```bash
# Get all products
curl http://localhost:5000/api/products

# Search products
curl "http://localhost:5000/api/products?search=iphone&category=electronics"

# Get product details
curl http://localhost:5000/api/products/507f1f77bcf86cd799439011
```

### Shopping Cart

```bash
# Add to cart
curl -X POST http://localhost:5000/api/cart/items \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"product_id":"prod_001","quantity":1}'

# Get cart
curl http://localhost:5000/api/cart \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Orders

```bash
# Create order
curl -X POST http://localhost:5000/api/orders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"cart_id":"cart_001","shipping_method":"standard"}'

# Get order details
curl http://localhost:5000/api/orders/order_001 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Common Workflows

### User Registration & Login
1. User registers with email and password
2. Account created in Auth Service
3. JWT token generated
4. Token used for subsequent API calls

### Product Purchase
1. Browse products
2. Add items to cart
3. Review cart
4. Enter shipping address
5. Process payment
6. Order confirmation

### Order Tracking
1. Customer views order history
2. Selects specific order
3. Views tracking information
4. Receives shipping updates via email

---

## Environment Variables

### Development
```env
NODE_ENV=development
LOG_LEVEL=debug
DB_URI=mongodb://admin:admin@123@mongodb:27017/auth-db?authSource=admin
REDIS_URL=redis://:redis@123@redis:6379
JWT_SECRET=dev_secret_key
```

### Production
```env
NODE_ENV=production
LOG_LEVEL=info
DB_URI=${SECURE_MONGO_URI}
REDIS_URL=${SECURE_REDIS_URI}
JWT_SECRET=${SECURE_JWT_SECRET}
```

See deployment guides for full configuration.

---

## Team Roles

### Developers
- Work with API documentation
- Deploy locally with Docker
- Follow architecture guidelines
- Write event-driven code

### DevOps Engineers
- Manage Kubernetes clusters
- Configure CI/CD pipelines
- Monitor production systems
- Handle scaling and performance

### Database Administrators
- Manage MongoDB clusters
- Optimize queries
- Handle backups and recovery
- Monitor database health

### Security Engineers
- Review authentication flows
- Audit access controls
- Manage secrets and keys
- Perform security testing

---

## Support & Resources

### Internal Documentation
- [Architecture Guide](architecture/system-design.md)
- [Database Schema](architecture/database-design.md)
- [API Specifications](api/auth-api.md)

### External Resources
- [Express.js Documentation](https://expressjs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Kafka Documentation](https://kafka.apache.org/documentation/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)

### Contact
- Architecture: architecture-team@example.com
- DevOps: devops-team@example.com
- Security: security-team@example.com

---

## Changelog

### Version 1.0.0 (April 20, 2026)
- Initial release
- Core microservices
- Authentication system
- Product catalog
- Shopping cart
- Order management
- Docker deployment
- Kubernetes support
- CI/CD pipeline

---

## Contributing

Please follow these guidelines:
1. Read the architecture documentation
2. Follow coding standards
3. Write tests for new features
4. Document API changes
5. Submit pull requests with descriptions

---

**Last Updated**: April 20, 2026  
**Version**: 1.0.0  
**Maintainers**: Platform Engineering Team
