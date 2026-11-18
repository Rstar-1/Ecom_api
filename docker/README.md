# Docker Configuration

This directory contains Docker configurations for the microservices architecture (Auth, Role, and User services).

## Directory Structure

```
docker/
├── services/                           # Dockerfiles for microservices
│   ├── auth-service.Dockerfile        # Authentication service
│   ├── role-service.Dockerfile        # Role management service
│   └── user-service.Dockerfile        # User management service
├── gateway/                            # API Gateway configuration
│   └── Dockerfile                     # Gateway Dockerfile
├── nginx/                              # Nginx reverse proxy
│   └── nginx.conf                     # Nginx configuration
├── kafka/                              # Message broker
│   └── docker-compose.kafka.yml       # Kafka compose file
├── database/                           # Database configurations
│   ├── mongo.yml                      # MongoDB setup
│   └── redis.yml                      # Redis cache setup
└── docker-compose.yml                 # Main compose file
```

## Quick Start

### Starting All Services

```bash
cd docker
docker-compose up -d
docker-compose logs -f
docker-compose down
```
