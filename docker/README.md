# Docker Configuration for E-Commerce Platform

This directory contains all Docker-related configurations for the e-commerce platform microservices architecture.

## Directory Structure

```
docker/
├── services/                           # Dockerfiles for microservices
│   ├── auth-service.Dockerfile        # Authentication service
│   ├── product-service.Dockerfile     # Product service
│   ├── cart-service.Dockerfile        # Shopping cart service
│   └── order-service.Dockerfile       # Order service
├── gateway/                            # API Gateway configuration
│   └── Dockerfile                     # Gateway Dockerfile
├── nginx/                              # Nginx reverse proxy
│   └── nginx.conf                     # Nginx configuration
├── kafka/                              # Message broker
│   └── docker-compose.kafka.yml       # Kafka compose file
├── database/                           # Database configurations
│   ├── mongo.yml                      # MongoDB setup
│   └── redis.yml                      # Redis cache setup
├── docker-compose.yml                 # Main compose file (all services)
└── README.md                          # This file
```

## Quick Start

### Prerequisites
- Docker Desktop installed and running
- Docker Compose v1.29+
- At least 4GB RAM allocated to Docker

### Starting All Services

```bash
# Navigate to docker directory
cd docker

# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### Starting Individual Services

#### Only Databases
```bash
cd docker/database
docker-compose -f mongo.yml up -d
docker-compose -f redis.yml up -d
```

#### Only Message Broker
```bash
cd docker/kafka
docker-compose -f docker-compose.kafka.yml up -d
```

## Services Overview

### Microservices

#### Auth Service (Port 3001)
- User authentication and authorization
- JWT token management
- Database: MongoDB (auth-db)
- Cache: Redis

```bash
docker logs ecommerce-auth-service
```

#### Product Service (Port 3002)
- Product catalog management
- Product search and filtering
- Database: MongoDB (product-db)
- Cache: Redis
- Events: Kafka

```bash
docker logs ecommerce-product-service
```

#### Cart Service (Port 3003)
- Shopping cart management
- Add/remove items
- Database: MongoDB (cart-db)
- Cache: Redis
- Events: Kafka

```bash
docker logs ecommerce-cart-service
```

#### Order Service (Port 3004)
- Order processing
- Order history and tracking
- Database: MongoDB (order-db)
- Cache: Redis
- Events: Kafka

```bash
docker logs ecommerce-order-service
```

### API Gateway (Port 5000)
- Single entry point for all client requests
- Request routing to microservices
- Built-in middleware for authentication and validation

```bash
docker logs ecommerce-gateway
```

### Reverse Proxy - Nginx (Port 80, 443)
- Load balancing
- SSL/TLS termination (if configured)
- Static file serving
- Request compression

```bash
docker logs ecommerce-nginx
```

### Databases

#### MongoDB (Port 27017)
- Primary database for all services
- Separate databases per service for data isolation
- Credentials: admin/admin@123
- Admin UI: http://localhost:8081

```bash
docker logs ecommerce-mongodb
```

#### Redis (Port 6379)
- Caching layer
- Session management
- Password: redis@123
- Admin UI: http://localhost:8082

```bash
docker logs ecommerce-redis
```

### Message Broker

#### Kafka (Port 9092)
- Event streaming for inter-service communication
- Zookeeper coordination
- UI: http://localhost:8080

```bash
docker logs ecommerce-kafka
docker logs ecommerce-zookeeper
```

## Access Points

| Service | URL | Port | Credentials |
|---------|-----|------|-------------|
| Gateway | http://localhost:5000 | 5000 | N/A |
| Nginx | http://localhost | 80 | N/A |
| MongoDB | mongodb://localhost:27017 | 27017 | admin/admin@123 |
| Mongo Express | http://localhost:8081 | 8081 | admin/admin@123 |
| Redis | localhost:6379 | 6379 | Password: redis@123 |
| Redis Commander | http://localhost:8082 | 8082 | N/A |
| Kafka UI | http://localhost:8080 | 8080 | N/A |
| Auth Service | http://localhost:3001 | 3001 | N/A |
| Product Service | http://localhost:3002 | 3002 | N/A |
| Cart Service | http://localhost:3003 | 3003 | N/A |
| Order Service | http://localhost:3004 | 3004 | N/A |

## Environment Variables

### Main docker-compose.yml
Services use environment variables from `docker-compose.yml`:
- `NODE_ENV`: production
- `DB_URI`: MongoDB connection string
- `REDIS_URL`: Redis connection string
- `KAFKA_BROKER`: Kafka broker address
- `PORT`: Service port

### Customization
Edit `docker-compose.yml` to modify:
- Environment variables
- Port mappings
- Volume mounts
- Service dependencies
- Resource limits

## Common Commands

```bash
# Build images
docker-compose build

# Start services (detached)
docker-compose up -d

# Start services (foreground)
docker-compose up

# Stop services
docker-compose stop

# Remove services and volumes
docker-compose down -v

# View logs
docker-compose logs -f [service-name]

# Execute command in container
docker-compose exec [service-name] [command]

# Scale a service
docker-compose up -d --scale product-service=3

# Rebuild a specific service
docker-compose build [service-name]
```

## Troubleshooting

### Port Already in Use
```bash
# Find and kill process using port
# On Linux/Mac
lsof -i :8080
kill -9 <PID>

# On Windows
netstat -ano | findstr :8080
taskkill /PID <PID> /F
```

### Container Won't Start
```bash
# Check logs
docker logs [container-name]

# Inspect container
docker inspect [container-name]

# Rebuild and restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Database Connection Issues
- Ensure MongoDB and Redis are running: `docker-compose ps`
- Check credentials in `docker-compose.yml`
- Verify network connectivity: `docker network inspect ecommerce_ecommerce-network`

### Services Can't Communicate
- All services must be on the same network: `ecommerce-network`
- Use service names (e.g., `mongodb:27017`) instead of localhost
- Check firewall rules

## Performance Optimization

### Memory Management
```bash
# Limit service memory
services:
  auth-service:
    mem_limit: 512m
```

### CPU Management
```bash
# Limit service CPU
services:
  auth-service:
    cpus: '0.5'
```

### Persistent Volumes
- MongoDB data: `mongo-data` volume
- Redis data: `redis-data` volume
- Data persists even after container restart

## Security Best Practices

⚠️ **WARNING**: Default credentials are for development only!

### For Production:
1. Change default credentials in `.env` file
2. Enable SSL/TLS in Nginx configuration
3. Use Docker secrets for sensitive data
4. Implement network policies
5. Enable authentication for all services
6. Regular security updates for base images

## Network Architecture

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ (HTTP/HTTPS)
       ▼
┌─────────────────────┐
│   Nginx (Reverse    │
│   Proxy) :80/:443   │
└──────┬──────────────┘
       │
       ▼
┌──────────────────┐
│  Gateway :5000   │
└┬─────┬─────┬─────┬┘
 │     │     │     │
 ▼     ▼     ▼     ▼
Auth  Prod  Cart  Order
Svc   Svc   Svc   Svc
│     │     │     │
└─────┼─────┼─────┘
      │     │
      ▼     ▼
   ┌─────────────┐
   │  MongoDB    │
   │  Redis      │
   │  Kafka      │
   └─────────────┘
```

## Monitoring and Logging

Access monitoring dashboards:
- **Mongo Express**: http://localhost:8081
- **Redis Commander**: http://localhost:8082
- **Kafka UI**: http://localhost:8080

View service logs:
```bash
docker-compose logs -f --tail=100 [service-name]
```

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [MongoDB Docker Documentation](https://hub.docker.com/_/mongo)
- [Redis Docker Documentation](https://hub.docker.com/_/redis)
- [Nginx Docker Documentation](https://hub.docker.com/_/nginx)
- [Kafka Docker Documentation](https://hub.docker.com/r/confluentinc/cp-kafka)

## Support and Troubleshooting

For issues or questions:
1. Check logs: `docker-compose logs [service-name]`
2. Verify network: `docker network inspect ecommerce_ecommerce-network`
3. Test connectivity: `docker-compose exec [service-name] ping [another-service]`
4. Review configurations in respective Dockerfiles and .yml files

---

**Last Updated**: April 20, 2026
**Version**: 1.0.0
