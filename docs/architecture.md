# Architecture

The API is a **single TypeScript application** (modular monolith) built on Express 5 and MongoDB (Mongoose).
There is no API gateway, message broker (Kafka) or cache (Redis): every module runs in the same process
and modules call each other directly through their service functions.

```
src/
  server.ts            # boot: connect MongoDB, start HTTP server, graceful shutdown
  app.ts               # express app: helmet, cors, json, morgan, rate limit, /uploads, /api, errors
  config/              # env loading (env/<dev|staging|prod>.env) and DB connection
  constants/           # messages, roles, HTTP status codes
  middlewares/         # auth (JWT), RBAC, rate limit, multer upload, error / 404 handlers
  models/              # Mongoose models: User, Role, Otp, Category, Product, Cart, Order, Payment
  modules/<feature>/   # *.routes.ts -> *.controller.ts -> *.service.ts
    auth  users  roles  products  categories  cart  orders  payments
  routes/index.ts      # mounts every module under /api
  types/express.d.ts   # typed req.user
```

## Cross-module calls

| Flow | Before (microservices) | Now |
| --- | --- | --- |
| Create order | order-service → HTTP → cart-service | `orders` service calls `cart` service functions |
| Verify payment / COD | payment-service → HTTP → order-service | `payments` service calls `orders.updatePaymentStatus` |

## Request flow

`request → helmet/cors/body parsers → rate limiter → /api router → authMiddleware → checkPermission/authorizeRoles → controller → service → Mongoose`

Errors thrown in services propagate through `asyncHandler` to `errorMiddleware`, which returns
`{ success: false, message }`.
