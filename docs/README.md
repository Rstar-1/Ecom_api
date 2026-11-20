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

## Modules ported from feature/practice

| Prefix | Endpoints | Access |
| --- | --- | --- |
| `/auth` | also forgot-password, verify-forgot-otp, reset-password | public |
| `/users` | list, get, update, delete, bulk-delete, upload-documents | login + USER_* |
| `/roles` | CRUD + bulk-delete | GET public, writes ROLE_* |
| `/products`, `/categories`, `/product-categories` | CRUD, bulk-delete, product reviews | GET public, writes PRODUCT_* / CATEGORY_* |
| `/blogs`, `/blog-categories`, `/blogs/categories` | CRUD, bulk-delete, reviews | GET public, writes BLOG_* |
| `/leads` | create, list, get, update, severity, delete, bulk-delete | create public, rest LEAD_* |
| `/campaigns` | templates, recipients, create, send, CRUD, Twilio webhook | CAMPAIGN_* (webhook checks Twilio signature) |
| `/seo` | list, by-path, page/:page, CRUD, bulk-delete, seed, upload | GET public, writes SEO_MANAGE |

Admin and manager roles, and users with the `*` or `Full_Access` permission, pass every permission check.
