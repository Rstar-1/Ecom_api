# Docker Deployment Guide

## Overview

This guide covers deploying the e-commerce platform using Docker and Docker Compose. Docker ensures consistency across development, testing, and production environments.

---

## Prerequisites

- Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- Docker Compose v1.29+
- Git for version control
- At least 8GB RAM available
- Minimum 50GB disk space

### Installation

**Windows/Mac**:
- Download [Docker Desktop](https://www.docker.com/products/docker-desktop)
- Install and run

**Linux**:
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

---

## Project Structure

```
ecommerce-platform/
├── docker/
│   ├── services/
│   ├── gateway/
│   ├── nginx/
│   ├── kafka/
│   ├── database/
│   ├── docker-compose.yml
│   └── README.md
├── services/
│   ├── auth-service/
│   ├── product-service/
│   ├── cart-service/
│   └── order-service/
└── gateway/
```

---

## Building Images

### Option 1: Use Pre-built Images (Recommended for Dev)

```bash
cd docker
docker-compose up -d
```

This builds all services automatically.

### Option 2: Build Manually

```bash
# Build specific service
docker build -f docker/services/auth-service.Dockerfile \
  -t ecommerce/auth-service:latest .

# Build all services
docker build -f docker/services/product-service.Dockerfile \
  -t ecommerce/product-service:latest .

# Build gateway
docker build -f docker/gateway/Dockerfile \
  -t ecommerce/gateway:latest .
```

### Build Arguments

```bash
docker build \
  --build-arg NODE_ENV=production \
  --build-arg NPM_TOKEN=<token> \
  -t ecommerce/auth-service:1.0.0 \
  -f docker/services/auth-service.Dockerfile .
```

---

## Starting Services

### Development Environment

```bash
# Navigate to docker directory
cd docker

# Start all services in background
docker-compose up -d

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f auth-service
docker-compose logs -f product-service
```

### Production Environment

```bash
# Create .env file with production values
cat > .env.prod << EOF
NODE_ENV=production
LOG_LEVEL=info
DB_POOL_SIZE=100
REDIS_POOL_SIZE=50
EOF

# Start services
docker-compose -f docker-compose.yml \
  --env-file .env.prod up -d
```

---

## Configuration

### Environment Variables

Edit `docker-compose.yml` or create `.env` file:

```env
# Application
NODE_ENV=production
LOG_LEVEL=info

# Database
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=admin@123
MONGO_REPLICA_SET_ENABLED=true

# Redis
REDIS_PASSWORD=redis@123

# Kafka
KAFKA_BROKER_ID=1
KAFKA_BROKER_RACK=rack1

# Services
AUTH_SERVICE_PORT=3001
PRODUCT_SERVICE_PORT=3002
CART_SERVICE_PORT=3003
ORDER_SERVICE_PORT=3004
GATEWAY_PORT=5000

# Security
JWT_SECRET=your_super_secret_key
JWT_EXPIRY=3600

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### Service Configuration

Each service has its own environment configuration:

```yaml
auth-service:
  environment:
    NODE_ENV: production
    DB_URI: mongodb://admin:admin@123@mongodb:27017/auth-db?authSource=admin
    REDIS_URL: redis://:redis@123@redis:6379
    JWT_SECRET: ${JWT_SECRET}
    LOG_LEVEL: ${LOG_LEVEL}
```

---

## Scaling Services

### Horizontal Scaling

Scale specific services:

```bash
# Scale auth service to 3 instances
docker-compose up -d --scale auth-service=3

# Scale product service
docker-compose up -d --scale product-service=2

# View scaled services
docker-compose ps
```

### Load Balancing

Nginx automatically load balances traffic across service instances.

---

## Data Persistence

### Volume Management

```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect ecommerce_mongo-data

# Backup volume
docker run --rm -v ecommerce_mongo-data:/data \
  -v $(pwd):/backup \
  ubuntu tar czf /backup/mongo-backup.tar.gz -C /data .

# Restore volume
docker run --rm -v ecommerce_mongo-data:/data \
  -v $(pwd):/backup \
  ubuntu tar xzf /backup/mongo-backup.tar.gz -C /data
```

### Database Backup

```bash
# Backup MongoDB
docker-compose exec mongodb mongodump \
  -u admin -p admin@123 \
  -o /backup \
  --authenticationDatabase admin

# Backup Redis
docker-compose exec redis redis-cli \
  -a redis@123 \
  BGSAVE
```

---

## Networking

### Network Configuration

```yaml
networks:
  ecommerce-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
```

### Service Discovery

Services communicate via service names:

```
mongodb://admin:admin@123@mongodb:27017
redis://redis:6379
kafka://kafka:29092
```

### Port Mapping

| Service | Internal | External |
|---------|----------|----------|
| Auth Service | 3001 | 3001 |
| Product Service | 3002 | 3002 |
| Cart Service | 3003 | 3003 |
| Order Service | 3004 | 3004 |
| Gateway | 5000 | 5000 |
| Nginx | 80 | 80 |
| MongoDB | 27017 | 27017 |
| Redis | 6379 | 6379 |
| Kafka | 9092 | 9092 |
| Mongo Express | 8081 | 8081 |
| Redis Commander | 8082 | 8082 |

---

## Monitoring & Logs

### View Logs

```bash
# All services
docker-compose logs

# Specific service
docker-compose logs auth-service

# Follow logs (real-time)
docker-compose logs -f product-service

# Last 100 lines
docker-compose logs --tail=100

# Since specific time
docker-compose logs --since 10m
```

### Health Checks

```bash
# Check service health
docker-compose ps

# Get container stats
docker stats

# Inspect service
docker-compose exec auth-service curl http://localhost:3001/health
```

---

## Troubleshooting

### Common Issues

#### Port Already in Use

```bash
# Find process using port
lsof -i :5000

# Kill process
kill -9 <PID>

# Or use alternative port in compose file
ports:
  - "5001:5000"
```

#### Out of Memory

```bash
# Increase Docker memory limit
# In Docker Desktop settings: Preferences → Resources → Memory

# Or limit service memory
services:
  auth-service:
    mem_limit: 512m
```

#### Service Won't Start

```bash
# Check logs
docker-compose logs auth-service

# Rebuild service
docker-compose build --no-cache auth-service

# Restart service
docker-compose restart auth-service
```

#### Database Connection Issues

```bash
# Check MongoDB status
docker-compose exec mongodb mongosh -u admin -p admin@123

# Test connectivity
docker-compose exec auth-service ping mongodb

# Check network
docker network inspect ecommerce_ecommerce-network
```

---

## Updates & Upgrades

### Updating Images

```bash
# Pull latest images
docker-compose pull

# Rebuild services
docker-compose build

# Restart with new images
docker-compose up -d
```

### Rolling Updates

```bash
# Update one service at a time
docker-compose up -d --no-deps --build auth-service
docker-compose up -d --no-deps --build product-service
docker-compose up -d --no-deps --build cart-service
docker-compose up -d --no-deps --build order-service
```

---

## Security Best Practices

### Secrets Management

```bash
# Use Docker secrets (Swarm mode)
echo "your_secret_value" | docker secret create jwt_secret -

# Reference in compose file
services:
  auth-service:
    secrets:
      - jwt_secret
```

### Image Security

```bash
# Scan images for vulnerabilities
docker scan ecommerce/auth-service:latest

# Use minimal base images
FROM node:18-alpine  # ~150MB vs 900MB

# Don't run as root
USER node
```

### Network Security

```yaml
networks:
  ecommerce-network:
    driver: bridge
  
  # Separate networks for different tiers
  frontend:
    driver: bridge
  backend:
    driver: bridge
```

---

## Performance Optimization

### Resource Limits

```yaml
services:
  auth-service:
    resources:
      limits:
        cpus: '0.5'
        memory: 512M
      reservations:
        cpus: '0.25'
        memory: 256M
```

### Caching

```bash
# Enable layer caching during build
docker build --cache-from ecommerce/auth-service:latest ...

# Clear cache if needed
docker system prune -a
```

---

## Cleanup

### Stop Services

```bash
# Stop running services
docker-compose stop

# Stop and remove containers
docker-compose down

# Remove everything including volumes
docker-compose down -v

# Remove images too
docker-compose down -v --rmi all
```

### System Cleanup

```bash
# Remove unused containers
docker container prune

# Remove unused images
docker image prune

# Remove unused volumes
docker volume prune

# Complete cleanup
docker system prune -a
```

---

## Advanced Topics

### Custom Networks

```yaml
networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge

services:
  nginx:
    networks:
      - frontend
  
  auth-service:
    networks:
      - frontend
      - backend
  
  mongodb:
    networks:
      - backend
```

### Multi-stage Builds

```dockerfile
# Build stage
FROM node:18-alpine as builder
WORKDIR /app
COPY . .
RUN npm ci && npm run build

# Runtime stage
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY package*.json ./
RUN npm ci --only=production
CMD ["npm", "start"]
```

---

## References

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Guide](https://docs.docker.com/compose/)
- [Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Security Best Practices](https://docs.docker.com/engine/security/)
