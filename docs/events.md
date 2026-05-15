# Kafka Events & Topics Documentation

## Overview

Kafka provides event streaming for asynchronous communication between microservices. This document details all events, topics, and their schemas.

---

## Kafka Topics

### auth.* - Authentication Events

#### auth.user.created
Published when a new user registers.

**Topic**: `auth.user.created`

```json
{
  "event_type": "user.created",
  "user_id": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "customer",
  "created_at": "2024-04-20T10:00:00Z",
  "metadata": {
    "source": "auth-service",
    "timestamp": "2024-04-20T10:00:00Z",
    "trace_id": "trace_123456"
  }
}
```

**Consumers**: Product Service (cache), Cart Service (cache), Order Service (cache)

---

#### auth.user.updated
Published when user profile is updated.

**Topic**: `auth.user.updated`

```json
{
  "event_type": "user.updated",
  "user_id": "507f1f77bcf86cd799439011",
  "changes": {
    "name": "John Smith",
    "email": "newmail@example.com"
  },
  "updated_at": "2024-04-20T15:30:00Z",
  "metadata": {
    "source": "auth-service",
    "timestamp": "2024-04-20T15:30:00Z"
  }
}
```

---

#### auth.user.deleted
Published when a user account is deleted.

**Topic**: `auth.user.deleted`

```json
{
  "event_type": "user.deleted",
  "user_id": "507f1f77bcf86cd799439011",
  "deleted_at": "2024-04-20T16:00:00Z",
  "metadata": {
    "source": "auth-service",
    "timestamp": "2024-04-20T16:00:00Z"
  }
}
```

**Consumers**: Product Service, Cart Service, Order Service (cleanup)

---

### order.* - Order Events

#### order.created
Published when an order is created.

**Topic**: `order.created`

```json
{
  "event_type": "order.created",
  "order_id": "ord_507f1f77bcf86cd799439011",
  "user_id": "507f1f77bcf86cd799439011",
  "total_amount": 299.99,
  "items": [
    {
      "product_id": "prod_123",
      "quantity": 2,
      "price": 149.99
    }
  ],
  "created_at": "2024-04-20T10:30:00Z",
  "metadata": {
    "source": "order-service",
    "timestamp": "2024-04-20T10:30:00Z"
  }
}
```

**Consumers**: Inventory Service (stock reduction), Notification Service (order confirmation)

---

#### order.shipped
Published when order is shipped.

**Topic**: `order.shipped`

```json
{
  "event_type": "order.shipped",
  "order_id": "ord_507f1f77bcf86cd799439011",
  "tracking_number": "TRACK123456",
  "shipped_at": "2024-04-20T14:00:00Z",
  "metadata": {
    "source": "order-service",
    "timestamp": "2024-04-20T14:00:00Z"
  }
}
```

**Consumers**: Notification Service (shipping notification)

---

#### order.delivered
Published when order is delivered.

**Topic**: `order.delivered`

```json
{
  "event_type": "order.delivered",
  "order_id": "ord_507f1f77bcf86cd799439011",
  "delivered_at": "2024-04-20T18:00:00Z",
  "metadata": {
    "source": "order-service",
    "timestamp": "2024-04-20T18:00:00Z"
  }
}
```

---

### payment.* - Payment Events

#### payment.completed
Published when payment is successfully processed.

**Topic**: `payment.completed`

```json
{
  "event_type": "payment.completed",
  "payment_id": "pay_507f1f77bcf86cd799439011",
  "order_id": "ord_507f1f77bcf86cd799439011",
  "amount": 299.99,
  "currency": "USD",
  "status": "completed",
  "completed_at": "2024-04-20T10:35:00Z",
  "metadata": {
    "source": "payment-service",
    "timestamp": "2024-04-20T10:35:00Z"
  }
}
```

**Consumers**: Order Service (order confirmation), Notification Service

---

#### payment.failed
Published when payment fails.

**Topic**: `payment.failed`

```json
{
  "event_type": "payment.failed",
  "payment_id": "pay_507f1f77bcf86cd799439011",
  "order_id": "ord_507f1f77bcf86cd799439011",
  "reason": "Insufficient funds",
  "failed_at": "2024-04-20T10:35:00Z",
  "metadata": {
    "source": "payment-service",
    "timestamp": "2024-04-20T10:35:00Z"
  }
}
```

**Consumers**: Order Service (cleanup), Notification Service (retry notification)

---

## Event Consumer Configuration

### Kafka Consumer Groups

| Consumer Group | Service | Topics |
|---|---|---|
| `auth-consumers` | Auth Service | auth.* |
| `product-consumers` | Product Service | auth.user.*, order.created |
| `cart-consumers` | Cart Service | auth.user.*, order.created |
| `order-consumers` | Order Service | payment.* |
| `notification-consumers` | Notification Service | order.*, payment.* |

---

## Event Publishing Pattern

All services follow this pattern for publishing events:

```javascript
const event = {
  event_type: 'entity.action',
  entity_id: 'id_value',
  timestamp: new Date().toISOString(),
  data: { /* event data */ },
  metadata: {
    source: 'service-name',
    trace_id: 'trace_id_value'
  }
};

await producer.send({
  topic: 'topic.name',
  messages: [{ value: JSON.stringify(event) }]
});
```

---

## Retry & Dead Letter Topic

- Failed messages are retried 3 times
- Messages after 3 failures go to `dead-letter-queue`
- Dead letter queue monitored for manual intervention

---

## Monitoring Events

### Kafka CLI Commands

```bash
# List all topics
kafka-topics --list --bootstrap-server localhost:9092

# Describe topic
kafka-topics --describe --topic auth.user.created --bootstrap-server localhost:9092

# Consume events
kafka-console-consumer --topic auth.user.created --bootstrap-server localhost:9092 --from-beginning
```
