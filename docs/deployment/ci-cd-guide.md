# CI/CD Pipeline Guide

## Overview

This guide covers setting up a continuous integration and continuous deployment (CI/CD) pipeline using GitHub Actions for the e-commerce platform.

---

## GitHub Actions Workflow

### Main Build & Deploy Workflow

```yaml
# .github/workflows/build-and-deploy.yml
name: Build and Deploy

on:
  push:
    branches:
      - main
      - develop
  pull_request:
    branches:
      - main
      - develop

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service:
          - auth-service
          - product-service
          - cart-service
          - order-service

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies for ${{ matrix.service }}
        run: |
          cd services/${{ matrix.service }}
          npm ci

      - name: Run tests for ${{ matrix.service }}
        run: |
          cd services/${{ matrix.service }}
          npm run test

      - name: Run linting for ${{ matrix.service }}
        run: |
          cd services/${{ matrix.service }}
          npm run lint

      - name: Generate coverage report
        run: |
          cd services/${{ matrix.service }}
          npm run test:coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./services/${{ matrix.service }}/coverage/lcov.info

  build:
    needs: test
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    strategy:
      matrix:
        service:
          - auth-service
          - product-service
          - cart-service
          - order-service
          - gateway

    steps:
      - uses: actions/checkout@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2

      - name: Log in to Container Registry
        uses: docker/login-action@v2
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata for ${{ matrix.service }}
        id: meta
        uses: docker/metadata-action@v4
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/ecommerce/${{ matrix.service }}
          tags: |
            type=ref,event=branch
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=sha

      - name: Build and push Docker image for ${{ matrix.service }}
        uses: docker/build-push-action@v4
        with:
          context: .
          file: ./docker/services/${{ matrix.service }}.Dockerfile
          push: ${{ github.event_name != 'pull_request' }}
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=registry,ref=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/ecommerce/${{ matrix.service }}:buildcache
          cache-to: type=registry,ref=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/ecommerce/${{ matrix.service }}:buildcache,mode=max

  security-scan:
    runs-on: ubuntu-latest
    needs: build

    steps:
      - uses: actions/checkout@v3

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'

      - name: Upload Trivy results to GitHub Security
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'

  deploy-staging:
    needs: [build, security-scan]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    environment: staging

    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Kubernetes Staging
        env:
          KUBECONFIG: ${{ secrets.KUBECONFIG_STAGING }}
          DOCKER_REGISTRY_SECRET: ${{ secrets.DOCKER_REGISTRY_SECRET }}
        run: |
          kubectl set image deployment/auth-service \
            auth-service=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/ecommerce/auth-service:${{ github.sha }} \
            -n ecommerce

      - name: Verify deployment
        run: |
          kubectl rollout status deployment/auth-service -n ecommerce --timeout=5m

      - name: Run smoke tests
        run: |
          npm run test:smoke --prefix tests/

  deploy-production:
    needs: [build, security-scan]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production

    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Kubernetes Production
        env:
          KUBECONFIG: ${{ secrets.KUBECONFIG_PRODUCTION }}
        run: |
          kubectl set image deployment/auth-service \
            auth-service=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/ecommerce/auth-service:${{ github.sha }} \
            -n ecommerce
          
          kubectl set image deployment/product-service \
            product-service=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/ecommerce/product-service:${{ github.sha }} \
            -n ecommerce
          
          kubectl set image deployment/cart-service \
            cart-service=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/ecommerce/cart-service:${{ github.sha }} \
            -n ecommerce
          
          kubectl set image deployment/order-service \
            order-service=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/ecommerce/order-service:${{ github.sha }} \
            -n ecommerce

      - name: Verify deployment
        run: |
          kubectl rollout status deployment/auth-service -n ecommerce --timeout=10m

      - name: Notify deployment
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Production deployment completed'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

---

## Docker Build Optimization

### Multi-stage Build

```dockerfile
# Multi-stage build to reduce image size
FROM node:18-alpine as dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package*.json ./
USER node
EXPOSE 3001
CMD ["npm", "start"]
```

---

## Testing Strategy

### Unit Tests

```bash
# Run unit tests
npm run test

# With coverage
npm run test:coverage
```

### Integration Tests

```bash
# Start test environment
docker-compose -f docker-compose.test.yml up -d

# Run integration tests
npm run test:integration

# Cleanup
docker-compose -f docker-compose.test.yml down
```

### E2E Tests

```bash
# Run end-to-end tests
npm run test:e2e

# With headless browser
npm run test:e2e -- --headless
```

---

## Code Quality

### ESLint Configuration

```json
{
  "env": {
    "node": true,
    "es2021": true
  },
  "extends": ["eslint:recommended"],
  "rules": {
    "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "no-console": ["warn", { "allow": ["warn", "error"] }]
  }
}
```

### SonarQube Integration

```yaml
# .github/workflows/sonarqube.yml
name: SonarQube Scan

on:
  push:
    branches:
      - main
      - develop

jobs:
  sonarqube:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: SonarQube Scan
        uses: SonarSource/sonarqube-scan-action@master
        env:
          SONAR_HOST_URL: ${{ secrets.SONAR_HOST_URL }}
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
```

---

## Versioning & Release

### Semantic Versioning

```bash
# Version format: MAJOR.MINOR.PATCH
# Example: v1.2.3
```

### Release Workflow

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Create Release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ github.ref }}
          release_name: Release ${{ github.ref }}
```

---

## Deployment Strategy

### Blue-Green Deployment

```bash
# Run current (blue) and new (green) versions
kubectl apply -f deployment-green.yaml

# Switch traffic after verification
kubectl patch service gateway -p '{"spec":{"selector":{"version":"green"}}}'

# Keep blue running for rollback
```

### Canary Deployment

```yaml
# Gradually shift traffic to new version
apiVersion: fluxcd.io/v1beta1
kind: Canary
metadata:
  name: auth-service-canary
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: auth-service
  service:
    name: auth-service
  analysis:
    interval: 1m
    threshold: 5
    maxWeight: 50
    stepWeight: 10
    metrics:
    - name: request-success-rate
      thresholdRange:
        min: 99
      interval: 1m
    - name: request-duration
      thresholdRange:
        max: 500
      interval: 1m
```

---

## Monitoring & Alerts

### Prometheus Metrics

```yaml
# Scrape metrics from services
scrape_configs:
  - job_name: 'auth-service'
    kubernetes_sd_configs:
      - role: pod
        namespaces:
          names:
            - ecommerce
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_label_app]
        action: keep
        regex: auth-service
```

### AlertManager Configuration

```yaml
global:
  resolve_timeout: 5m

route:
  group_by: ['alertname', 'cluster']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 12h
  receiver: 'slack'

receivers:
  - name: 'slack'
    slack_configs:
      - api_url: ${{ secrets.SLACK_WEBHOOK }}
        channel: '#alerts'
```

---

## Infrastructure as Code

### Terraform Configuration

```hcl
# terraform/main.tf
provider "kubernetes" {
  config_path = var.kubeconfig_path
}

variable "namespace" {
  default = "ecommerce"
}

variable "replicas" {
  default = 3
}

resource "kubernetes_deployment" "auth_service" {
  metadata {
    name      = "auth-service"
    namespace = var.namespace
  }
  # ... deployment configuration
}
```

---

## Disaster Recovery

### Backup Strategy

```bash
# Daily automated backups
0 0 * * * /scripts/backup-databases.sh

# Weekly full snapshots
0 3 * * 0 /scripts/backup-volumes.sh

# Monthly archive to S3
0 4 1 * * /scripts/backup-archive-s3.sh
```

### Recovery Testing

```bash
# Monthly recovery drill
0 2 15 * * /scripts/recovery-test.sh
```

---

## Documentation

### GitHub Wiki

- Deployment runbooks
- Troubleshooting guides
- Architecture decisions
- Team processes

---

## References

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Kubernetes Deployment](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)
