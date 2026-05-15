# Gateway

This folder contains the API gateway for the ecommerce platform.

## Structure

- `src/config` - environment and service configuration
- `src/routes` - express route definitions for each domain
- `src/proxies` - proxy handlers that forward requests to backend services
- `src/middlewares` - shared middleware for auth, rate limiting, and error handling
- `src/utils` - shared helpers for response formatting and logging
- `src/app.js` - express application setup
- `src/server.js` - entrypoint to start the gateway server

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Configure `.env` values if needed.

3. Start the gateway:

   ```bash
   npm run dev
   ```
