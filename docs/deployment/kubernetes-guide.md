# Kubernetes Deployment Guide

## Overview

This guide covers deploying the e-commerce platform on Kubernetes for production-grade orchestration, auto-scaling, and high availability.

---

## Prerequisites

- Kubernetes cluster (1.24+)
- kubectl installed and configured
- Docker images pushed to container registry
- Persistent storage provisioner
- Ingress controller (Nginx or similar)

---

## Kubernetes Architecture

```
Ingress (Nginx)
    ↓
Namespace: ecommerce
├── Services
│   ├── auth-service
│   ├── product-service
│   ├── cart-service
│   └── order-service
├── Deployments
│   ├── auth-service (3 replicas)
│   ├── product-service (3 replicas)
│   ├── cart-service (3 replicas)
│   ├── order-service (2 replicas)
│   └── nginx-gateway (2 replicas)
├── ConfigMaps (configuration)
├── Secrets (sensitive data)
├── PersistentVolumes (data)
└── StatefulSets
    ├── mongodb
    ├── redis
    └── kafka
```

---

## Namespace Setup

```yaml
# namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: ecommerce
  labels:
    environment: production
```

Deploy:
```bash
kubectl apply -f namespace.yaml
```

---

## ConfigMaps

```yaml
# configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: ecommerce
data:
  NODE_ENV: production
  LOG_LEVEL: info
  AUTH_SERVICE_URL: http://auth-service:3001
  PRODUCT_SERVICE_URL: http://product-service:3002
  CART_SERVICE_URL: http://cart-service:3003
  ORDER_SERVICE_URL: http://order-service:3004
  KAFKA_BROKER: kafka:29092
  MONGODB_HOST: mongodb
  REDIS_HOST: redis
```

---

## Secrets

```bash
# Create secrets
kubectl create secret generic db-credentials \
  --from-literal=mongo-username=admin \
  --from-literal=mongo-password=admin@123 \
  -n ecommerce

kubectl create secret generic redis-credentials \
  --from-literal=password=redis@123 \
  -n ecommerce

kubectl create secret generic jwt-secret \
  --from-literal=secret=your_jwt_secret_key \
  -n ecommerce
```

---

## Deployments

### Auth Service Deployment

```yaml
# auth-service-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-service
  namespace: ecommerce
  labels:
    app: auth-service
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: auth-service
  template:
    metadata:
      labels:
        app: auth-service
    spec:
      serviceAccountName: auth-service
      containers:
      - name: auth-service
        image: registry.example.com/ecommerce/auth-service:1.0.0
        imagePullPolicy: Always
        ports:
        - containerPort: 3001
          name: http
        envFrom:
        - configMapRef:
            name: app-config
        - secretRef:
            name: db-credentials
        - secretRef:
            name: jwt-secret
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 10
          periodSeconds: 5
        volumeMounts:
        - name: logs
          mountPath: /app/logs
      volumes:
      - name: logs
        emptyDir: {}
```

---

## Services

### Auth Service

```yaml
# auth-service-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: auth-service
  namespace: ecommerce
  labels:
    app: auth-service
spec:
  type: ClusterIP
  selector:
    app: auth-service
  ports:
  - name: http
    port: 3001
    targetPort: 3001
    protocol: TCP
```

### Load Balancer Service (Gateway)

```yaml
# gateway-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: gateway
  namespace: ecommerce
spec:
  type: LoadBalancer
  selector:
    app: nginx-gateway
  ports:
  - name: http
    port: 80
    targetPort: 80
    protocol: TCP
  - name: https
    port: 443
    targetPort: 443
    protocol: TCP
```

---

## Ingress

```yaml
# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ecommerce-ingress
  namespace: ecommerce
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/rate-limit: "100"
spec:
  tls:
  - hosts:
    - api.example.com
    secretName: ecommerce-tls
  rules:
  - host: api.example.com
    http:
      paths:
      - path: /api/auth
        pathType: Prefix
        backend:
          service:
            name: auth-service
            port:
              number: 3001
      - path: /api/products
        pathType: Prefix
        backend:
          service:
            name: product-service
            port:
              number: 3002
      - path: /api/cart
        pathType: Prefix
        backend:
          service:
            name: cart-service
            port:
              number: 3003
      - path: /api/orders
        pathType: Prefix
        backend:
          service:
            name: order-service
            port:
              number: 3004
```

---

## StatefulSets

### MongoDB StatefulSet

```yaml
# mongodb-statefulset.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: mongodb
  namespace: ecommerce
spec:
  serviceName: mongodb
  replicas: 3
  selector:
    matchLabels:
      app: mongodb
  template:
    metadata:
      labels:
        app: mongodb
    spec:
      containers:
      - name: mongodb
        image: mongo:7.0
        ports:
        - containerPort: 27017
          name: mongo
        env:
        - name: MONGO_INITDB_ROOT_USERNAME
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: mongo-username
        - name: MONGO_INITDB_ROOT_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: mongo-password
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        volumeMounts:
        - name: mongo-data
          mountPath: /data/db
  volumeClaimTemplates:
  - metadata:
      name: mongo-data
    spec:
      accessModes: [ "ReadWriteOnce" ]
      storageClassName: fast-storage
      resources:
        requests:
          storage: 50Gi
```

---

## Horizontal Pod Autoscaler

```yaml
# hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: auth-service-hpa
  namespace: ecommerce
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: auth-service
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 100
        periodSeconds: 30
```

---

## Deployment Steps

```bash
# Create namespace
kubectl create namespace ecommerce

# Create secrets
kubectl create secret generic db-credentials \
  --from-literal=mongo-username=admin \
  --from-literal=mongo-password=admin@123 \
  -n ecommerce

# Create ConfigMaps
kubectl apply -f configmap.yaml

# Deploy databases
kubectl apply -f mongodb-statefulset.yaml
kubectl apply -f redis-statefulset.yaml

# Deploy services
kubectl apply -f auth-service-deployment.yaml
kubectl apply -f auth-service-service.yaml
kubectl apply -f product-service-deployment.yaml
# ... repeat for other services

# Deploy ingress
kubectl apply -f ingress.yaml

# Verify deployment
kubectl get deployments -n ecommerce
kubectl get services -n ecommerce
kubectl get pods -n ecommerce
```

---

## Monitoring & Logging

### Prometheus Deployment

```yaml
# prometheus-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: prometheus
  namespace: ecommerce
spec:
  replicas: 1
  selector:
    matchLabels:
      app: prometheus
  template:
    metadata:
      labels:
        app: prometheus
    spec:
      containers:
      - name: prometheus
        image: prom/prometheus:latest
        ports:
        - containerPort: 9090
        volumeMounts:
        - name: config
          mountPath: /etc/prometheus
        - name: data
          mountPath: /prometheus
      volumes:
      - name: config
        configMap:
          name: prometheus-config
      - name: data
        emptyDir: {}
```

---

## Health Checks

### Liveness Probe

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 3001
  initialDelaySeconds: 30
  periodSeconds: 10
```

### Readiness Probe

```yaml
readinessProbe:
  httpGet:
    path: /ready
    port: 3001
  initialDelaySeconds: 10
  periodSeconds: 5
```

---

## Useful Commands

```bash
# View deployments
kubectl get deployments -n ecommerce

# View pods
kubectl get pods -n ecommerce

# View logs
kubectl logs -f deployment/auth-service -n ecommerce

# Execute command in pod
kubectl exec -it auth-service-0 -n ecommerce -- /bin/sh

# Scale deployment
kubectl scale deployment auth-service --replicas=5 -n ecommerce

# Update deployment
kubectl set image deployment/auth-service \
  auth-service=registry.example.com/ecommerce/auth-service:1.1.0 \
  -n ecommerce

# Describe pod
kubectl describe pod auth-service-0 -n ecommerce

# Port forward
kubectl port-forward svc/auth-service 3001:3001 -n ecommerce
```

---

## References

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Best Practices](https://kubernetes.io/docs/concepts/configuration/overview/)
- [Security](https://kubernetes.io/docs/concepts/security/)
