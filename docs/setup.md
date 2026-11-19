# Setup

## Requirements

- Node.js 20+
- A MongoDB database (local or Atlas)

## Environment

Variables are loaded from `env/dev.env` (`NODE_ENV=development`), `env/staging.env` or `env/prod.env`.

| Variable | Required | Default | Notes |
| --- | --- | --- | --- |
| `DATABASE` | yes | | MongoDB connection string |
| `JWT_SECRET` | yes | | |
| `PORT` | no | `3000` | |
| `JWT_EXPIRES_IN` | no | `1d` | |
| `OTP_EXPIRY_MINUTES` | no | `5` | |
| `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX` | no | `900000` / `100` | |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | for online payments | | App starts without them; Razorpay endpoints return an error |

Values already set in the real environment (shell, `docker run -e`) take priority over the env file.
The old per-service variables (`*_PORT`, `*_SERVICE_URL`, `GATEWAY_PORT`) are no longer used.

## Run

```bash
npm install
npm run dev        # tsc-watch: compiles to dist/, then runs `npm start`; restarts on every successful rebuild
npm run typecheck  # tsc --noEmit
npm run build      # compile to dist/
npm start          # run dist/server.js
```

## Docker

```bash
docker build -t ecom-api .
docker run --env-file env/prod.env -e NODE_ENV=production -p 5000:5000 ecom-api
```
