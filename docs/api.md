# API Endpoints Documentation

This document contains all API endpoints for the e-commerce platform.

## Overview

All modules (auth, users, roles, products, categories, cart, orders, payments) are served by a single
application under the `/api` prefix.

---

## Base URLs

```
http://localhost:<PORT>/api
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
