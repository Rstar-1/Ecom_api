# API Endpoints Documentation

This document contains all API endpoints for the e-commerce platform.

## Overview

The platform provides four main services with REST APIs:
- **Auth Service** - User authentication and account management
- **Product Service** - Product catalog and inventory
- **Cart Service** - Shopping cart management
- **Order Service** - Order creation and processing

All requests go through the **API Gateway** (Port 5000).

---

## Base URLs

```
Gateway:       http://localhost:5000
Auth Service:  http://localhost:3001/api/auth
Product Service: http://localhost:3002/api/products
Cart Service:  http://localhost:3003/api/cart
Order Service: http://localhost:3004/api/orders
```

---

## Authentication

All endpoints (except login/register) require JWT token in Authorization header:

```
Authorization: Bearer <jwt_token>
```

---

## Auth Service Endpoints

### POST /auth/register
Register a new user account.

### POST /auth/login
Authenticate user with credentials.

### GET /auth/profile
Get current user profile.

### PUT /auth/profile
Update user profile.

### POST /auth/logout
Logout user.

---

## Product Service Endpoints

### GET /products
List all products with pagination and filtering.

### GET /products/:id
Get single product details.

### POST /products
Create new product (admin only).

### PUT /products/:id
Update product (admin only).

### DELETE /products/:id
Delete product (admin only).

---

## Cart Service Endpoints

### GET /cart
Get user's shopping cart.

### POST /cart/add
Add item to cart.

### DELETE /cart/:itemId
Remove item from cart.

### PUT /cart/:itemId
Update item quantity.

---

## Order Service Endpoints

### POST /orders
Create new order.

### GET /orders
Get user's orders.

### GET /orders/:id
Get order details.

### PUT /orders/:id
Update order status (admin only).

---

## Response Format

### Success Response (200)
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {}
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": []
  }
}
```

---

## Status Codes

- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Server Error
