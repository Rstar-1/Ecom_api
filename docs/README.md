# Ecom API docs

- [Architecture](architecture.md) – modular monolith layout
- [Setup](setup.md) – env variables, scripts, Docker
- [API](api.md) – endpoints
- [Security](security.md)

## Endpoints at a glance (all under `/api`)

| Prefix | Module |
| --- | --- |
| `/auth` | register (multipart), verify-otp, login, logout |
| `/users` | profile, list, update, upload-documents |
| `/roles` | CRUD (admin) |
| `/products`, `/categories` | catalog CRUD |
| `/cart` | get, add, update, remove/:productId, clear |
| `/orders` | create from cart, list mine, get, cancel, status (admin/vendor) |
| `/payments` | Razorpay create-order / verify, COD, get |

Also: `GET /health`, static files at `/uploads`.
